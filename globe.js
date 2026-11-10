/* 3D Жер шары: NASA Blue Marble + түнгі жарық + шекаралар + Қазақстан + нүктелер.
   createGlobe(el, {manual, onPick, kz}) → { pose, flyTo, frame, markers, setNight, setSpin, latLonAt, labelsOn, dispose } */
import * as THREE from 'three';

const D2R = Math.PI / 180;
export function ll2v(lat, lon, r) {
  const phi = (90 - lat) * D2R, th = (90 - lon) * D2R;
  return new THREE.Vector3(r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}
export function v2ll(v) {
  const r = v.length(); const lat = 90 - Math.acos(v.y / r) / D2R;
  let lon = 90 - Math.atan2(v.z, v.x) / D2R; lon = ((lon + 540) % 360) - 180; return [lat, lon];
}
export function dist(a, b) { /* градуспен үлкен шеңбер қашықтығы */
  const [la1, lo1] = a, [la2, lo2] = b; const p1 = la1 * D2R, p2 = la2 * D2R, dl = (lo2 - lo1) * D2R;
  return Math.acos(Math.min(1, Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(dl))) / D2R;
}
const BASE = new URL('./vendor/globe/', import.meta.url).href;
const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });

let texCache = null;
async function buildTextures() {
  if (texCache) return texCache;
  const [day, night, topo] = await Promise.all([loadImg(BASE + 'earth-blue-marble.jpg'), loadImg(BASE + 'earth-night.jpg'), fetch(BASE + 'countries-50m.json').then((r) => r.json())]);
  const W = 4096, H = 2048, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.drawImage(day, 0, 0, W, H);
  /* сәл қанық, жарқын түстер */
  x.globalCompositeOperation = 'soft-light'; x.fillStyle = 'rgba(40,120,170,.25)'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
  const fc = window.topojson.feature(topo, topo.objects.countries);
  const P = (lo, la) => [(lo + 180) / 360 * W, (90 - la) / 180 * H];
  const path = (geom) => { x.beginPath(); const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : []; polys.forEach((poly) => poly.forEach((ring) => { let px = null; ring.forEach(([lo, la], k) => { const [X, Y] = P(lo, la); if (k === 0 || (px != null && Math.abs(X - px) > W / 2)) x.moveTo(X, Y); else x.lineTo(X, Y); px = X; }); })); };
  x.lineJoin = 'round'; x.strokeStyle = 'rgba(255,255,255,.38)'; x.lineWidth = 1.6;
  fc.features.forEach((f) => { if (f.geometry) { path(f.geometry); x.stroke(); } });
  const kz = fc.features.find((f) => String(f.id) === '398');
  if (kz) { path(kz.geometry); x.fillStyle = 'rgba(255,196,0,.30)'; x.fill(); x.strokeStyle = '#FFD23F'; x.lineWidth = 5; x.stroke(); }
  /* градус торы */
  x.strokeStyle = 'rgba(160,220,255,.10)'; x.lineWidth = 1.2;
  for (let lo = -180; lo <= 180; lo += 30) { x.beginPath(); x.moveTo(...P(lo, 90)); x.lineTo(...P(lo, -90)); x.stroke(); }
  for (let la = -60; la <= 60; la += 30) { x.beginPath(); x.moveTo(...P(-180, la)); x.lineTo(...P(180, la)); x.stroke(); }
  texCache = { day: c, night };
  return texCache;
}

function glowTex(color) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, '#fff'); g.addColorStop(0.18, color); g.addColorStop(0.45, color + '88'); g.addColorStop(1, color + '00');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}

