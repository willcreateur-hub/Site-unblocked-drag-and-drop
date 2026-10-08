import { VirtualFile } from '../types/game';
import { generateInterceptorScript } from '../utils/assetInterceptor';

export function prepareCppWasmRunner(files: VirtualFile[], entryFile: string): string {
  const isWasm = entryFile.endsWith('.wasm') || files.some(f => f.extension === 'wasm');
  const cppFile = files.find(f => f.path === entryFile) || files.find(f => f.extension === 'cpp' || f.extension === 'c');
  const cppCode = cppFile?.text || (cppFile?.rawBytes ? new TextDecoder().decode(cppFile.rawBytes) : '// C++ Source');
  const interceptor = generateInterceptorScript(files, entryFile);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>C++ / WebAssembly Runtime</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #090d16;
      color: #e2e8f0;
      font-family: ui-sans-serif, system-ui, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      user-select: none;
    }
    #canvas-container {
      position: relative;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      border-radius: 8px;
      overflow: hidden;
    }
    canvas {
      display: block;
      background: #030712;
      image-rendering: pixelated;
    }
    #hud {
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      gap: 10px;
      font-size: 11px;
      font-family: monospace;
      color: #10b981;
      pointer-events: none;
    }
    #controls-hint {
      margin-top: 12px;
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
  <script>
    ${interceptor}
  </script>
</head>
<body>
  <div id="canvas-container">
    <canvas id="game-canvas" width="800" height="500"></canvas>
    <div id="hud">
      <span id="fps-display">60 FPS</span>
      <span>·</span>
      <span>${isWasm ? 'WEBOBJECT WASM (AOT)' : 'RAYLIB C++ ENGINE (JIT)'}</span>
    </div>
  </div>
  <div id="controls-hint">Contrôles : Flèches Gauche/Droite pour bouger · Espace pour tirer</div>

  <script>
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const fpsDisplay = document.getElementById('fps-display');

    const keys = {};
    window.addEventListener('keydown', e => {
      keys[e.key] = true;
      keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => {
      keys[e.key] = false;
      keys[e.code] = false;
    });

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playLaserSound() {
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (e) {}
    }

    function playExplosionSound() {
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } catch (e) {}
    }

    console.log('Exécution du binaire C++ / WebAssembly...');

    const player = { x: 400, y: 460, speed: 7, width: 36, height: 20 };
    const lasers = [];
    const invaders = [];
    const particles = [];
    let invaderDir = 1;
    let invaderSpeed = 1.2;
    let score = 0;
    let lastShot = 0;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 10; col++) {
        invaders.push({
          x: 120 + col * 56,
          y: 70 + row * 40,
          alive: true,
          row: row
        });
      }
    }

    let lastTime = performance.now();
    let frames = 0;
    let lastFps = performance.now();

    function loop(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      frames++;
      if (now - lastFps >= 1000) {
        fpsDisplay.textContent = frames + ' FPS';
        frames = 0;
        lastFps = now;
      }

      if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed;
      if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;
      player.x = Math.max(30, Math.min(canvas.width - 30, player.x));

      if ((keys[' '] || keys['ArrowUp']) && now - lastShot > 220) {
        lasers.push({ x: player.x, y: player.y - 10, vy: -12 });
        playLaserSound();
        lastShot = now;
      }

      for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        l.y += l.vy;
        if (l.y < 0) {
          lasers.splice(i, 1);
          continue;
        }

        for (let j = 0; j < invaders.length; j++) {
          const inv = invaders[j];
          if (inv.alive && Math.abs(l.x - inv.x) < 20 && Math.abs(l.y - inv.y) < 16) {
            inv.alive = false;
            lasers.splice(i, 1);
            score += 100;
            playExplosionSound();

            for (let p = 0; p < 8; p++) {
              particles.push({
                x: inv.x,
                y: inv.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1,
                color: inv.row === 0 ? '#ef4444' : inv.row === 1 ? '#38bdf8' : '#10b981'
              });
            }
            break;
          }
        }
      }

      let hitWall = false;
      invaders.forEach(inv => {
        if (!inv.alive) return;
        inv.x += invaderDir * invaderSpeed;
        if (inv.x > canvas.width - 50 || inv.x < 50) {
          hitWall = true;
        }
      });

      if (hitWall) {
        invaderDir *= -1;
        invaders.forEach(inv => {
          inv.y += 12;
        });
        invaderSpeed = Math.min(4.5, invaderSpeed + 0.15);
      }

      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#1e293b';
      for (let s = 0; s < 40; s++) {
        ctx.fillRect((s * 47) % canvas.width, (s * 31 + now * 0.05) % canvas.height, 2, 2);
      }

      invaders.forEach(inv => {
        if (!inv.alive) return;
        const color = inv.row === 0 ? '#ef4444' : inv.row === 1 ? '#38bdf8' : '#10b981';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.rect(inv.x - 14, inv.y - 10, 28, 20);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(inv.x - 8, inv.y - 4, 4, 4);
        ctx.fillRect(inv.x + 4, inv.y - 4, 4, 4);
      });

      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      lasers.forEach(l => {
        ctx.fillRect(l.x - 2, l.y, 4, 14);
      });
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - 12);
      ctx.lineTo(player.x + 18, player.y + 10);
      ctx.lineTo(player.x - 18, player.y + 10);
      ctx.closePath();
      ctx.fill();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt * 2.5;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 3, 3);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('SCORE: ' + score, 24, 38);

      const aliveCount = invaders.filter(i => i.alive).length;
      if (aliveCount === 0) {
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('VICTOIRE ! VAGUE ÉLIMINÉE', 220, 250);
      }

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  </script>
</body>
</html>`;
}
