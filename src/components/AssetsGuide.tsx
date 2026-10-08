import React from 'react';
import { Box, ImageIcon, Music, FileCode, CheckCircle2 } from 'lucide-react';

export const AssetsGuide: React.FC = () => {
  const assets = [
    {
      title: 'Modèles & Scènes 3D',
      formats: 'GLB · GLTF · OBJ · FBX · MTL',
      icon: <Box className="w-5 h-5 text-purple-400" />,
      desc: 'Tous les modèles 3D contenus dans le ZIP sont reconnus. Le visualiseur Three.js intégré permet d\'orbiter à 360°, d\'activer le mode filaire, d\'inspecter les sommets et les polygones.',
      code: `// Three.js GLTFLoader résout automatiquement 'model.glb'
const loader = new THREE.GLTFLoader();
loader.load('models/character.glb', (gltf) => {
  scene.add(gltf.scene);
});`,
    },
    {
      title: 'Textures & Images 2D',
      formats: 'PNG · JPEG · JPG · WebP · SVG · GIF',
      icon: <ImageIcon className="w-5 h-5 text-emerald-400" />,
      desc: 'Textures pour moteurs 3D, spritesheets de personnages ou décors de fond. Le VFS injecte les images directement dans les balises <img> ou dans les textures WebGL sans erreur CORS.',
      code: `const img = new Image();
img.src = 'sprites/hero.png'; // Intercepté vers le blob mémoire
img.onload = () => ctx.drawImage(img, 0, 0);`,
    },
    {
      title: 'Bandes Sonores & Effets Audio',
      formats: 'MP3 · WAV · OGG · FLAC',
      icon: <Music className="w-5 h-5 text-amber-400" />,
      desc: 'Bruitages laser, musiques de fond et nappes sonores. Le lecteur audio intégré visualise la forme d\'onde en temps réel et gère le volume ainsi que la lecture en boucle.',
      code: `const sound = new Audio('sounds/laser.wav');
sound.play(); // Fonctionne immédiatement via le VFS`,
    },
    {
      title: 'Niveaux & Données de Configuration',
      formats: 'JSON · XML · CSV · TXT · GLSL',
      icon: <FileCode className="w-5 h-5 text-sky-400" />,
      desc: 'Fichiers de sauvegarde, définitions d\'ennemis, matrices de collisions ou shaders GLSL. Modifiables directement depuis l\'éditeur de code intégré avec hot-reload.',
      code: `fetch('config/level1.json')
  .then(res => res.json())
  .then(data => console.log('Points de spawn:', data.spawns));`,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-purple-400 mb-2">
          <span>COMPATIBILITÉ ASSETS</span>
          <span aria-hidden="true">·</span>
          <span>SYSTÈME DE FICHIERS VIRTUEL</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Gestion Intelligente des Assets &amp; Formats
        </h2>
        <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
          Lorsque votre jeu effectue un <code className="text-slate-300">fetch()</code> ou instancie une image, le moteur d'interception mappe instantanément le chemin relatif vers les octets en mémoire du ZIP.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assets.map((asset) => (
          <div
            key={asset.title}
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                  {asset.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{asset.title}</h3>
                  <p className="text-xs font-mono text-slate-400">{asset.formats}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{asset.desc}</p>
            </div>

            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
              <pre className="text-slate-400">{asset.code}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