export async function createGlobe(el, opts) {
  opts = opts || {};
  const tex = await buildTextures();
  const W = () => el.clientWidth || 800, H = () => el.clientHeight || 600;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!opts.manual });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(W(), H());
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
  el.appendChild(renderer.domElement);
  const labels = document.createElement('div'); labels.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
  el.appendChild(labels);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(36, W() / H(), 0.1, 1000);

  /* жұлдыздар */
  const sg = new THREE.BufferGeometry(), sp = [], sc = [];
  for (let i = 0; i < 2600; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(180 + Math.random() * 120); sp.push(v.x, v.y, v.z); const k = 0.55 + Math.random() * 0.45; sc.push(k, k, k + Math.random() * 0.15); }
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.9, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 0.9 })));

  const dayT = new THREE.CanvasTexture(tex.day); dayT.colorSpace = THREE.SRGBColorSpace; dayT.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const nightT = new THREE.Texture(tex.night); nightT.needsUpdate = true; nightT.colorSpace = THREE.SRGBColorSpace;
  const U = { day: { value: dayT }, night: { value: nightT }, sun: { value: new THREE.Vector3(1, 0.4, 1).normalize() }, nightMix: { value: 0 }, tint: { value: new THREE.Vector4(0, 0, 0, 0) } };
  const earthMat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform sampler2D day; uniform sampler2D night; uniform vec3 sun; uniform float nightMix; uniform vec4 tint; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ vec3 d=texture2D(day,vUv).rgb; vec3 n=texture2D(night,vUv).rgb; float l=dot(normalize(vN),normalize(sun));
        float lit=mix(0.55+0.55*smoothstep(-0.3,0.8,l), 0.12, nightMix);
        vec3 col=d*lit + n*vec3(1.0,0.85,0.55)*(nightMix*1.9);
        col=mix(col, tint.rgb*(0.6+0.6*length(d)), tint.a);
        float rim=pow(1.0-max(dot(normalize(vN),normalize(vV)),0.0),2.6); col+=vec3(0.30,0.62,1.0)*rim*0.85;
        gl_FragColor=vec4(col,1.0);
