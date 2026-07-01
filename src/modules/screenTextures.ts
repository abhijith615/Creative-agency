import * as THREE from "three";

const CREAM = "#efe7d6";
const BARK = "#2c2118";
const BARK_SOFT = "#6f5d49";
const RUST = "#b5562b";
const CARAMEL = "#a9783f";

function tex(canvas: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** A photoreal-ish laptop keyboard deck for the base. */
export function makeKeyboardTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 700;
  const x = c.getContext("2d")!;
  x.fillStyle = "#0c0a08";
  x.fillRect(0, 0, c.width, c.height);

  // key grid (top ~62%)
  const cols = 14;
  const rows = 5;
  const m = 40;
  const gw = (c.width - m * 2) / cols;
  const gh = 62;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const kx = m + col * gw + 5;
      const ky = 40 + r * (gh + 12);
      const kw = gw - 10;
      const grd = x.createLinearGradient(kx, ky, kx, ky + gh);
      grd.addColorStop(0, "#26201a");
      grd.addColorStop(1, "#161210");
      x.fillStyle = grd;
      (x as any).roundRect(kx, ky, kw, gh, 8);
      x.fill();
      x.strokeStyle = "rgba(0,0,0,0.6)";
      x.lineWidth = 2;
      x.stroke();
    }
  }
  // spacebar
  const sy = 40 + rows * (gh + 12);
  x.fillStyle = "#201a15";
  (x as any).roundRect(m + gw * 3, sy, gw * 8, gh, 8);
  x.fill();
  return tex(c);
}

/** A mini "designer website" for the laptop screen. */
export function makeWebsiteTexture() {
  const c = document.createElement("canvas");
  c.width = 1280;
  c.height = 800;
  const x = c.getContext("2d")!;

  // bg
  x.fillStyle = CREAM;
  x.fillRect(0, 0, c.width, c.height);

  // top bar
  x.fillStyle = BARK;
  x.font = "600 30px Georgia, serif";
  x.textBaseline = "middle";
  x.fillText("STUDIO®", 60, 60);
  x.font = "500 22px Arial";
  x.fillStyle = BARK_SOFT;
  ["Work", "About", "Journal", "Contact"].forEach((w, i) => {
    x.fillText(w, 760 + i * 130, 60);
  });

  // hero headline
  x.fillStyle = BARK;
  x.font = "400 130px Georgia, serif";
  x.fillText("Design that", 60, 250);
  x.fillStyle = RUST;
  x.font = "italic 400 130px Georgia, serif";
  x.fillText("moves people.", 60, 380);

  // sub + button
  x.fillStyle = BARK_SOFT;
  x.font = "400 26px Arial";
  x.fillText("Independent studio for premium brands.", 60, 470);
  x.fillStyle = BARK;
  x.beginPath();
  (x as any).roundRect(60, 520, 230, 66, 33);
  x.fill();
  x.fillStyle = CREAM;
  x.font = "600 22px Arial";
  x.fillText("View work  →", 92, 554);

  // image blocks (project thumbs)
  const blocks = [
    { x: 60, w: 360, g: [CARAMEL, BARK] },
    { x: 450, w: 360, g: [RUST, "#5a3320"] },
    { x: 840, w: 380, g: ["#7a4a2a", "#100b07"] },
  ];
  blocks.forEach((b) => {
    const grd = x.createLinearGradient(b.x, 640, b.x + b.w, 760);
    grd.addColorStop(0, b.g[0]);
    grd.addColorStop(1, b.g[1]);
    x.fillStyle = grd;
    (x as any).roundRect
      ? (x.beginPath(), (x as any).roundRect(b.x, 620, b.w, 150, 16), x.fill())
      : x.fillRect(b.x, 620, b.w, 150);
  });

  // fine top line
  x.strokeStyle = "rgba(44,33,24,0.18)";
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(60, 100);
  x.lineTo(1220, 100);
  x.stroke();

  return tex(c);
}

