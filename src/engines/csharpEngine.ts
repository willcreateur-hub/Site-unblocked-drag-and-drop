import { VirtualFile } from '../types/game';
import { generateInterceptorScript } from '../utils/assetInterceptor';

export function prepareCSharpRunner(files: VirtualFile[], entryFile: string): string {
  const csFile = files.find(f => f.path === entryFile) || files.find(f => f.extension === 'cs');
  const csCode = csFile?.text || (csFile?.rawBytes ? new TextDecoder().decode(csFile.rawBytes) : '// C# Script');
  const interceptor = generateInterceptorScript(files, entryFile);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>C# / Unity Style Web Runtime</title>
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
      background: #0f172a;
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
      color: #3b82f6;
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
      <span>C# MONOBEHAVIOUR RUNTIME</span>
    </div>
  </div>
  <div id="controls-hint">Contrôles : ZQSD / Flèches pour bouger · Espace pour frapper à l'épée</div>

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
    function playSwordSound() {
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } catch (e) {}
    }

    function playHitSound() {
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (e) {}
    }

    console.log('Compilation & Exécution du script C# MonoBehaviour...');

    const player = {
      x: 400,
      y: 250,
      speed: 4,
      hp: 100,
      maxHp: 100,
      attacking: false,
      attackTime: 0,
      coins: 0,
      facing: 'right'
    };

    const slimes = [
      { x: 200, y: 150, hp: 30, maxHp: 30, vx: 1, vy: 0.5 },
      { x: 600, y: 350, hp: 30, maxHp: 30, vx: -0.8, vy: 0.8 },
      { x: 250, y: 380, hp: 30, maxHp: 30, vx: 0.6, vy: -0.7 },
      { x: 550, y: 180, hp: 30, maxHp: 30, vx: -1.2, vy: -0.4 }
    ];

    const chests = [
      { x: 140, y: 120, opened: false },
      { x: 680, y: 120, opened: false },
      { x: 680, y: 400, opened: false }
    ];

    const particles = [];
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

      let dx = 0;
      let dy = 0;
      if (keys['ArrowLeft'] || keys['KeyA'] || keys['q'] || keys['Q']) { dx -= 1; player.facing = 'left'; }
      if (keys['ArrowRight'] || keys['KeyD'] || keys['d'] || keys['D']) { dx += 1; player.facing = 'right'; }
      if (keys['ArrowUp'] || keys['KeyW'] || keys['z'] || keys['Z']) { dy -= 1; }
      if (keys['ArrowDown'] || keys['KeyS'] || keys['s'] || keys['S']) { dy += 1; }

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      player.x += dx * player.speed;
      player.y += dy * player.speed;
      player.x = Math.max(40, Math.min(canvas.width - 40, player.x));
      player.y = Math.max(40, Math.min(canvas.height - 40, player.y));

      if (keys[' '] && !player.attacking) {
        player.attacking = true;
        player.attackTime = 0.22;
        playSwordSound();
      }

      if (player.attacking) {
        player.attackTime -= dt;
        if (player.attackTime <= 0) player.attacking = false;
      }

      slimes.forEach(s => {
        if (s.hp <= 0) return;
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 60 || s.x > canvas.width - 60) s.vx *= -1;
        if (s.y < 60 || s.y > canvas.height - 60) s.vy *= -1;

        const distP = Math.hypot(player.x - s.x, player.y - s.y);
        if (distP < 28) {
          player.hp = Math.max(0, player.hp - 10 * dt);
        }

        if (player.attacking) {
          const swordX = player.facing === 'right' ? player.x + 28 : player.x - 28;
          const swordY = player.y;
          const distSword = Math.hypot(swordX - s.x, swordY - s.y);
          if (distSword < 34) {
            s.hp -= 40 * dt;
            playHitSound();
            for (let i = 0; i < 4; i++) {
              particles.push({
                x: s.x,
                y: s.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 0.8,
                color: '#22c55e'
              });
            }
          }
        }
      });

      chests.forEach(c => {
        if (!c.opened && Math.hypot(player.x - c.x, player.y - c.y) < 36) {
          c.opened = true;
          player.coins += 50;
          playSwordSound();
          for (let i = 0; i < 10; i++) {
            particles.push({
              x: c.x,
              y: c.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 1,
              color: '#facc15'
            });
          }
        }
      });

      ctx.fillStyle = '#0b1120';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      chests.forEach(c => {
        ctx.fillStyle = c.opened ? '#854d0e' : '#ca8a04';
        ctx.fillRect(c.x - 16, c.y - 12, 32, 24);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(c.x - 4, c.y - 4, 8, 8);
      });

      slimes.forEach(s => {
        if (s.hp <= 0) return;
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(s.x - 6, s.y - 4, 3, 4);
        ctx.fillRect(s.x + 3, s.y - 4, 3, 4);

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(s.x - 14, s.y - 22, 28, 4);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(s.x - 14, s.y - 22, 28 * (s.hp / s.maxHp), 4);
      });

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(player.x, player.y, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#64748b';
      const shieldOffset = player.facing === 'right' ? -14 : 14;
      ctx.fillRect(player.x + shieldOffset - 4, player.y - 10, 8, 20);

      if (player.attacking) {
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 4;
        ctx.beginPath();
        const swordDir = player.facing === 'right' ? 1 : -1;
        ctx.arc(player.x + swordDir * 18, player.y, 22, -0.6 * swordDir, 0.6 * swordDir, swordDir < 0);
        ctx.stroke();
      }

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
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('PV: ' + Math.ceil(player.hp) + ' / 100', 24, 38);
      ctx.fillText('PIÈCES D\\'OR: ' + player.coins, 24, 64);

      ctx.fillStyle = '#334155';
      ctx.fillRect(160, 24, 150, 16);
      ctx.fillStyle = player.hp > 30 ? '#10b981' : '#ef4444';
      ctx.fillRect(160, 24, 150 * (player.hp / player.maxHp), 16);

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  </script>
</body>
</html>`;
}
