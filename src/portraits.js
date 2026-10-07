import * as THREE from 'three';
import { instance } from './voxel.js';
import { MESH, NPC, S } from './models.js';

/** Renders voxel characters to image URLs for dialogue boxes, comics and menus. */
const SIZE = 256;
let renderer, scene, camera;
const cache = {};

const SOURCES = {
  nova: () => MESH.novaBody,
  smudge: () => MESH.smudge,
  drab: () => MESH.drab,
  mopper: () => MESH.mopper,
  fizz: () => MESH.fizz,
  vat: () => MESH.vat,
  grandpa: () => NPC.grandpa.color,
  grandpaFrozen: () => NPC.grandpa.grey,
  grandpaHolo: () => [NPC.grandpa.holo, { holo: true }],
  biscuit: () => NPC.biscuit.color,
  mittens: () => NPC.mittens.color,
  tom: () => NPC.tom.color,
  pip: () => NPC.pip.color,
  fern: () => NPC.fern.color,
  moss: () => NPC.moss.color,
  wick: () => NPC.wick.color,
  whacker: () => MESH.whacker,
  trawler: () => [MESH.trawler, { yaw: -1.2 }],
  stencil: () => MESH.stencil,
  whale: () => [MESH.skyWhale, { yaw: -1.75 }],
  whaleGrey: () => [MESH.skyWhaleGrey, { yaw: -1.75 }],
  saffron: () => NPC.saffron.color,
  quartz: () => NPC.quartz.color,
  dot: () => NPC.dot.color,
  static: () => MESH.static,
  echo: () => MESH.echoBody,
  curator: () => MESH.curatorEye,
  curatorRing: () => [MESH.curatorRingColor, { yaw: 0 }],
  archivist: () => MESH.archivist,
  docent: () => NPC.docent.color,
  juno: () => NPC.juno.color,
  gale: () => NPC.gale.color,
  sweeper: () => MESH.sweeper,
  cit0: () => NPC.cit0.color,
  cit1: () => NPC.cit1.color,
  cit2: () => NPC.cit2.color,
  cit3: () => NPC.cit3.color,
  cit4: () => NPC.cit4.color,
};

/** Speaker name → portrait key. */
export const SPEAKER_PORTRAIT = {
  Nova: 'nova', Smudge: 'smudge', 'Mrs. Biscuit': 'biscuit', 'Conductor Mittens': 'mittens',
  'Old Tom': 'tom', Pip: 'pip', 'Ranger Fern': 'fern', 'Professor Moss': 'moss', 'Old Wick': 'wick', 'Captain Saffron': 'saffron', Juno: 'juno', 'Bosun Gale': 'gale', 'Prospector Quartz': 'quartz', Dot: 'dot', 'The Curator': 'curator', Echo: 'echo', Docent: 'docent', 'Grandpa (recording)': 'grandpaHolo', 'Grandpa (hologram)': 'grandpaHolo',
};

function setup() {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(SIZE, SIZE);
  renderer.setPixelRatio(1);
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#ffffff', '#6b4de6', 1.6));
  const key = new THREE.DirectionalLight('#fff1d6', 2.2);
  key.position.set(3, 5, 6);
  scene.add(key);
  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
}

/** Forget cached renders (e.g. Nova after a wardrobe change). */
export function clearPortrait(key) {
  for (const id of Object.keys(cache)) if (id.startsWith(`${key}:`)) delete cache[id];
}

/** Frame a group in the portrait camera and return a PNG data URL. */
function shoot(group, framing, yaw) {
  if (!renderer) setup();
  group.rotation.y = yaw;
  scene.add(group);
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const full = framing === 'full';
  const face = framing === 'face', lower = framing === 'lower';
  const viewH = full ? size.y * 1.15 : face ? size.y * 0.5 : lower ? size.y * 0.72 : size.y * 0.62;
  const cy = full ? (box.min.y + box.max.y) / 2 : lower ? box.min.y + size.y * 0.4 : box.max.y - size.y * (face ? 0.24 : 0.3);
  const dist = viewH / 2 / Math.tan(THREE.MathUtils.degToRad(15)) + Math.max(size.z, size.x) / 2;
  camera.position.set(0, cy + viewH * 0.08, dist);
  camera.lookAt((box.min.x + box.max.x) / 2, cy, 0);
  renderer.render(scene, camera);
  scene.remove(group);
  return renderer.domElement.toDataURL('image/png');
}

/**
 * Render Nova from one-off meshes (see novaMeshes) — wardrobe thumbnails.
 * The meshes are disposed afterwards; results are cached by `id`.
 */
export function renderNova(id, meshes, framing = 'full', yaw = -0.35) {
  if (cache[id]) return cache[id];
  const group = new THREE.Group();
  group.add(instance(meshes.body));
  for (const x of [-2, 2]) { const leg = instance(meshes.leg); leg.position.set(x * S, 6 * S, 0); group.add(leg); }
  cache[id] = shoot(group, framing, yaw);
  group.traverse((o) => { if (o.material?.isMeshLambertMaterial) o.material.dispose(); });
  for (const m of [meshes.body, meshes.leg]) { m.solid?.dispose(); m.glow?.dispose(); }
  return cache[id];
}

/** @param {'head'|'full'} framing */
export function portrait(key, framing = 'head') {
  const id = `${key}:${framing}`;
  if (cache[id]) return cache[id];
  if (!SOURCES[key]) return '';
  if (!renderer) setup();
  let src = SOURCES[key]();
  let opts = {};
  if (Array.isArray(src)) [src, opts] = src;
  const group = instance(src, opts);
  group.rotation.y = opts.yaw ?? -0.35;
  scene.add(group);
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const full = framing === 'full' || size.y < 2.2;
  const viewH = full ? size.y * 1.15 : size.y * 0.62;
  const cy = full ? (box.min.y + box.max.y) / 2 : box.max.y - size.y * 0.3;
  const dist = viewH / 2 / Math.tan(THREE.MathUtils.degToRad(15)) + size.z / 2;
  camera.position.set(0, cy + viewH * 0.08, dist);
  camera.lookAt((box.min.x + box.max.x) / 2, cy, 0);
  renderer.render(scene, camera);
  cache[id] = renderer.domElement.toDataURL('image/png');
  scene.remove(group);
  return cache[id];
}
