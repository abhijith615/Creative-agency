import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { makeWebsiteTexture, makeKeyboardTexture } from "./screenTextures";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const rbox = (w: number, h: number, d: number, r = 0.06, seg = 4) =>
  new RoundedBoxGeometry(w, h, d, seg, r);

interface Device {
  group: THREE.Group;
  base: THREE.Vector3;
  scale: number;
  baseRotY: number;
  spin: number;
  phase: number;
}

export function initHeroScene(container: HTMLElement) {
  const isMobile = window.matchMedia("(max-width: 820px)").matches;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.2, 9.5);

  // studio reflections
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // ---- lighting: warm key (shadow) + rust rim + cool fill + top
  scene.add(new THREE.AmbientLight(0xfff2e2, 0.35));
  const key = new THREE.DirectionalLight(0xfff1dd, 3.0);
  key.position.set(4.5, 6.5, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
  key.shadow.radius = 8;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 40;
  const sc = key.shadow.camera as THREE.OrthographicCamera;
  sc.left = -7;
  sc.right = 7;
  sc.top = 7;
  sc.bottom = -7;
  sc.updateProjectionMatrix();
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff8a3d, 1.8);
  rim.position.set(-7, 2, -4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xd9ecff, 0.7);
  fill.position.set(-4, -2, 6);
  scene.add(fill);
  const top = new THREE.DirectionalLight(0xffffff, 0.8);
  top.position.set(0, 8, 1);
  scene.add(top);

  const root = new THREE.Group();
  root.position.set(0.3, 0.35, 0);
  scene.add(root);

  // ---- shared materials
  const aluminium = new THREE.MeshPhysicalMaterial({
    color: 0xcac4bb,
    metalness: 1,
    roughness: 0.42,
    clearcoat: 0.4,
    clearcoatRoughness: 0.35,
    envMapIntensity: 1.5,
  });
  const titanium = new THREE.MeshPhysicalMaterial({
    color: 0x3a3a40,
    metalness: 1,
    roughness: 0.35,
    clearcoat: 0.5,
    envMapIntensity: 1.4,
  });
  const matteBlack = new THREE.MeshPhysicalMaterial({
    color: 0x121110,
    metalness: 0.2,
    roughness: 0.62,
    clearcoat: 0.25,
    envMapIntensity: 0.8,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: 0x0b0a09,
    metalness: 0.1,
    roughness: 0.9,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.06,
    transparent: true,
    opacity: 0.09,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 3,
  });

  const shadowCasters: THREE.Object3D[] = [];
  const markShadows = (g: THREE.Object3D) => {
    g.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    shadowCasters.push(g);
  };

  // glassy screen assembly (black bezel + emissive UI + reflective glass)
  function makeScreen(texMap: THREE.Texture, w: number, h: number) {
    const g = new THREE.Group();
    const bezel = new THREE.Mesh(
      rbox(w + 0.14, h + 0.14, 0.03, 0.05),
      new THREE.MeshPhysicalMaterial({
        color: 0x060606,
        metalness: 0.3,
        roughness: 0.35,
        clearcoat: 0.6,
      })
    );
    g.add(bezel);
    const scr = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: texMap, toneMapped: false })
    );
    scr.position.z = 0.02;
    g.add(scr);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.14, h + 0.14), glassMat);
    glass.position.z = 0.021;
    g.add(glass);
    return g;
  }

  // ---------- LAPTOP ----------
  const laptop = new THREE.Group();
  const lbase = new THREE.Mesh(rbox(3.25, 0.16, 2.25, 0.07), aluminium);
  laptop.add(lbase);
  // keyboard deck
  const deck = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 1.35),
    new THREE.MeshStandardMaterial({
      map: makeKeyboardTexture(),
      roughness: 0.7,
      metalness: 0.1,
    })
  );
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(0, 0.083, -0.28);
  laptop.add(deck);
  const trackpad = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 0.72),
    new THREE.MeshPhysicalMaterial({
      color: 0x2b2219,
      roughness: 0.28,
      metalness: 0.4,
      clearcoat: 0.6,
      envMapIntensity: 1,
    })
  );
  trackpad.rotation.x = -Math.PI / 2;
  trackpad.position.set(0, 0.084, 0.66);
  laptop.add(trackpad);
  // hinge
  const hinge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 3.05, 24),
    titanium
  );
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, 0.09, -1.05);
  laptop.add(hinge);
  // lid
  const lid = new THREE.Group();
  lid.position.set(0, 0.09, -1.05);
  const lidPanel = new THREE.Mesh(rbox(3.25, 2.16, 0.1, 0.07), aluminium);
  lidPanel.position.y = 1.08;
  lid.add(lidPanel);
  const laptopScreen = makeScreen(makeWebsiteTexture(), 2.88, 1.78);
  laptopScreen.position.set(0, 1.08, 0.056);
  lid.add(laptopScreen);
  // lid logo
  const logo = new THREE.Mesh(
    new THREE.CircleGeometry(0.12, 24),
    new THREE.MeshStandardMaterial({ color: 0xe9e2d4, roughness: 0.5, metalness: 0.6 })
  );
  logo.position.set(0, 1.08, -0.056);
  logo.rotation.y = Math.PI;
  lid.add(logo);
  laptop.add(lid);
  markShadows(laptop);
  root.add(laptop);

  // ---------- DSLR CAMERA ----------
  const cam = new THREE.Group();
  const camBody = new THREE.Mesh(rbox(2.05, 1.42, 0.92, 0.12), matteBlack);
  cam.add(camBody);
  const grip = new THREE.Mesh(rbox(0.55, 1.36, 1.0, 0.16), rubber);
  grip.position.set(-1.0, -0.05, 0);
  cam.add(grip);
  // textured front plate
  const plate = new THREE.Mesh(rbox(1.2, 1.2, 0.04, 0.08), rubber);
  plate.position.set(0.25, -0.05, 0.47);
  cam.add(plate);
  // pentaprism
  const prism = new THREE.Mesh(rbox(0.8, 0.42, 0.66, 0.06), matteBlack);
  prism.position.set(0.08, 0.82, 0);
  cam.add(prism);
  const prismTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.001, 0.34, 0.34, 4),
    matteBlack
  );
  prismTop.rotation.y = Math.PI / 4;
  prismTop.position.set(0.08, 1.05, 0);
  cam.add(prismTop);
  // hotshoe
  const shoe = new THREE.Mesh(rbox(0.28, 0.08, 0.3, 0.02), titanium);
  shoe.position.set(0.08, 1.24, 0);
  cam.add(shoe);
  // mode dial
  const dial = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.14, 32),
    new THREE.MeshStandardMaterial({ color: 0x1a1714, metalness: 0.7, roughness: 0.4 })
  );
  dial.position.set(0.78, 0.78, -0.05);
  cam.add(dial);
  // shutter
  const shutter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.13, 24),
    new THREE.MeshStandardMaterial({ color: 0x2a2018, metalness: 0.85, roughness: 0.28 })
  );
  shutter.position.set(-0.78, 0.76, 0.1);
  cam.add(shutter);
  // viewfinder eyecup
  const vf = new THREE.Mesh(rbox(0.42, 0.3, 0.16, 0.05), rubber);
  vf.position.set(0.08, 0.72, -0.5);
  cam.add(vf);
  // ---- lens stack
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0x0c0b0a,
    metalness: 0.6,
    roughness: 0.4,
  });
  const mount = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.2, 48),
    lensMat
  );
  mount.rotation.x = Math.PI / 2;
  mount.position.set(0.2, -0.06, 0.55);
  cam.add(mount);
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.54, 0.5, 0.55, 48),
    lensMat
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0.2, -0.06, 0.9);
  cam.add(barrel);
  // rubberized zoom ring
  const zoom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.57, 0.57, 0.26, 48),
    rubber
  );
  zoom.rotation.x = Math.PI / 2;
  zoom.position.set(0.2, -0.06, 0.92);
  cam.add(zoom);
  const front = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.54, 0.28, 48),
    lensMat
  );
  front.rotation.x = Math.PI / 2;
  front.position.set(0.2, -0.06, 1.2);
  cam.add(front);
  // red accent ring (L-series vibe)
  const redRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.028, 16, 48),
    new THREE.MeshStandardMaterial({ color: 0xb5562b, metalness: 0.3, roughness: 0.4 })
  );
  redRing.position.set(0.2, -0.06, 1.33);
  cam.add(redRing);
  // front element glass (coated, reflective)
  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(0.44, 48),
    new THREE.MeshPhysicalMaterial({
      color: 0x0a1826,
      metalness: 0,
      roughness: 0.02,
      transmission: 0.35,
      thickness: 0.5,
      ior: 1.6,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 2.2,
    })
  );
  glass.position.set(0.2, -0.06, 1.35);
  cam.add(glass);
  const redDot = new THREE.Mesh(
    new THREE.CircleGeometry(0.045, 20),
    new THREE.MeshStandardMaterial({
      color: 0xd8452a,
      emissive: 0x772010,
      emissiveIntensity: 0.6,
    })
  );
  redDot.position.set(0.86, 0.5, 0.47);
  cam.add(redDot);
  markShadows(cam);
  root.add(cam);

  // ---- layout / animation params
  const devices: Device[] = [
    { group: laptop, base: new THREE.Vector3(-1.85, 0.05, 0.2), scale: 0.86, baseRotY: 0.28, spin: -1.0, phase: 0 },
    { group: cam, base: new THREE.Vector3(1.95, -0.2, 0.3), scale: 0.8, baseRotY: -0.5, spin: 1.1, phase: 2.4 },
  ];

  const mouse = { x: 0, y: 0 };
  window.addEventListener(
    "pointermove",
    (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true }
  );

  function resize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const portrait = w / h < 1;
    // on narrow/portrait screens lift the cluster into the upper area, shrink
    // it and pull the camera back so devices sit clear of the hero copy
    root.position.set(portrait ? 0 : 0.3, portrait ? 1.25 : 0.35, 0);
    root.scale.setScalar(portrait ? 0.72 : 1);
    camera.position.z = portrait ? 13.5 : 9.5;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();
  let entranceStart = -1;
  let scrollP = 0;
  let mX = 0;
  let mY = 0;
  let raf = 0;
  let running = true;

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();

    let e = 0;
    if (entranceStart >= 0) e = smooth(clamp((t - entranceStart) / 1.8, 0, 1));

    const targetP = clamp(window.scrollY / (window.innerHeight * 0.9), 0, 1);
    scrollP += (targetP - scrollP) * 0.08;
    const p = scrollP;

    mX += (mouse.x - mX) * 0.05;
    mY += (mouse.y - mY) * 0.05;
    root.rotation.y = mX * 0.32;
    root.rotation.x = -mY * 0.18;

    devices.forEach((d) => {
      const b = d.base;
      const spread = 0.7 + 0.3 * e + p * 0.1;
      d.group.position.x = b.x * spread;
      d.group.position.y =
        b.y + (1 - e) * -3.2 + Math.sin(t * 0.7 + d.phase) * 0.14 + p * 0.25;
      d.group.position.z = b.z + p * 0.6;
      d.group.scale.setScalar(d.scale * (0.5 + 0.5 * e));
      d.group.rotation.y =
        d.baseRotY + Math.sin(t * 0.5 + d.phase) * 0.12 + p * d.spin;
      d.group.rotation.x = Math.sin(t * 0.45 + d.phase) * 0.05 - p * 0.12;
      d.group.rotation.z = Math.sin(t * 0.35 + d.phase) * 0.025;
    });

    lid.rotation.x = lerp(-Math.PI / 2, -0.32, clamp(e * 0.8 + p * 0.5, 0, 1));

    renderer.render(scene, camera);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      raf = requestAnimationFrame(frame);
    }
  });

  raf = requestAnimationFrame(frame);

  return {
    start() {
      entranceStart = clock.getElapsedTime();
    },
  };
}
