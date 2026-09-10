// Decorative state-space illustration. The SVG remains if WebGL is unavailable.
const host = document.querySelector('#scene');
const button = document.querySelector('#motion');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

async function start() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true });
  if (!context) return;
  const THREE = await import('./vendor/three.js');
  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  camera.position.set(0, 0, 6.5);
  const globe = new THREE.Group();
  globe.rotation.set(.32, .25, -.3);
  scene.add(globe);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x8aa99d, transparent: true, opacity: .45 });
  const radius = 1.5;
  const circle = (r, y, vertical = false) => {
    const points = Array.from({ length: 129 }, (_, i) => {
      const t = i / 128 * Math.PI * 2;
      return new THREE.Vector3(r * Math.cos(t), vertical ? r * Math.sin(t) : y, vertical ? y : r * Math.sin(t));
    });
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial);
  };
  for (let i = -3; i <= 3; i++) {
    const y = i * radius / 4;
    globe.add(circle(Math.sqrt(radius * radius - y * y), y));
  }
  for (let i = 0; i < 6; i++) {
    const meridian = circle(radius, 0, true);
    meridian.rotation.y = i * Math.PI / 6;
    globe.add(meridian);
  }
  const axisMaterial = new THREE.LineBasicMaterial({ color: 0xb9cbbf, transparent: true, opacity: .25 });
  for (const axis of [new THREE.Vector3(1.9, 0, 0), new THREE.Vector3(0, 1.9, 0), new THREE.Vector3(0, 0, 1.9)]) {
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([axis.clone().negate(), axis]), axisMaterial));
  }
  const vector = new THREE.Vector3(.95, 1.03, .53).normalize().multiplyScalar(radius);
  globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), vector]), new THREE.LineBasicMaterial({ color: 0xd9f686 })));
  const point = new THREE.Mesh(new THREE.SphereGeometry(.055, 16, 12), new THREE.MeshBasicMaterial({ color: 0xd9f686 }));
  point.position.copy(vector);
  globe.add(point);
  const orbit = circle(1.72, 0);
  orbit.rotation.set(.65, .3, .4);
  orbit.material = new THREE.LineBasicMaterial({ color: 0xd9f686, transparent: true, opacity: .65 });
  globe.add(orbit);
  host.append(canvas);
  canvas.setAttribute('aria-hidden', 'true');
  let paused = reducedMotion.matches;
  let visible = true;
  let frame = 0;
  let previous = 0;
  let pointerX = 0;
  let pointerY = 0;
  const render = () => renderer.render(scene, camera);
  const animate = time => {
    const elapsed = previous ? Math.min((time - previous) / 1000, .05) : 0;
    previous = time;
    globe.rotation.y += elapsed * .1;
    globe.rotation.x += (.32 + pointerY * .12 - globe.rotation.x) * .025;
    globe.rotation.z += (-.3 + pointerX * .12 - globe.rotation.z) * .025;
    render();
    frame = requestAnimationFrame(animate);
  };
  const update = () => {
    cancelAnimationFrame(frame);
    previous = 0;
    button.textContent = paused ? 'Play motion' : 'Pause motion';
    if (!paused && visible && !document.hidden) frame = requestAnimationFrame(animate);
  };
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); });
  intersection.observe(host);
  button.addEventListener('click', () => { paused = !paused; update(); });
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; update(); });
  document.addEventListener('visibilitychange', update);
  host.addEventListener('pointermove', event => {
    if (paused || event.pointerType !== 'mouse') return;
    const rect = host.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width - .5;
    pointerY = (event.clientY - rect.top) / rect.height - .5;
  });
  host.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
  canvas.addEventListener('webglcontextlost', () => {
    paused = true;
    update();
    observer.disconnect();
    intersection.disconnect();
    button.hidden = true;
    canvas.hidden = true;
    host.classList.remove('ready');
  });
  resize();
  host.classList.add('ready');
  button.hidden = false;
  update();
}

start().catch(() => {
  host.querySelector('canvas')?.remove();
  host.classList.remove('ready');
  button.hidden = true;
});
