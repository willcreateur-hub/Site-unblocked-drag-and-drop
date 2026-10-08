import JSZip from 'jszip';
import { AssetCategory, GameMetadata, LoadedGame, SupportedEngine, VirtualFile } from '../types/game';

export const MIME_MAP: Record<string, string> = {
  // Images
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  gif: 'image/gif',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  // 3D Models
  glb: 'model/gltf-binary',
  gltf: 'model/gltf+json',
  obj: 'text/plain',
  fbx: 'application/octet-stream',
  mtl: 'text/plain',
  stl: 'model/stl',
  // Audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  // Data
  json: 'application/json',
  xml: 'application/xml',
  txt: 'text/plain',
  csv: 'text/csv',
  bin: 'application/octet-stream',
  // Code & Web
  html: 'text/html',
  htm: 'text/html',
  js: 'application/javascript',
  mjs: 'application/javascript',
  css: 'text/css',
  wasm: 'application/wasm',
  py: 'text/x-python',
  lua: 'text/x-lua',
  cs: 'text/x-csharp',
  c: 'text/x-c',
  cpp: 'text/x-c++',
  cc: 'text/x-c++',
  h: 'text/x-c-header',
  hpp: 'text/x-c-header',
  glsl: 'text/plain',
  vert: 'text/plain',
  frag: 'text/plain',
};

export function getExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return parts[parts.length - 1].toLowerCase();
}

export function categorizeFile(ext: string): AssetCategory {
  switch (ext) {
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
    case 'svg':
    case 'gif':
    case 'bmp':
    case 'ico':
      return 'image';
    case 'glb':
    case 'gltf':
    case 'obj':
    case 'fbx':
    case 'mtl':
    case 'stl':
      return '3d';
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
    case 'm4a':
      return 'audio';
    case 'json':
    case 'xml':
    case 'txt':
    case 'csv':
    case 'bin':
      return 'data';
    case 'html':
    case 'htm':
    case 'js':
    case 'mjs':
    case 'css':
    case 'wasm':
    case 'py':
    case 'lua':
    case 'cs':
    case 'c':
    case 'cpp':
    case 'cc':
    case 'h':
    case 'hpp':
    case 'glsl':
    case 'vert':
    case 'frag':
      return 'code';
    default:
      return 'other';
  }
}

export function detectEngineAndEntry(files: VirtualFile[]): { engine: SupportedEngine; entryFile: string } {
  const paths = files.map(f => f.path.toLowerCase());

  // 1. Check for standard HTML entry points
  const htmlIndex = files.find(f => f.path.toLowerCase() === 'index.html' || f.path.toLowerCase().endsWith('/index.html'));
  if (htmlIndex) return { engine: 'html', entryFile: htmlIndex.path };

  const anyHtml = files.find(f => f.extension === 'html' || f.extension === 'htm');
  if (anyHtml) return { engine: 'html', entryFile: anyHtml.path };

  // 2. Check for WebAssembly
  const wasmFile = files.find(f => f.extension === 'wasm');
  if (wasmFile) return { engine: 'wasm', entryFile: wasmFile.path };

  // 3. Check for Python
  const mainPy = files.find(f => f.name.toLowerCase() === 'main.py' || f.name.toLowerCase() === 'game.py');
  if (mainPy) return { engine: 'python', entryFile: mainPy.path };
  const anyPy = files.find(f => f.extension === 'py');
  if (anyPy) return { engine: 'python', entryFile: anyPy.path };

  // 4. Check for Lua
  const mainLua = files.find(f => f.name.toLowerCase() === 'main.lua' || f.name.toLowerCase() === 'game.lua');
  if (mainLua) return { engine: 'lua', entryFile: mainLua.path };
  const anyLua = files.find(f => f.extension === 'lua');
  if (anyLua) return { engine: 'lua', entryFile: anyLua.path };

  // 5. Check for C#
  const mainCs = files.find(f => f.name.toLowerCase() === 'game.cs' || f.name.toLowerCase() === 'main.cs');
  if (mainCs) return { engine: 'csharp', entryFile: mainCs.path };
  const anyCs = files.find(f => f.extension === 'cs');
  if (anyCs) return { engine: 'csharp', entryFile: anyCs.path };

  // 6. Check for C++
  const mainCpp = files.find(f => f.name.toLowerCase() === 'main.cpp' || f.name.toLowerCase() === 'game.cpp' || f.name.toLowerCase() === 'main.c');
  if (mainCpp) return { engine: 'cpp', entryFile: mainCpp.path };
  const anyCpp = files.find(f => f.extension === 'cpp' || f.extension === 'c');
  if (anyCpp) return { engine: 'cpp', entryFile: anyCpp.path };

  // 7. Check for JS
  const mainJs = files.find(f => f.name.toLowerCase() === 'main.js' || f.name.toLowerCase() === 'game.js' || f.name.toLowerCase() === 'index.js');
  if (mainJs) return { engine: 'js', entryFile: mainJs.path };
  const anyJs = files.find(f => f.extension === 'js');
  if (anyJs) return { engine: 'js', entryFile: anyJs.path };

  // Fallback to first file or empty
  return {
    engine: 'html',
    entryFile: files[0]?.path || 'index.html',
  };
}

