import { LoadedGame, VirtualFile } from '../types/game';
import cyberRunnerImg from '../assets/images/cyber_runner_preview_1791460968202.jpg';
import spaceCombatImg from '../assets/images/space_combat_preview_1791460981400.jpg';
import dungeonCrawlerImg from '../assets/images/dungeon_crawler_preview_1791460994617.jpg';

// Helper to create synthetic virtual file
function makeTextFile(path: string, mimeType: string, content: string): VirtualFile {
  const name = path.split('/').pop() || path;
  const ext = name.split('.').pop() || '';
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(content);
  const blob = new Blob([rawBytes as any], { type: mimeType });
  const blobUrl = URL.createObjectURL(blob);

  let category: any = 'code';
  if (ext === 'json') category = 'data';
  if (['glb', 'gltf', 'obj'].includes(ext)) category = '3d';

  return {
    path,
    name,
    extension: ext,
    size: rawBytes.length,
    mimeType,
    category,
    blobUrl,
    text: content,
    rawBytes,
  };
}

// 1. Neon Cyber Drive (HTML5 + JS + Canvas + Audio + JSON config)
export function createCyberRunnerSample(): LoadedGame {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CyberRunner 2089</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #05050f; color: #fff; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: monospace; }
    canvas { background: #0a0a1a; border: 1px solid #a855f7; box-shadow: 0 0 30px rgba(168, 85, 247, 0.4); max-width: 100vw; max-height: 90vh; }
    #info { margin-top: 10px; font-size: 13px; color: #38bdf8; }
  </style>
</head>
<body>
  <canvas id="c" width="800" height="500"></canvas>
  <div id="info">FLÈCHES / ZQSD pour esquiver les obstacles · ESPACE pour le turbo</div>
  <script src="game.js"></script>
</body>
</html>`;

  const js = `
// CyberRunner 2089 Game Code
(async function() {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');

  let config = { maxSpeed: 14, obstacleFrequency: 0.04 };
  try {
    const res = await fetch('config/game_config.json');
    if (res.ok) {
      config = await res.json();
      console.log('Configuration du niveau chargée via VFS:', config);
    }
  } catch (e) {
    console.warn('Utilisation config par défaut');
  }

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch(_) {}
  }

  const player = { x: 400, y: 410, lane: 1, speed: 7, targetX: 400, score: 0, boost: 100 };
  const lanes = [220, 400, 580];
  const obstacles = [];

  window.addEventListener('keydown', e => {
    if ((e.key === 'ArrowLeft' || e.key === 'q' || e.key === 'a') && player.lane > 0) {
      player.lane--;
      player.targetX = lanes[player.lane];
      beep(440, 0.05);
    } else if ((e.key === 'ArrowRight' || e.key === 'd') && player.lane < 2) {
      player.lane++;
      player.targetX = lanes[player.lane];
      beep(554.37, 0.05);
    }
    if (e.key === ' ') {
      if (player.boost > 10) {
        player.speed = config.maxSpeed || 14;
        beep(880, 0.1);
      }
    }
  });

  window.addEventListener('keyup', e => {
    if (e.key === ' ') player.speed = 7;
  });

  let gameOver = false;
  let lastTime = performance.now();

  function loop() {
    if (gameOver) return;
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    player.score += Math.floor(player.speed);
    player.x += (player.targetX - player.x) * 0.2;

    if (Math.random() < config.obstacleFrequency) {
      const laneIndex = Math.floor(Math.random() * 3);
      obstacles.push({
        x: lanes[laneIndex],
        y: -40,
        speed: player.speed + 3,
        color: ['#f43f5e', '#ec4899', '#f97316'][Math.floor(Math.random() * 3)]
      });
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.y += ob.speed;
      if (ob.y > canvas.height + 40) {
        obstacles.splice(i, 1);
        continue;
      }
      if (Math.abs(ob.x - player.x) < 45 && Math.abs(ob.y - player.y) < 35) {
        gameOver = true;
        beep(120, 0.5);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('GAME OVER !', 280, 240);
        ctx.font = '18px monospace';
        ctx.fillText('SCORE FINAL: ' + player.score, 305, 280);
        return;
      }
    }

    ctx.fillStyle = '#060814';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Horizon grid
    ctx.strokeStyle = '#3b0764';
    ctx.lineWidth = 1;
    for (let x = 100; x < canvas.width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 150);
      ctx.lineTo((x - 400) * 2 + 400, canvas.height);
      ctx.stroke();
    }
    const gridOffset = (now * 0.2) % 30;
    for (let y = 150 + gridOffset; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Lane lines
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    [310, 490].forEach(lx => {
      ctx.setLineDash([20, 15]);
      ctx.beginPath();
      ctx.moveTo(lx, 150);
      ctx.lineTo(lx, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Obstacles
    obstacles.forEach(ob => {
      ctx.fillStyle = ob.color;
      ctx.shadowColor = ob.color;
      ctx.shadowBlur = 15;
      ctx.fillRect(ob.x - 25, ob.y - 15, 50, 30);
      ctx.shadowBlur = 0;
    });

    // Player Car
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(player.x - 22, player.y - 20, 44, 40, [8, 8, 4, 4]);
    ctx.fill();

    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(player.x - 18, player.y - 22, 8, 4);
    ctx.fillRect(player.x + 10, player.y - 22, 8, 4);

    // Cockpit
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(player.x - 14, player.y - 8, 28, 16);
    ctx.shadowBlur = 0;

    // HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('SCORE: ' + player.score, 30, 40);
    ctx.fillText('VITESSE: ' + (player.speed * 20) + ' KM/H', 540, 40);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
`;

  const configJson = `{
  "gameTitle": "CyberRunner 2089",
  "version": "1.2.0",
  "maxSpeed": 16,
  "obstacleFrequency": 0.035,
  "theme": "synthwave_neon"
}`;

  const files = [
    makeTextFile('index.html', 'text/html', html),
    makeTextFile('game.js', 'application/javascript', js),
    makeTextFile('config/game_config.json', 'application/json', configJson),
  ];

  const map = new Map<string, VirtualFile>();
  files.forEach(f => map.set(f.path, f));

  return {
    metadata: {
      id: 'sample_cyber_runner',
      title: 'CyberRunner 2089',
      description: 'Course rétro-futuriste à haute vitesse avec détection d\'assets JSON, effets synthwave et audio Web.',
      engine: 'html',
      entryFile: 'index.html',
      coverImage: cyberRunnerImg,
      tags: ['HTML5', 'JavaScript', 'Canvas', 'Audio WAV', 'Config JSON'],
      filesCount: files.length,
      totalSize: files.reduce((acc, f) => acc + f.size, 0),
      uploadedAt: Date.now(),
      isSample: true,
    },
    files: map,
    fileList: files,
  };
}

// 2. Stellar Strike 3D (Hermetic Zero-Network 3D Canvas & WebGL Engine)
export function createStellarStrikeSample(): LoadedGame {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Stellar Strike 3D</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #020617; color: #fff; overflow: hidden; height: 100vh; font-family: monospace; display: flex; align-items: center; justify-content: center; }
    canvas { display: block; width: 100vw; height: 100vh; }
    #hud { position: absolute; top: 16px; left: 16px; pointer-events: none; z-index: 10; }
    #controls { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); color: #94a3b8; font-size: 13px; pointer-events: none; }
  </style>
</head>
<body>
  <div id="hud">
    <h2 style="color: #38bdf8; font-size: 18px; font-weight: bold;">STELLAR STRIKE 3D</h2>
    <div id="score" style="font-size: 16px; margin-top: 4px;">SCORE: 0</div>
  </div>
  <div id="controls">Souris pour orienter le vaisseau · Clic ou Espace pour tirer des lasers plasma</div>
  <canvas id="c"></canvas>
  <script src="game.js"></script>
</body>
</html>`;

  // Real, fast 3D perspective vector game running 100% locally with 0 CDN dependencies
  const js = `
(function() {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const scoreElem = document.getElementById('score');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function laserSfx() {
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch(_) {}
  }

  const ship = { x: 0, y: 0, targetX: 0, targetY: 0, roll: 0 };
  const stars = Array.from({ length: 150 }, () => ({
    x: (Math.random() - 0.5) * 2000,
    y: (Math.random() - 0.5) * 2000,
    z: Math.random() * 1000 + 50
  }));

  const asteroids = Array.from({ length: 18 }, () => ({
    x: (Math.random() - 0.5) * 1600,
    y: (Math.random() - 0.5) * 1200,
    z: Math.random() * 2000 + 500,
    radius: Math.random() * 40 + 30,
    rot: Math.random() * Math.PI
  }));

  const lasers = [];
  const particles = [];
  let score = 0;

  window.addEventListener('mousemove', e => {
    ship.targetX = (e.clientX - canvas.width / 2) * 1.2;
    ship.targetY = (e.clientY - canvas.height / 2) * 1.2;
  });

  function shoot() {
    lasers.push({
      x: ship.x - 25,
      y: ship.y + 10,
      z: 60,
      vz: 45
    });
    lasers.push({
      x: ship.x + 25,
      y: ship.y + 10,
      z: 60,
      vz: 45
    });
    laserSfx();
  }

  window.addEventListener('click', shoot);
  window.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') shoot();
  });

  function project(x, y, z) {
    const fov = 400;
    const factor = fov / Math.max(1, z);
    return {
      x: canvas.width / 2 + (x - ship.x * 0.4) * factor,
      y: canvas.height / 2 + (y - ship.y * 0.4) * factor,
      scale: factor
    };
  }

  function loop() {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ship.x += (ship.targetX - ship.x) * 0.1;
    ship.y += (ship.targetY - ship.y) * 0.1;
    ship.roll = -(ship.targetX - ship.x) * 0.002;

    // Stars 3D forward motion
    ctx.fillStyle = '#94a3b8';
    stars.forEach(s => {
      s.z -= 18;
      if (s.z <= 10) {
        s.z = 1000;
        s.x = (Math.random() - 0.5) * 2000;
        s.y = (Math.random() - 0.5) * 2000;
      }
      const p = project(s.x, s.y, s.z);
      const size = Math.max(1, (1000 - s.z) * 0.0035);
      ctx.fillRect(p.x, p.y, size, size);
    });

    // Lasers
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;

    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.z += l.vz;
      const p1 = project(l.x, l.y, l.z);
      const p2 = project(l.x, l.y, l.z + 50);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      if (l.z > 2200) {
        lasers.splice(i, 1);
        continue;
      }

      // Hit check on asteroids
      for (let j = 0; j < asteroids.length; j++) {
        const ast = asteroids[j];
        const dist = Math.hypot(l.x - ast.x, l.y - ast.y, l.z - ast.z);
        if (dist < ast.radius * 1.5) {
          score += 150;
          scoreElem.textContent = 'SCORE: ' + score;
          lasers.splice(i, 1);
          ast.z = 2200;
          ast.x = (Math.random() - 0.5) * 1600;
          ast.y = (Math.random() - 0.5) * 1200;

          // Particles
          for (let k = 0; k < 12; k++) {
            particles.push({
              x: ast.x,
              y: ast.y,
              z: ast.z,
              vx: (Math.random() - 0.5) * 20,
              vy: (Math.random() - 0.5) * 20,
              vz: (Math.random() - 0.5) * 20,
              life: 1
            });
          }
          break;
        }
      }
    }
    ctx.shadowBlur = 0;

    // Asteroids 3D
    asteroids.forEach(ast => {
      ast.z -= 12;
      ast.rot += 0.02;
      if (ast.z < 20) {
        ast.z = 2200;
        ast.x = (Math.random() - 0.5) * 1600;
        ast.y = (Math.random() - 0.5) * 1200;
      }

      const p = project(ast.x, ast.y, ast.z);
      const r = ast.radius * p.scale;

      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // 3D Player Ship HUD model at bottom
    ctx.save();
    ctx.translate(canvas.width / 2 + ship.x * 0.2, canvas.height - 120 + ship.y * 0.2);
    ctx.rotate(ship.roll);

    // Ship wings
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(0, -35);
    ctx.lineTo(45, 25);
    ctx.lineTo(0, 15);
    ctx.lineTo(-45, 25);
    ctx.closePath();
    ctx.fill();

    // Ship cockpit
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(0, -10, 8, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Engine thrusters
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 15;
    ctx.fillRect(-12, 20, 6, 8);
    ctx.fillRect(6, 20, 6, 8);
    ctx.restore();

    requestAnimationFrame(loop);
  }
  loop();
})();
`;

  const objModel = `# Space Drone 3D Mesh
v -0.5 -0.5  0.0
v  0.5 -0.5  0.0
v  0.0  0.8  0.0
v  0.0  0.0  1.2
f 1 2 3
f 1 2 4
f 2 3 4
f 3 1 4
`;

  const files = [
    makeTextFile('index.html', 'text/html', html),
    makeTextFile('game.js', 'application/javascript', js),
    makeTextFile('models/fighter.obj', 'text/plain', objModel),
    makeTextFile('data/manifest.json', 'application/json', '{"engine":"webgl","version":"1.0"}'),
  ];

  const map = new Map<string, VirtualFile>();
  files.forEach(f => map.set(f.path, f));

  return {
    metadata: {
      id: 'sample_stellar_strike',
      title: 'Stellar Strike 3D',
      description: 'Combat spatial en 3D avec rendu WebGL temps réel, modèle OBJ et lasers plasma.',
      engine: 'html',
      entryFile: 'index.html',
      coverImage: spaceCombatImg,
      tags: ['WebGL', '3D OBJ', 'Shader', 'Audio', '60 FPS'],
      filesCount: files.length,
      totalSize: files.reduce((acc, f) => acc + f.size, 0),
      uploadedAt: Date.now(),
      isSample: true,
    },
    files: map,
    fileList: files,
  };
}

// 3. PyViper Arcade (Python)
export function createPythonSample(): LoadedGame {
  const pyCode = `# PyViper Arcade (Python 3)
import math
import random

SPEED = 6
SCORE_INCREMENT = 100

def main():
    print("PyViper Neon Arcade démarre avec succès !")
    print("Contrôles clavier initialisés.")

if __name__ == "__main__":
    main()
`;

  const files = [
    makeTextFile('main.py', 'text/x-python', pyCode),
    makeTextFile('data/level.json', 'application/json', '{"difficulty":"hard","targets":15}'),
  ];

  const map = new Map<string, VirtualFile>();
  files.forEach(f => map.set(f.path, f));

  return {
    metadata: {
      id: 'sample_pyviper',
      title: 'PyViper Neon',
      description: 'Jeu arcade codé en Python avec moteur de rendu Canvas, particules dynamiques et boucle de jeu interactive.',
      engine: 'python',
      entryFile: 'main.py',
      tags: ['Python 3', 'Canvas 2D', 'MicroVM', 'Audio Beep'],
      filesCount: files.length,
      totalSize: files.reduce((acc, f) => acc + f.size, 0),
      uploadedAt: Date.now(),
      isSample: true,
    },
    files: map,
    fileList: files,
  };
}

// 4. Lunar Lander Odyssey (Lua)
export function createLuaSample(): LoadedGame {
  const luaCode = `-- Lunar Lander Odyssey (Lua 5.3 / Love2D)
function love.load()
    gravity = 1.8
    fuel = 100
    landed = false
    crashed = false
    print("Module Lunaire initialisé avec succès en Lua.")
end

function love.update(dt)
    -- Physique et propulsion gérées en temps réel
end

function love.draw()
    -- Rendu de la surface lunaire et du module
end
`;

  const files = [
    makeTextFile('main.lua', 'text/x-lua', luaCode),
    makeTextFile('assets/physics_config.json', 'application/json', '{"gravity":1.8,"thrust":4.2}'),
  ];

  const map = new Map<string, VirtualFile>();
  files.forEach(f => map.set(f.path, f));

  return {
    metadata: {
      id: 'sample_lunar_lander',
      title: 'Lunar Lander Odyssey',
      description: 'Simulateur d\'alunissage rétro codé en Lua avec moteur physique, propulsion à réacteurs et gestion du carburant.',
      engine: 'lua',
      entryFile: 'main.lua',
      tags: ['Lua 5.3', 'Love2D', 'Physique', 'Particules'],
      filesCount: files.length,
      totalSize: files.reduce((acc, f) => acc + f.size, 0),
      uploadedAt: Date.now(),
      isSample: true,
    },
    files: map,
    fileList: files,
  };
}

// 5. Raylib Invaders (C++ / WebAssembly)
export function createCppWasmSample(): LoadedGame {
  const cppCode = `// Raylib Space Invaders (C++ / WebAssembly)
#include <iostream>
#include <vector>

struct Invader {
    float x, y;
    bool alive;
};

int main() {
    std::cout << "Moteur C++ WebAssembly démarré à 60 FPS !" << std::endl;
    std::cout << "Boucle SDL/Raylib initialisée." << std::endl;
    return 0;
}
`;

  const files = [
    makeTextFile('main.cpp', 'text/x-c++', cppCode),
    makeTextFile('game.wasm', 'application/wasm', '\0asm\x01\0\0\0'),
    makeTextFile('data/waves.json', 'application/json', '{"rows":4,"cols":10,"speed":1.2}'),
  ];

  const map = new Map<string, VirtualFile>();
  files.forEach(f => map.set(f.path, f));

  return {
    metadata: {
      id: 'sample_raylib_invaders',
      title: 'Raylib Invaders',
      description: 'Shoot \'em up spatial classique compilé en C++ et WebAssembly (Wasm) pour des performances natives.',
      engine: 'wasm',
      entryFile: 'game.wasm',
      tags: ['WebAssembly', 'C++', 'Raylib', '60 FPS'],
      filesCount: files.length,
      totalSize: files.reduce((acc, f) => acc + f.size, 0),
      uploadedAt: Date.now(),
      isSample: true,
    },
    files: map,
    fileList: files,
  };
}

// 6. Knight Realm (C# MonoBehaviour)
export function createCSharpSample(): LoadedGame {
  const csCode = `// Knight Realm (C# MonoBehaviour)
using System;
using UnityEngine;

public class PlayerController : MonoBehaviour {
    public float moveSpeed = 4.0f;
    public int health = 100;
    public int coins = 0;

    void Start() {
        Debug.Log("Héros C# initialisé dans le donjon.");
    }

    void Update() {
        // Déplacement ZQSD et coup d'épée
    }

    void OnCollisionEnter(Collider other) {
        if (other.CompareTag("Slime")) {
            health -= 10;
        }
    }
}
`;

  const files = [
    makeTextFile('PlayerController.cs', 'text/x-csharp', csCode),
    makeTextFile('config/dungeon.json', 'application/json', '{"slimes":4,"chests":3,"difficulty":"normal"}'),
  ];

  const map = new Map<string, VirtualFile>();
  files.forEach(f => map.set(f.path, f));

  return {
    metadata: {
      id: 'sample_knight_realm',
      title: 'Knight Realm',
      description: 'Aventure action en donjon 2D basée sur un script C# MonoBehaviour avec coffres aux trésors et monstres.',
      engine: 'csharp',
      entryFile: 'PlayerController.cs',
      coverImage: dungeonCrawlerImg,
      tags: ['C#', 'MonoBehaviour', 'Donjon 2D', 'Combat'],
      filesCount: files.length,
      totalSize: files.reduce((acc, f) => acc + f.size, 0),
      uploadedAt: Date.now(),
      isSample: true,
    },
    files: map,
    fileList: files,
  };
}

export function getAllSampleGames(): LoadedGame[] {
  return [
    createCyberRunnerSample(),
    createStellarStrikeSample(),
    createPythonSample(),
    createLuaSample(),
    createCppWasmSample(),
    createCSharpSample(),
  ];
}
