import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Box, Eye, Layers, RotateCw, Sun } from 'lucide-react';
import { VirtualFile } from '../types/game';

interface Props {
  file: VirtualFile;
  onClose: () => void;
}

export const Model3DViewer: React.FC<Props> = ({ file, onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [stats, setStats] = useState<{ vertices: number; triangles: number }>({ vertices: 0, triangles: 0 });

  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x090d16);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf43f5e, 1.2);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // Grid Floor
    const grid = new THREE.GridHelper(10, 20, 0x38bdf8, 0x1e293b);
    grid.position.y = -0.01;
    scene.add(grid);

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.autoRotate = autoRotate;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 4. Load Model
    setLoading(true);
    setError(null);

    const ext = file.extension.toLowerCase();
    const handleLoadedObject = (object: THREE.Object3D) => {
      modelRef.current = object;

      // Auto-center and fit camera to bounding box
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 2.5 / maxDim;
      object.scale.setScalar(scale);

      // Re-center object on floor
      box.setFromObject(object);
      box.getCenter(center);
      object.position.x -= center.x;
      object.position.y -= box.min.y;
      object.position.z -= center.z;

      scene.add(object);

      // Count vertices & triangles
      let vCount = 0;
      let tCount = 0;
      object.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const geom = mesh.geometry;
          if (geom) {
            vCount += geom.attributes.position ? geom.attributes.position.count : 0;
            if (geom.index) {
              tCount += geom.index.count / 3;
            } else if (geom.attributes.position) {
              tCount += geom.attributes.position.count / 3;
            }
          }
        }
      });

      setStats({ vertices: Math.floor(vCount), triangles: Math.floor(tCount) });
      setLoading(false);
    };

    if (ext === 'glb' || ext === 'gltf') {
      const loader = new GLTFLoader();
      loader.load(
        file.blobUrl,
        (gltf) => {
          handleLoadedObject(gltf.scene);
        },
        undefined,
        (err) => {
          console.error(err);
          setError('Impossible de décoder le modèle 3D GLTF/GLB.');
          setLoading(false);
        }
      );
    } else if (ext === 'obj') {
      const loader = new OBJLoader();
      if (file.text) {
        try {
          const obj = loader.parse(file.text);
          handleLoadedObject(obj);
        } catch (err) {
          setError('Erreur lors du parsing du fichier OBJ.');
          setLoading(false);
        }
      } else {
        loader.load(
          file.blobUrl,
          (obj) => handleLoadedObject(obj),
          undefined,
          () => {
            setError('Impossible de charger le modèle OBJ.');
            setLoading(false);
          }
        );
      }
    } else {
      // Fallback procedural placeholder
      const geom = new THREE.TorusKnotGeometry(0.8, 0.25, 100, 16);
      const mat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.8 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.y = 1.0;
      handleLoadedObject(mesh);
    }

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [file]);

  const toggleWireframe = () => {
    if (!modelRef.current) return;
    const nextState = !wireframe;
    setWireframe(nextState);
    modelRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m: any) => {
            if ('wireframe' in m) m.wireframe = nextState;
          });
        } else if (mesh.material && 'wireframe' in (mesh.material as any)) {
          (mesh.material as any).wireframe = nextState;
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <Box className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">{file.name}</h3>
              <p className="text-xs text-slate-400 font-mono">
                {file.path} · {(file.size / 1024).toFixed(1)} Ko
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            Fermer (Échap)
          </button>
        </div>

        {/* 3D Viewport */}
        <div className="relative w-full h-[500px] bg-slate-950" ref={mountRef}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 text-sky-400 text-sm gap-2">
              <RotateCw className="w-5 h-5 animate-spin" />
              <span>Chargement du maillage 3D...</span>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <p className="text-sm text-rose-400 mb-2">{error}</p>
              <p className="text-xs text-slate-400">Le format de fichier ou les dépendances de texture relatives sont manquantes.</p>
            </div>
          )}

          {/* Floating Controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-700/60 rounded-lg p-1.5">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-2.5 py-1 text-xs rounded transition-colors flex items-center gap-1.5 ${
                autoRotate ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotation auto</span>
            </button>
            <button
              onClick={toggleWireframe}
              className={`px-2.5 py-1 text-xs rounded transition-colors flex items-center gap-1.5 ${
                wireframe ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Filaire</span>
            </button>
          </div>

          {/* Stats */}
          <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur border border-slate-700/60 rounded-lg px-3 py-2 text-right pointer-events-none">
            <p className="text-[11px] font-mono text-slate-400">
              Sommets: <span className="text-white tabular-nums">{stats.vertices.toLocaleString()}</span>
            </p>
            <p className="text-[11px] font-mono text-slate-400">
              Triangles: <span className="text-white tabular-nums">{stats.triangles.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Contrôles : Clic gauche + glisser pour orbiter · Molette pour zoomer · Clic droit pour translater</span>
          <span className="font-mono text-sky-400">Three.js WebGL Engine</span>
        </div>
      </div>
    </div>
  );
};