export async function processZipFile(file: File | Blob, customTitle?: string): Promise<LoadedGame> {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);

  const fileMap = new Map<string, VirtualFile>();
  const fileList: VirtualFile[] = [];
  let totalBytes = 0;
  let coverImage: string | undefined;

  const entries = Object.keys(zipContent.files);

  for (const rawPath of entries) {
    const zipEntry = zipContent.files[rawPath];
    if (zipEntry.dir) continue; // Skip folders

    // Normalize path: strip leading slashes and __MACOSX / .DS_Store
    let normPath = rawPath.replace(/^\/+/, '');
    if (normPath.startsWith('__MACOSX') || normPath.endsWith('.DS_Store')) {
      continue;
    }

    const name = normPath.split('/').pop() || normPath;
    const ext = getExtension(name);
    const mimeType = MIME_MAP[ext] || 'application/octet-stream';
    const category = categorizeFile(ext);

    // Read bytes
    const rawBytes = await zipEntry.async('uint8array');
    totalBytes += rawBytes.length;

    // Check if text readable
    let textContent: string | undefined;
    if (category === 'code' || category === 'data' || ext === 'obj' || ext === 'mtl') {
      try {
        textContent = new TextDecoder('utf-8').decode(rawBytes);
      } catch {
        // Not valid text
      }
    }

    const blob = new Blob([rawBytes as any], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    const vFile: VirtualFile = {
      path: normPath,
      name,
      extension: ext,
      size: rawBytes.length,
      mimeType,
      category,
      blobUrl,
      text: textContent,
      rawBytes,
    };

    fileMap.set(normPath, vFile);
    fileList.push(vFile);

    // If icon/cover image found
    if (!coverImage && (name.toLowerCase().includes('cover') || name.toLowerCase().includes('icon') || name.toLowerCase().includes('thumbnail') || name.toLowerCase().includes('preview')) && category === 'image') {
      coverImage = blobUrl;
    }
  }

  // If no cover was identified, look for first image
  if (!coverImage) {
    const firstImg = fileList.find(f => f.category === 'image');
    if (firstImg) coverImage = firstImg.blobUrl;
  }

  // Detect metadata or manifest.json / package.json / game.json
  let title = customTitle || (file instanceof File ? file.name.replace(/\.zip$/i, '') : 'Jeu sans titre');
  let description = 'Archive de jeu extraite avec succès.';
  let author = 'Auteur Inconnu';
  let version = '1.0.0';

  const manifestFile = fileList.find(f => f.name.toLowerCase() === 'game.json' || f.name.toLowerCase() === 'manifest.json');
  if (manifestFile && manifestFile.text) {
    try {
      const manifest = JSON.parse(manifestFile.text);
      if (manifest.title || manifest.name) title = manifest.title || manifest.name;
      if (manifest.description) description = manifest.description;
      if (manifest.author) author = manifest.author;
      if (manifest.version) version = manifest.version;
    } catch {
      // Manifest parsing optional
    }
  }

  const { engine, entryFile } = detectEngineAndEntry(fileList);

  const tags: string[] = [engine.toUpperCase()];
  const has3D = fileList.some(f => f.category === '3d');
  const hasAudio = fileList.some(f => f.category === 'audio');
  const hasImages = fileList.some(f => f.category === 'image');
  const hasWasm = fileList.some(f => f.extension === 'wasm');

  if (has3D) tags.push('3D (GLTF/OBJ)');
  if (hasAudio) tags.push('Audio (WAV/MP3)');
  if (hasImages) tags.push('Assets 2D');
  if (hasWasm && engine !== 'wasm') tags.push('WebAssembly');

  const metadata: GameMetadata = {
    id: 'game_' + Math.random().toString(36).substring(2, 9),
    title,
    description,
    author,
    version,
    engine,
    entryFile,
    coverImage,
    tags,
    filesCount: fileList.length,
    totalSize: totalBytes,
    uploadedAt: Date.now(),
  };

  return {
    metadata,
    files: fileMap,
    fileList,
  };
}

export async function exportGameAsZip(game: LoadedGame): Promise<Blob> {
  const zip = new JSZip();

  for (const file of game.fileList) {
    if (file.rawBytes) {
      zip.file(file.path, file.rawBytes);
    } else if (file.text) {
      zip.file(file.path, file.text);
    } else {
      // Fetch from blobUrl
      const res = await fetch(file.blobUrl);
      const ab = await res.arrayBuffer();
      zip.file(file.path, ab);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