/** A mini Instagram feed for the phone screen. */
export function makeInstagramTexture() {
  const c = document.createElement("canvas");
  c.width = 720;
  c.height = 1480;
  const x = c.getContext("2d")!;

  x.fillStyle = "#ffffff";
  x.fillRect(0, 0, c.width, c.height);

  // status bar
  x.fillStyle = "#000";
  x.font = "600 26px Arial";
  x.textBaseline = "middle";
  x.fillText("9:41", 40, 40);
  x.textAlign = "right";
  x.fillText("5G", 640, 40);
  x.beginPath();
  x.fillRect(660, 28, 40, 22);
  x.textAlign = "left";

  // header: Instagram wordmark
  x.fillStyle = "#111";
  x.font = "italic 700 52px Georgia, serif";
  x.fillText("Instagram", 34, 120);
  // header icons
  x.strokeStyle = "#111";
  x.lineWidth = 4;
  [560, 630, 690].forEach((cx) => {
    x.beginPath();
    x.arc(cx, 118, 16, 0, Math.PI * 2);
    x.stroke();
  });

  // stories row
  const stories = [RUST, CARAMEL, "#7a4a2a", "#b5562b", "#8f5028"];
  stories.forEach((col, i) => {
    const cx = 80 + i * 140;
    const grd = x.createLinearGradient(cx - 45, 180, cx + 45, 270);
    grd.addColorStop(0, "#feda75");
    grd.addColorStop(0.5, RUST);
    grd.addColorStop(1, "#962fbf");
    x.fillStyle = grd;
    x.beginPath();
    x.arc(cx, 225, 48, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = "#fff";
    x.beginPath();
    x.arc(cx, 225, 41, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = col;
    x.beginPath();
    x.arc(cx, 225, 36, 0, Math.PI * 2);
    x.fill();
  });

  // post header
  x.fillStyle = "#111";
  x.beginPath();
  x.arc(70, 340, 34, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "#111";
  x.font = "600 30px Arial";
  x.fillText("noir.studio", 120, 330);
  x.fillStyle = "#888";
  x.font = "400 24px Arial";
  x.fillText("New Delhi, India", 120, 362);

  // post image (warm gradient "photo")
  const img = x.createLinearGradient(0, 400, 720, 1120);
  img.addColorStop(0, CARAMEL);
  img.addColorStop(0.5, RUST);
  img.addColorStop(1, BARK);
  x.fillStyle = img;
  x.fillRect(0, 400, 720, 720);
  // subtle sun
  const sun = x.createRadialGradient(540, 560, 20, 540, 560, 260);
  sun.addColorStop(0, "rgba(255,235,200,0.75)");
  sun.addColorStop(1, "rgba(255,235,200,0)");
  x.fillStyle = sun;
  x.fillRect(0, 400, 720, 720);

  // action icons
  x.strokeStyle = "#111";
  x.lineWidth = 5;
  // heart
  x.fillStyle = RUST;
  x.beginPath();
  x.arc(52, 1185, 15, 0, Math.PI * 2);
  x.arc(84, 1185, 15, 0, Math.PI * 2);
  x.fill();
  x.beginPath();
  x.moveTo(38, 1192);
  x.lineTo(68, 1225);
  x.lineTo(98, 1192);
  x.fill();
  // comment + share circles
  [170, 250].forEach((cx) => {
    x.beginPath();
    x.arc(cx, 1188, 18, 0, Math.PI * 2);
    x.stroke();
  });

  // likes + caption
  x.fillStyle = "#111";
  x.font = "700 28px Arial";
  x.fillText("2,481 likes", 34, 1270);
  x.font = "400 27px Arial";
  x.fillText("noir.studio  Crafted in India ✦", 34, 1320);
  x.fillStyle = "#888";
  x.fillText("View all 128 comments", 34, 1365);

  // bottom nav
  x.strokeStyle = "#111";
  x.lineWidth = 4;
  [80, 230, 380, 530, 660].forEach((cx, i) => {
    x.beginPath();
    if (i === 4) {
      x.fillStyle = "#111";
      x.beginPath();
      x.arc(cx, 1430, 20, 0, Math.PI * 2);
      x.fill();
    } else {
      x.strokeRect(cx - 18, 1412, 36, 36);
    }
  });

  return tex(c);
}