#include <colorspace_fragment>
}`
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(10, 128, 96), earthMat); earth.rotation.y = -Math.PI / 2; scene.add(earth);
  const atm = new THREE.Mesh(new THREE.SphereGeometry(10.9, 96, 64), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vN; void main(){ float i=pow(0.72-dot(vN,vec3(0,0,1.)),3.0); gl_FragColor=vec4(0.35,0.7,1.0,1.0)*i*1.6; }`
  })); scene.add(atm);

  /* нүктелер */
  const mk = new Map(), texs = {};
  function marker(o) {
    if (mk.has(o.id)) removeMarker(o.id);
    const col = o.color || '#FF4D6D'; texs[col] = texs[col] || glowTex(col);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texs[col], transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending }));
    const p = ll2v(o.lat, o.lon, 10.08); s.position.copy(p); s.scale.setScalar(o.size || 1.2); scene.add(s);
    const ringG = new THREE.RingGeometry(0.42, 0.5, 48); const ring = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    ring.position.copy(ll2v(o.lat, o.lon, 10.04)); ring.lookAt(0, 0, 0); scene.add(ring);
    let lab = null; if (o.label) { lab = document.createElement('div'); lab.className = 'glab'; lab.innerHTML = o.label; lab.style.cssText = `position:absolute;left:0;top:0;transform:translate(-50%,-140%);white-space:nowrap;font:800 ${o.fs || 22}px Nunito,'Golos Text',sans-serif;color:#fff;background:${col}E6;padding:5px 12px;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.4);transition:opacity .3s`; labels.appendChild(lab); }
    mk.set(o.id, { o, s, ring, lab, p, born: o.t0 != null ? o.t0 : -1 });
  }
  function removeMarker(id) { const m = mk.get(id); if (!m) return; scene.remove(m.s); scene.remove(m.ring); if (m.lab) m.lab.remove(); mk.delete(id); }
  function clearMarkers() { [...mk.keys()].forEach(removeMarker); }

  /* камера күйі: lat, lon, dist */
  const st = { lat: 30, lon: 60, d: 34, spin: opts.spin || 0 }; let fly = null, shiftX = opts.shift || 0;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function lerpLon(a, b, k) { let d = ((b - a + 540) % 360) - 180; return a + d * k; }
  function pose(lat, lon, d) { st.lat = lat; st.lon = lon; st.d = d; }
  function flyTo(lat, lon, d, ms) { return new Promise((res) => { fly = { a: { ...st }, b: { lat, lon, d: d || st.d }, t0: performance.now(), ms: ms || 2200, res }; }); }
  /* екі нүкте арасында «секіріп» ұшу: ортасында алыстайды */
  function interp(a, b, k) { const e = ease(k); const far = Math.min(14, dist([a.lat, a.lon], [b.lat, b.lon]) / 7); return { lat: a.lat + (b.lat - a.lat) * e, lon: lerpLon(a.lon, b.lon, e), d: a.d + (b.d - a.d) * e + far * Math.sin(Math.PI * e) }; }

  /* басу / сүйреу */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function latLonAt(cx, cy) { const r = renderer.domElement.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); const h = ray.intersectObject(earth)[0]; return h ? v2ll(h.point) : null; }
  let drag = null, moved = 0;
  const cv = renderer.domElement;
  if (!opts.manual) {
    cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, lat: st.lat, lon: st.lon }; moved = 0; fly = null; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy)); const k = 0.18 * st.d / 34; st.lon = drag.lon - dx * k; st.lat = Math.max(-80, Math.min(80, drag.lat + dy * k)); });
    cv.addEventListener('pointerup', (e) => { const was = drag; drag = null; if (was && moved < 8 && opts.onPick) { const ll = latLonAt(e.clientX, e.clientY); if (ll) opts.onPick(ll[0], ll[1]); } });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); st.d = Math.max(13, Math.min(60, st.d * (e.deltaY > 0 ? 1.08 : 0.92))); }, { passive: false });
  }

  function resize() { const w = W(), h = H(); renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  const ro = new ResizeObserver(resize); ro.observe(el);

  const tmp = new THREE.Vector3();
  function frame(now) {
    now = now == null ? performance.now() : now;
    if (fly) { const k = Math.min(1, (now - fly.t0) / fly.ms); Object.assign(st, interp(fly.a, fly.b, k)); if (k >= 1) { const r = fly.res; fly = null; r(); } }
    else if (st.spin && !drag) st.lon += st.spin * 0.016;
    const p = ll2v(st.lat, st.lon, st.d); cam.position.copy(p); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0);
    if (opts.offsetX) { cam.setViewOffset(W(), H(), -opts.offsetX * W(), 0, W(), H()); }
    /* күн камераның сол жақ үстінде */
    U.sun.value.set(-0.6, 0.55, 0.75).normalize();
    cam.updateMatrixWorld(); const camDir = cam.position.clone().normalize(), w = W(), h = H();
    mk.forEach((m) => {
      const age = m.born >= 0 ? (now - m.born) / 1000 : 9;
      const pop = Math.min(1, Math.max(0, age / 0.6)), pulse = (now / 1000 * 0.9 + m.o.lat * 0.01) % 1;
      const zs = Math.min(1, st.d / 34);
      m.s.scale.setScalar((m.o.size || 1.2) * (0.85 + 0.25 * Math.sin(now / 300 + m.o.lon)) * pop * zs);
      m.ring.scale.setScalar((0.5 + pulse * 1.8) * (m.o.size || 1.2) * pop * zs); m.ring.material.opacity = (1 - pulse) * 0.9 * pop;
      if (m.lab) { let vis = tmp.copy(m.p).normalize().dot(camDir) > 0.25; tmp.copy(m.p).project(cam); if (opts.labelMinX && (tmp.x + 1) / 2 * w < opts.labelMinX) vis = false; m.lab.style.left = ((tmp.x + 1) / 2 * w) + 'px'; m.lab.style.top = ((1 - tmp.y) / 2 * h) + 'px'; m.lab.style.opacity = vis && pop > 0.5 && labelsOn ? 1 : 0; m.lab.style.transition = opts.manual ? 'none' : 'opacity .3s'; }
    });
    renderer.render(scene, cam);
  }
  let labelsOn = true, alive = true;
  (function loop() { if (!alive || opts.manual) return; frame(); requestAnimationFrame(loop); })();
  return {
    pose, flyTo, frame, marker, removeMarker, clearMarkers, latLonAt, cam, state: st,
    setNight: (v) => { U.nightMix.value = v; }, setTint: (r, g, b, a) => U.tint.value.set(r, g, b, a),
    setSpin: (v) => { st.spin = v; }, setShift: (v) => { shiftX = v; }, labelsOn: (v) => { labelsOn = v; }, resize,
    dispose: () => { alive = false; ro.disconnect(); renderer.dispose(); el.innerHTML = ''; }
  };
}
