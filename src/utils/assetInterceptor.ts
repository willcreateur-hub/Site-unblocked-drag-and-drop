import { VirtualFile } from '../types/game';

/**
 * Builds the inline JavaScript polyfill that injects into the sandboxed game iframe.
 * It intercepts all asset loading (fetch, XHR, Image, Audio, WebAssembly)
 * to seamlessly serve files from the in-memory Virtual File System (VFS).
 * It guarantees that NO relative request ever leaks to the external server.
 */
export function generateInterceptorScript(files: VirtualFile[], entryPath: string): string {
  const blobMap: Record<string, string> = {};
  const mimeMap: Record<string, string> = {};
  const sizeMap: Record<string, number> = {};
  const textMap: Record<string, string> = {};

  const entryDir = entryPath.includes('/') ? entryPath.substring(0, entryPath.lastIndexOf('/') + 1) : '';

  files.forEach(f => {
    blobMap[f.path] = f.blobUrl;
    mimeMap[f.path] = f.mimeType;
    sizeMap[f.path] = f.size;
    if (f.text !== undefined) {
      textMap[f.path] = f.text;
    }

    // Also index without leading slash or relative prefix
    const cleanPath = f.path.replace(/^\.?\//, '');
    blobMap[cleanPath] = f.blobUrl;
    blobMap['./' + cleanPath] = f.blobUrl;
    blobMap['/' + cleanPath] = f.blobUrl;
    mimeMap[cleanPath] = f.mimeType;
    mimeMap['./' + cleanPath] = f.mimeType;
    mimeMap['/' + cleanPath] = f.mimeType;
    if (f.text !== undefined) {
      textMap[cleanPath] = f.text;
      textMap['./' + cleanPath] = f.text;
    }

    // If file is inside entryDir, index relative to entryDir
    if (entryDir && f.path.startsWith(entryDir)) {
      const relPath = f.path.substring(entryDir.length);
      blobMap[relPath] = f.blobUrl;
      blobMap['./' + relPath] = f.blobUrl;
      mimeMap[relPath] = f.mimeType;
      mimeMap['./' + relPath] = f.mimeType;
      if (f.text !== undefined) {
        textMap[relPath] = f.text;
        textMap['./' + relPath] = f.text;
      }
    }
  });

  return `
(function() {
  window.__VFS_BLOBS__ = ${JSON.stringify(blobMap)};
  window.__VFS_MIMES__ = ${JSON.stringify(mimeMap)};
  window.__VFS_SIZES__ = ${JSON.stringify(sizeMap)};
  window.__VFS_TEXTS__ = ${JSON.stringify(textMap)};
  window.__VFS_ENTRY_DIR__ = ${JSON.stringify(entryDir)};

  function isExternal(url) {
    if (!url || typeof url !== 'string') return true;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:');
  }

  // Path normalizer
  function resolveVfsPath(url) {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('blob:') || url.startsWith('data:')) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Check if this URL points to something like domain/path matching our VFS
      try {
        const parsed = new URL(url);
        url = parsed.pathname.replace(/^\\/+/, '');
      } catch(_) {
        return null;
      }
    }

    // Strip hash and query
    let clean = url.split('#')[0].split('?')[0];

    // Check direct match
    if (window.__VFS_BLOBS__[clean]) return window.__VFS_BLOBS__[clean];

    // Strip leading ./ or /
    clean = clean.replace(/^[\\.\\/]+/, '');
    if (window.__VFS_BLOBS__[clean]) return window.__VFS_BLOBS__[clean];

    // Try relative to entryDir
    if (window.__VFS_ENTRY_DIR__) {
      const combined = (window.__VFS_ENTRY_DIR__ + clean).replace(/\\/\\//g, '/');
      if (window.__VFS_BLOBS__[combined]) return window.__VFS_BLOBS__[combined];
    }

    // Try finding by filename
    const filename = clean.split('/').pop();
    for (const key in window.__VFS_BLOBS__) {
      if (key.endsWith('/' + filename) || key === filename) {
        return window.__VFS_BLOBS__[key];
      }
    }

    return null;
  }

  function getVfsMime(url) {
    let clean = (url || '').split('#')[0].split('?')[0].replace(/^[\\.\\/]+/, '');
    return window.__VFS_MIMES__[clean] || 'application/octet-stream';
  }

  // 1. Intercept window.fetch HERMETICALLY
  const originalFetch = window.fetch;
  window.fetch = async function(resource, init) {
    let urlStr = '';
    if (typeof resource === 'string') {
      urlStr = resource;
    } else if (resource && resource.url) {
      urlStr = resource.url;
    }

    const resolvedBlob = resolveVfsPath(urlStr);
    if (resolvedBlob) {
      try {
        const response = await originalFetch(resolvedBlob, init);
        return response;
      } catch (err) {
        console.warn('[VFS Fetch]', urlStr, err);
      }
    }

    // If it was a relative local asset not found in VFS, DO NOT request host server!
    // Returning a synthetic 404 in memory prevents Google 400/401 Bad Request errors
    if (!isExternal(urlStr)) {
      console.warn('[VFS 404] Fichier introuvable dans le ZIP:', urlStr);
      return new Response(JSON.stringify({ error: 'Fichier non trouvé dans le ZIP', file: urlStr }), {
        status: 404,
        statusText: 'Not Found',
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return originalFetch.call(this, resource, init);
  };

  // 2. Intercept XMLHttpRequest HERMETICALLY
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    const resolvedBlob = resolveVfsPath(url);
    if (resolvedBlob) {
      return originalXhrOpen.call(this, method, resolvedBlob, ...rest);
    }
    if (!isExternal(url)) {
      // Mock 404 for missing local file
      const emptyBlob = URL.createObjectURL(new Blob(['Not Found'], { type: 'text/plain' }));
      return originalXhrOpen.call(this, method, emptyBlob, ...rest);
    }
    return originalXhrOpen.call(this, method, url, ...rest);
  };

  // 3. Intercept HTMLImageElement.src
  const origImageSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  if (origImageSrcDescriptor && origImageSrcDescriptor.set) {
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      set: function(val) {
        const resolved = resolveVfsPath(val);
        return origImageSrcDescriptor.set.call(this, resolved || val);
      },
      get: function() {
        return origImageSrcDescriptor.get.call(this);
      }
    });
  }

  // 4. Intercept Audio.src
  const origAudioSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
  if (origAudioSrcDescriptor && origAudioSrcDescriptor.set) {
    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
      set: function(val) {
        const resolved = resolveVfsPath(val);
        return origAudioSrcDescriptor.set.call(this, resolved || val);
      },
      get: function() {
        return origAudioSrcDescriptor.get.call(this);
      }
    });
  }

  // 5. Intercept WebAssembly streaming
  if (window.WebAssembly) {
    const origInstantiateStreaming = WebAssembly.instantiateStreaming;
    WebAssembly.instantiateStreaming = async function(source, importObject) {
      try {
        const response = await (source instanceof Promise ? source : Promise.resolve(source));
        const buffer = await response.arrayBuffer();
        return WebAssembly.instantiate(buffer, importObject);
      } catch (e) {
        if (origInstantiateStreaming) {
          return origInstantiateStreaming.call(WebAssembly, source, importObject);
        }
        throw e;
      }
    };
  }

  // 6. Console Bridge to parent
  function sendConsole(level, args) {
    try {
      const msg = args.map(a => {
        if (typeof a === 'object') {
          try { return JSON.stringify(a); } catch(_) { return String(a); }
        }
        return String(a);
      }).join(' ');
      window.parent.postMessage({
        type: 'ARCADE_CONSOLE',
        level: level,
        message: msg,
        timestamp: new Date().toLocaleTimeString()
      }, '*');
    } catch (_) {}
  }

  const origLog = console.log;
  console.log = function(...args) {
    origLog.apply(console, args);
    sendConsole('info', args);
  };
  const origWarn = console.warn;
  console.warn = function(...args) {
    origWarn.apply(console, args);
    sendConsole('warn', args);
  };
  const origError = console.error;
  console.error = function(...args) {
    origError.apply(console, args);
    sendConsole('error', args);
  };

  // Catch unhandled errors
  window.addEventListener('error', function(event) {
    sendConsole('error', ['[Runtime Error]', event.message, 'at', event.filename + ':' + event.lineno]);
  });
  window.addEventListener('unhandledrejection', function(event) {
    sendConsole('error', ['[Unhandled Promise]', event.reason]);
  });

  // Notify parent of sandbox readiness
  window.addEventListener('DOMContentLoaded', function() {
    window.parent.postMessage({ type: 'ARCADE_READY' }, '*');
  });
})();
  `;
}
