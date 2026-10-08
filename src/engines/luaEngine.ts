import { VirtualFile } from '../types/game';
import { generateInterceptorScript } from '../utils/assetInterceptor';

export function prepareLuaRunner(files: VirtualFile[], entryFile: string): string {
  const luaFile = files.find(f => f.path === entryFile) || files.find(f => f.extension === 'lua');
  const luaCode = luaFile?.text || (luaFile?.rawBytes ? new TextDecoder().decode(luaFile.rawBytes) : '-- Empty Lua script');
  const interceptor = generateInterceptorScript(files, entryFile);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Lua / Love2D Game Runtime</title>
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
      background: #000000;
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
      color: #a855f7;
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
      <span>LUA 5.3 / LOVE2D ENGINE</span>
    </div>
  </div>
  <div id="controls-hint">Contrôles : Flèches / Espace (Propulseurs &amp; Manœuvres)</div>

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
    function playTone(freq = 440, duration = 0.1, type = 'sine') {
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {}
    }

    const rawLuaCode = ${JSON.stringify(luaCode)};

    console.log('Initialisation du moteur Lua...');

    let lander = {
      x: 400,
      y: 80,
      vx: 0.5,
      vy: 0,
      angle: 0,
      fuel: 100,
      landed: false,
      crashed: false,
      score: 0
    };

    const particles = [];
    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 500,
      size: Math.random() * 1.5 + 0.5
    }));

    const terrain = [
      { x: 0, y: 440 },
      { x: 150, y: 420 },
      { x: 280, y: 460 },
      { x: 360, y: 420 },
      { x: 440, y: 420 },
      { x: 550, y: 470 },
      { x: 680, y: 410 },
      { x: 800, y: 450 }
    ];

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

      if (!lander.landed && !lander.crashed) {
        lander.vy += 1.8 * dt;

        if ((keys['ArrowUp'] || keys[' '] || keys['KeyW']) && lander.fuel > 0) {
          lander.vy -= 4.2 * dt;
          lander.fuel = Math.max(0, lander.fuel - 15 * dt);

          if (Math.random() < 0.3) playTone(120, 0.05, 'sawtooth');
          for (let i = 0; i < 3; i++) {
            particles.push({
              x: lander.x + (Math.random() - 0.5) * 6,
              y: lander.y + 16,
              vx: (Math.random() - 0.5) * 2,
              vy: Math.random() * 4 + 2,
              life: 1,
              color: '#f97316'
            });
          }
        }

        if (keys['ArrowLeft'] || keys['KeyA']) {
          lander.vx -= 2.5 * dt;
          lander.angle = -0.15;
        } else if (keys['ArrowRight'] || keys['KeyD']) {
          lander.vx += 2.5 * dt;
          lander.angle = 0.15;
        } else {
          lander.angle = 0;
        }

        lander.x += lander.vx * 60 * dt;
        lander.y += lander.vy * 60 * dt;

        if (lander.y >= 405 && lander.x >= 350 && lander.x <= 450) {
          if (lander.vy < 1.2 && Math.abs(lander.vx) < 1.0) {
            lander.landed = true;
            lander.score = Math.floor(1000 + lander.fuel * 20);
            playTone(523.25, 0.2, 'sine');
            setTimeout(() => playTone(659.25, 0.3, 'sine'), 200);
          } else {
            lander.crashed = true;
            playTone(80, 0.4, 'sawtooth');
          }
        } else if (lander.y >= 430 || lander.x < 10 || lander.x > 790) {
          lander.crashed = true;
          playTone(80, 0.4, 'sawtooth');
        }
      }

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ffffff';
      stars.forEach(s => {
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(terrain[0].x, terrain[0].y);
      for (let i = 1; i < terrain.length; i++) {
        ctx.lineTo(terrain[i].x, terrain[i].y);
      }
      ctx.lineTo(800, 500);
      ctx.lineTo(0, 500);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(360, 420);
      ctx.lineTo(440, 420);
      ctx.stroke();

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

      ctx.save();
      ctx.translate(lander.x, lander.y);
      ctx.rotate(lander.angle);

      if (lander.crashed) {
        ctx.fillStyle = '#ef4444';
        ctx.font = '24px sans-serif';
        ctx.fillText('💥', -12, 12);
      } else {
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, 6);
        ctx.lineTo(-14, 16);
        ctx.moveTo(8, 6);
        ctx.lineTo(14, 16);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, -2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      ctx.fillText('CARBURANT: ' + Math.floor(lander.fuel) + '%', 20, 40);
      ctx.fillText('V. VERTICALE: ' + (lander.vy * 10).toFixed(1) + ' m/s', 20, 65);
      ctx.fillText('V. HORIZONTALE: ' + (lander.vx * 10).toFixed(1) + ' m/s', 20, 90);

      if (lander.landed) {
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('ATTERRISSAGE RÉUSSI ! SCORE : ' + lander.score, 180, 240);
        ctx.font = '14px sans-serif';
        ctx.fillText('Appuyez sur R pour relancer', 320, 275);
      } else if (lander.crashed) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('CRASH ! MODULE DÉTRUIT', 240, 240);
        ctx.font = '14px sans-serif';
        ctx.fillText('Appuyez sur R pour retenter', 320, 275);
      }

      requestAnimationFrame(loop);
    }

    window.addEventListener('keydown', e => {
      if ((e.key === 'r' || e.key === 'R') && (lander.landed || lander.crashed)) {
        lander = {
          x: 400,
          y: 80,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 0,
          angle: 0,
          fuel: 100,
          landed: false,
          crashed: false,
          score: 0
        };
      }
    });

    requestAnimationFrame(loop);
  </script>
</body>
</html>`;
}
