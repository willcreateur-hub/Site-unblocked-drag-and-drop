import React from 'react';
import { Cpu, Terminal, Code2, Zap, Layers, Sparkles } from 'lucide-react';

export const EnginesGuide: React.FC = () => {
  const engines = [
    {
      name: 'HTML5 / JavaScript / CSS',
      ext: '.html, .js, .css',
      tag: 'Natif Navigateur',
      color: 'sky',
      desc: 'Idéal pour Phaser, Three.js, Babylon.js, Pixi.js ou Canvas 2D pur. Exécution immédiate avec accélération matérielle WebGL et Web Audio.',
      example: `<canvas id="canvas"></canvas>
<script>
  const ctx = canvas.getContext('2d');
  fetch('assets/player.png') // Résolu via le VFS
    .then(r => r.blob()).then(...);
</script>`,
    },
    {
      name: 'WebAssembly (WASM)',
      ext: '.wasm',
      tag: 'Haute Performance AOT',
      color: 'emerald',
      desc: 'Code compilé ultra-rapide issu de Rust, C, C++, AssemblyScript ou Go. Mémoire linéaire directe et cadencement à 60 FPS constants.',
      example: `WebAssembly.instantiateStreaming(
  fetch('game.wasm'), // Intercepté directement depuis le ZIP
  importObject
).then(results => results.instance.exports.start());`,
    },
    {
      name: 'Python 3',
      ext: '.py',
      tag: 'Pyodide & MicroVM',
      color: 'amber',
      desc: 'Support des scripts de jeu Python avec compatibilité Pygame / Canvas 2D. Gère les boucles update(), draw() et la gestion des événements clavier.',
      example: `import math, random

def update(dt):
    player.x += player.vx * dt

def draw(screen):
    screen.fill((5, 8, 20))
    pygame.draw.circle(screen, (56, 189, 248), player.pos, 16)`,
    },
    {
      name: 'Lua 5.3',
      ext: '.lua',
      tag: 'Love2D & Pico-8',
      color: 'purple',
      desc: 'Moteur de scripting ultra-léger adoré des développeurs de jeux indépendants. Prise en charge des fonctions love.load(), love.update() et love.draw().',
      example: `function love.load()
    lander = { x = 400, y = 80, vy = 0, fuel = 100 }
end

function love.update(dt)
    lander.vy = lander.vy + 1.8 * dt
end`,
    },
    {
      name: 'C / C++',
      ext: '.cpp, .c',
      tag: 'Raylib & SDL',
      color: 'blue',
      desc: 'Support des structures C/C++ de style Raylib (InitWindow, BeginDrawing, DrawCircle, IsKeyDown) et compilation WebAssembly directe.',
      example: `#include "raylib.h"

int main() {
    InitWindow(800, 500, "Arcade C++");
    while (!WindowShouldClose()) {
        BeginDrawing();
        ClearBackground(BLACK);
        DrawCircle(player.x, player.y, 14, SKYBLUE);
        EndDrawing();
    }
}`,
    },
    {
      name: 'C# (C-Sharp)',
      ext: '.cs',
      tag: 'Unity MonoBehaviour',
      color: 'indigo',
      desc: 'Architecture MonoBehaviour avec Start(), Update(), gestion des collisions, vecteurs 2D et chargement d\'assets depuis le ZIP.',
      example: `using UnityEngine;

public class Hero : MonoBehaviour {
    void Update() {
        if (Input.GetKey(KeyCode.Space)) {
            Attack();
        }
    }
}`,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-sky-400 mb-2">
          <span>SPÉCIFICATIONS TECHNIQUES</span>
          <span aria-hidden="true">·</span>
          <span>BAC À SABLE SÉCURISÉ</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Moteurs de Jeu Supportés dans le Navigateur
        </h2>
        <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
          ArcadeZip embarque une suite de runtimes multi-langages couplée à un système de fichiers virtuel (VFS) pour faire tourner vos jeux sans configuration ni serveur externe.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {engines.map((eng) => (
          <div
            key={eng.name}
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-slate-400">{eng.ext}</span>
                <span className="text-xs font-medium text-slate-300 font-mono">{eng.tag}</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{eng.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{eng.desc}</p>
            </div>

            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
              <pre className="text-slate-400">{eng.example}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
