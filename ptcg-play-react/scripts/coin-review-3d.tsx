import { useEffect, useRef, useState } from 'react';
import { Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene, WebGLRenderer } from 'three';
import { buildCoinFlipTimeline, createCoinFlipSceneGraph, snapCoinRestPose } from '../src/table/board3d/board-3d-coin-flip';
import { coinById } from '../src/collection/coinCatalog';

export function CoinReview3D() {
  const host = useRef<HTMLDivElement>(null);
  const flip = useRef<(heads: boolean) => void>(() => {});
  const [result, setResult] = useState('正面');
  useEffect(() => {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setClearColor('#1b382d');
    const element = host.current!; element.appendChild(renderer.domElement);
    const scene = new Scene(), graph = createCoinFlipSceneGraph();
    graph.setCoinId('pikachu-watercolor'); scene.add(graph.root);
    const floor = new Mesh(new PlaneGeometry(32, 28), new MeshBasicMaterial({ color: '#244736' }));
    floor.rotation.x = -Math.PI / 2; floor.position.copy(graph.root.position); floor.position.y -= .15; scene.add(floor);
    const camera = new PerspectiveCamera(42, 1, .1, 100);
    camera.position.set(graph.root.position.x, graph.root.position.y + 12, graph.root.position.z + 10);
    camera.lookAt(graph.root.position.x, graph.root.position.y + 1, graph.root.position.z);
    const resize = new ResizeObserver(() => { const width = element.clientWidth; renderer.setSize(width, 400); camera.aspect = width / 400; camera.updateProjectionMatrix(); });
    resize.observe(element);
    let frame = 0, timeline: ReturnType<typeof buildCoinFlipTimeline> | undefined;
    const draw = () => { renderer.render(scene, camera); frame = requestAnimationFrame(draw); }; draw();
    flip.current = heads => {
      timeline?.kill();
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { snapCoinRestPose(graph.coin, heads); setResult(heads ? '正面' : '反面'); return; }
      setResult('抛硬币…'); timeline = buildCoinFlipTimeline(graph.coin, heads, () => setResult(heads ? '正面' : '反面'));
    };
    return () => { cancelAnimationFrame(frame); resize.disconnect(); timeline?.kill(); graph.dispose(); floor.geometry.dispose(); floor.material.dispose(); renderer.dispose(); renderer.domElement.remove(); };
  }, []);
  return <main className="a-page"><div className="a-wrap"><h1 className="a-hero-title">3D 双面与落地验证</h1><p style={{ color: '#f2e6cc' }}>{coinById('pikachu-watercolor').name} · <span role="status">{result}</span></p>
    <div style={{ display: 'flex', gap: 12 }}><button className="a-btn" onClick={() => flip.current(true)}>3D 正面</button><button className="a-btn" onClick={() => flip.current(false)}>3D 反面</button></div>
    <div ref={host} style={{ marginTop: 20, width: '100%', minHeight: 400 }} />
  </div></main>;
}
