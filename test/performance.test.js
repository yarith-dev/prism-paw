import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { Game } from '../src/game.js';
import { Level } from '../src/level.js';
import { Curator } from '../src/bosses/curator.js';
import { MESH } from '../src/models.js';
import { glowMaterial } from '../src/voxel.js';
import { settings } from '../src/settings.js';

const noop = () => {};
const disposals = (resource) => {
  let count = 0;
  resource.addEventListener('dispose', () => count++);
  return () => count;
};

function gameFixture() {
  return Object.assign(Object.create(Game.prototype), {
    beamMesh: new THREE.Group(), beamTex: new THREE.Texture(), mats: {}, retired: [],
    staticFx: { classList: { remove: noop } },
    hud: {
      root: { querySelector: () => null },
      reset: noop, setLevel: noop, setSparks: noop, setSeeds: noop,
    },
    resize: noop, syncItemsHud: noop, syncWeaponHud: noop,
    checkStages: noop, updateObjective: noop,
    spawnPlayer(x, z) {
      const root = new THREE.Group();
      root.position.set(x, 0, z);
      this.scene.add(root);
      this.player = { root, pos: root.position };
    },
  });
}

test('night-only references reset while retired meshes wait for shader compilation', async (t) => {
  t.mock.method(Level.prototype, 'buildGround', function () {
    this.groundTex = new THREE.Texture();
    this.groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshLambertMaterial());
    this.scene.add(this.groundMesh);
  });
  t.mock.method(Level.prototype, 'buildScenery', function () { this.scenery = new THREE.Group(); });
  t.mock.method(Level.prototype, 'buildBarrier', function () { this.barrier = new THREE.Group(); });

  const game = gameFixture(), def = { id: '2-3', theme: 'jungle', map: ['SF.', '...', '...'] };
  game.load({ ...def, dark: true });
  const nightScene = game.scene, nightFlies = game.fireflies;
  assert.ok(game.playerLight);
  assert.ok(nightFlies.flies.some((f) => f.owner));
  const particlesDisposed = disposals(game.pMesh);
  const fliesDisposed = disposals(nightFlies.mesh);
  const samples = game.effectSamples();
  const samplesDisposed = disposals(samples.children.find((o) => o.isInstancedMesh));
  let finishCompile;
  game.renderer = { compileAsync: () => new Promise((resolve) => { finishCompile = resolve; }) };

  game.load({ ...def, id: '3-1', map: ['S..', '...', '...'] });
  assert.equal(game.fireflies, null);
  assert.equal(game.playerLight, null);
  assert.equal(game.retired[0][0], nightScene);
  const compiled = game.compileLevel();
  assert.equal(particlesDisposed(), 0);
  assert.equal(fliesDisposed(), 0);
  finishCompile();
  await compiled;
  assert.equal(particlesDisposed(), 1);
  assert.equal(fliesDisposed(), 1);
  assert.equal(samplesDisposed(), 0);
  assert.equal(game.retired.length, 0);
  assert.equal(game.samples, samples);
  game.disposeScene(game.scene);
  game.level.dispose();
});

test('retirement disposes owned instance data without disposing shared assets', () => {
  const game = gameFixture(), scene = new THREE.Scene();
  const ownedGeo = new THREE.BoxGeometry(), ownedMat = new THREE.MeshLambertMaterial();
  const owned = new THREE.InstancedMesh(ownedGeo, ownedMat, 2);
  owned.setColorAt(0, new THREE.Color('#ffffff'));
  const cachedMat = game.mat('#ff4f6d'), sharedGeo = MESH.drab.solid;
  const shared = new THREE.InstancedMesh(sharedGeo, cachedMat, 2);
  scene.add(owned, shared, new THREE.Mesh(sharedGeo, glowMaterial));
  const instanceDisposed = disposals(owned), geometryDisposed = disposals(ownedGeo);
  const sharedInstanceDisposed = disposals(shared);
  const materialDisposed = disposals(ownedMat), sharedGeometryDisposed = disposals(sharedGeo);
  const cachedMaterialDisposed = disposals(cachedMat), glowDisposed = disposals(glowMaterial);

  game.disposeScene(scene);
  assert.equal(instanceDisposed(), 1);
  assert.equal(sharedInstanceDisposed(), 1);
  assert.equal(geometryDisposed(), 1);
  assert.equal(materialDisposed(), 1);
  assert.equal(sharedGeometryDisposed(), 0);
  assert.equal(cachedMaterialDisposed(), 0);
  assert.equal(glowDisposed(), 0);
  cachedMat.dispose();
});

test('Curator phase transition disposes every beam geometry and material', () => {
  const game = {
    scene: new THREE.Scene(), def: { lines: {} }, enemies: [],
    player: { pos: new THREE.Vector3() }, smudge: { pos: new THREE.Vector3() },
    hud: { say: noop, toast: noop }, sfx: { slam: noop },
    selectWeapon: noop, checkStages: noop,
  };
  const curator = Object.assign(Object.create(Curator.prototype), {
    game, beams: [], center: { x: 0, z: 0 },
    banner: { classList: { add: noop, remove: noop } }, syncHud: noop,
  });
  curator.startOrder();
  const beams = curator.beams.map(({ mesh }) => ({
    mesh, geometryDisposed: disposals(mesh.geometry), materialDisposed: disposals(mesh.material),
  }));
  assert.equal(beams.length, 3);
  curator.startSmudge();
  assert.equal(curator.beams.length, 0);
  for (const beam of beams) {
    assert.equal(beam.mesh.parent, null);
    assert.equal(beam.geometryDisposed(), 1);
    assert.equal(beam.materialDisposed(), 1);
  }
});

test('graphics changes invalidate old shadow targets without reallocating unchanged sizes', (t) => {
  const previous = settings.graphics;
  t.after(() => { settings.graphics = previous; });
  const game = gameFixture();
  assert.doesNotThrow(() => game.updateShadowSize());
  game.sun = new THREE.DirectionalLight();
  const shadow = game.sun.shadow;
  shadow.mapSize.set(2048, 2048);
  shadow.map = new THREE.WebGLRenderTarget(2048, 2048);
  shadow.mapPass = new THREE.WebGLRenderTarget(2048, 2048);
  const mapDisposed = disposals(shadow.map), passDisposed = disposals(shadow.mapPass);

  settings.graphics = 'fast';
  game.updateShadowSize();
  assert.deepEqual(shadow.mapSize.toArray(), [1024, 1024]);
  assert.equal(shadow.map, null);
  assert.equal(shadow.mapPass, null);
  assert.equal(shadow.needsUpdate, true);
  assert.equal(mapDisposed(), 1);
  assert.equal(passDisposed(), 1);

  const fastMap = shadow.map = new THREE.WebGLRenderTarget(1024, 1024);
  const fastDisposed = disposals(fastMap);
  game.updateShadowSize();
  assert.equal(shadow.map, fastMap);
  assert.equal(fastDisposed(), 0);
  for (const mode of ['sharp', 'auto']) {
    settings.graphics = mode;
    game.updateShadowSize();
    assert.deepEqual(shadow.mapSize.toArray(), [2048, 2048]);
  }
  assert.equal(shadow.map, null);
  assert.equal(fastDisposed(), 1);
});
