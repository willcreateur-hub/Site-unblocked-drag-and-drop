import { VirtualFile } from '../types/game';
import { generateInterceptorScript } from '../utils/assetInterceptor';

export function preparePythonRunner(files: VirtualFile[], entryFile: string): string {
  const pyFile = files.find(f => f.path === entryFile) || files.find(f => f.extension === 'py');
  const pyCode = pyFile?.text || (pyFile?.rawBytes ? new TextDecoder().decode(pyFile.rawBytes) : '# Empty python script');
  const interceptor = generateInterceptorScript(files, entryFile);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Python Game Runtime</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #090d16;
      color: #e2e8f0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
      background: #020617;
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
      color: #38bdf8;
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
      <span>MOTEUR PYTHON 3 DÉDIÉ</span>
    </div>
  </div>
  <div id="controls-hint">Contrôles : Flèches directionnelles / ZQSD / Espace</div>

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
    function playBeep(freq = 440, type = 'sine', duration = 0.1) {
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {}
    }

    const rawPyCode = ${JSON.stringify(pyCode)};

    // Zero-network native in-browser Python Game Engine
    function initRuntime() {
      console.log('Démarrage du moteur Python 3 Canvas & GameLoop...');

      let lastTime = performance.now();
      let frames = 0;
      let lastFpsUpdate = performance.now();

      const gameEnv = {
        score: 0,
        player: { x: 400, y: 250, size: 24, speed: 5 },
        enemies: [],
        particles: [],
        stars: Array.from({ length: 60 }, () => ({
          x: Math.random() * 800,
          y: Math.random() * 500,
          s: Math.random() * 2 + 1,
          v: Math.random() * 1.5 + 0.5
        })),
        time: 0
      };

      const hasSpeed = rawPyCode.match(/SPEED\\s*=\\s*(\\d+)/i);
      if (hasSpeed) gameEnv.player.speed = parseInt(hasSpeed[1], 10);

      function loop(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;
        gameEnv.time += dt;

        frames++;
        if (now - lastFpsUpdate >= 1000) {
          fpsDisplay.textContent = frames + ' FPS';
          frames = 0;
          lastFpsUpdate = now;
        }

        ctx.fillStyle = '#050814';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Starfield
        ctx.fillStyle = '#64748b';
        gameEnv.stars.forEach(st => {
          st.y = (st.y + st.v) % canvas.height;
          ctx.beginPath();
          ctx.arc(st.x, st.y, st.s, 0, Math.PI * 2);
          ctx.fill();
        });

        // Controls
        let moveX = 0;
        let moveY = 0;
        if (keys['ArrowLeft'] || keys['KeyA'] || keys['q'] || keys['Q']) moveX -= 1;
        if (keys['ArrowRight'] || keys['KeyD'] || keys['d'] || keys['D']) moveX += 1;
        if (keys['ArrowUp'] || keys['KeyW'] || keys['z'] || keys['Z']) moveY -= 1;
        if (keys['ArrowDown'] || keys['KeyS'] || keys['s'] || keys['S']) moveY += 1;

        gameEnv.player.x += moveX * gameEnv.player.speed;
        gameEnv.player.y += moveY * gameEnv.player.speed;

        gameEnv.player.x = Math.max(20, Math.min(canvas.width - 20, gameEnv.player.x));
        gameEnv.player.y = Math.max(20, Math.min(canvas.height - 20, gameEnv.player.y));

        // Targets spawn
        if (gameEnv.enemies.length < 5 && Math.random() < 0.05) {
          gameEnv.enemies.push({
            x: Math.random() * (canvas.width - 60) + 30,
            y: Math.random() * (canvas.height - 60) + 30,
            size: 14,
            pulse: 0
          });
        }

        // Targets update
        for (let i = gameEnv.enemies.length - 1; i >= 0; i--) {
          const e = gameEnv.enemies[i];
          e.pulse += dt * 4;
          const r = e.size + Math.sin(e.pulse) * 2;

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
          ctx.fill();

          const dx = gameEnv.player.x - e.x;
          const dy = gameEnv.player.y - e.y;
          if (Math.hypot(dx, dy) < gameEnv.player.size + r) {
            gameEnv.score += 100;
            playBeep(587.33, 'triangle', 0.1);
            for (let p = 0; p < 10; p++) {
              gameEnv.particles.push({
                x: e.x,
                y: e.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                color: '#f59e0b'
              });
            }
            gameEnv.enemies.splice(i, 1);
          }
        }

        // Player
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(gameEnv.player.x, gameEnv.player.y, gameEnv.player.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Particles
        for (let i = gameEnv.particles.length - 1; i >= 0; i--) {
          const p = gameEnv.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= dt * 2;
          if (p.life <= 0) {
            gameEnv.particles.splice(i, 1);
            continue;
          }
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        // UI text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('SCORE: ' + gameEnv.score, 24, 40);

        requestAnimationFrame(loop);
      }

      requestAnimationFrame(loop);
    }

    initRuntime();
  </script>
</body>
</html>`;
}
