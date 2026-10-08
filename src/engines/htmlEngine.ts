import { VirtualFile } from '../types/game';
import { generateInterceptorScript } from '../utils/assetInterceptor';

export function prepareHtmlRunner(files: VirtualFile[], entryFile: string): string {
  const fileObj = files.find(f => f.path === entryFile);
  const interceptor = generateInterceptorScript(files, entryFile);

  let rawHtml = '';
  if (fileObj && fileObj.text) {
    rawHtml = fileObj.text;
  } else if (fileObj && fileObj.rawBytes) {
    rawHtml = new TextDecoder('utf-8').decode(fileObj.rawBytes);
  } else {
    // If entry file is .js, generate a minimal HTML canvas container
    const isJs = entryFile.endsWith('.js') || entryFile.endsWith('.mjs');
    if (isJs) {
      const jsFile = files.find(f => f.path === entryFile);
      const jsCode = jsFile?.text || (jsFile?.rawBytes ? new TextDecoder().decode(jsFile.rawBytes) : '');
      rawHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Arcade Game</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #090d16; color: #fff; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
    canvas { display: block; max-width: 100vw; max-height: 100vh; image-rendering: pixelated; }
  </style>
</head>
<body>
  <canvas id="game-canvas" width="800" height="600"></canvas>
  <script>
    ${jsCode}
  </script>
</body>
</html>`;
    } else {
      rawHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Jeu</title></head>
<body style="background:#090d16;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;">
  <p>Fichier d'entrée non trouvé: ${entryFile}</p>
</body>
</html>`;
    }
  }

  // 1. INLINE matching scripts to prevent the browser from requesting the server
  files.forEach(f => {
    if (f.extension === 'js' || f.extension === 'mjs') {
      const code = f.text || (f.rawBytes ? new TextDecoder().decode(f.rawBytes) : '');
      const pathEscaped = f.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match <script src="path"></script> or <script src="./path"></script>
      const re = new RegExp(`<script[^>]*src=["'](\\./)?${pathEscaped}["'][^>]*>\\s*<\\/script>`, 'gi');
      rawHtml = rawHtml.replace(re, `<script data-inlined="${f.path}">\n${code}\n</script>`);
    }

    if (f.extension === 'css') {
      const css = f.text || (f.rawBytes ? new TextDecoder().decode(f.rawBytes) : '');
      const pathEscaped = f.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`<link[^>]*href=["'](\\./)?${pathEscaped}["'][^>]*>`, 'gi');
      rawHtml = rawHtml.replace(re, `<style data-inlined="${f.path}">\n${css}\n</style>`);
    }

    if (f.category === 'image') {
      const pathEscaped = f.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`src=["'](\\./)?${pathEscaped}["']`, 'gi');
      rawHtml = rawHtml.replace(re, `src="${f.blobUrl}"`);
    }
  });

  // 2. Inject interceptor right at the top of <head>
  const scriptTag = `<script>\n${interceptor}\n</script>`;
  let modifiedHtml = rawHtml;

  if (/<head[^>]*>/i.test(modifiedHtml)) {
    modifiedHtml = modifiedHtml.replace(/(<head[^>]*>)/i, `$1\n${scriptTag}`);
  } else if (/<html[^>]*>/i.test(modifiedHtml)) {
    modifiedHtml = modifiedHtml.replace(/(<html[^>]*>)/i, `$1\n<head>${scriptTag}</head>`);
  } else {
    modifiedHtml = `<head>${scriptTag}</head>\n` + modifiedHtml;
  }

  return modifiedHtml;
}
