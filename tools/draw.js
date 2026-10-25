// Draws flat-style illustrations of a woman doing each exercise, as SVG files.
// Usage: node draw.js <outDir>
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2];

const C = {
  bg: '#EEF0EC', mat: '#D9E0F4', skin: '#F2C29E', skinFar: '#DDA47E', hair: '#3A2418',
  top: '#6B5BD6', topFar: '#5747BD', legs: '#262A3F', legsFar: '#41466A', shoe: '#F07A5A',
  metal: '#3C3F45', metalLight: '#8A8F98', pad: '#4A4E57', arrow: '#9AA19A',
};
const L = { torso: 68, upper: 40, fore: 36, thigh: 52, shin: 50, foot: 15 };
const GROUND = 250;
const rad = (a) => (a * Math.PI) / 180;
const dir = (a) => [Math.cos(rad(a)), Math.sin(rad(a))];
const add = (p, a, len) => { const d = dir(a); return [p[0] + d[0] * len, p[1] + d[1] * len]; };
const f = (n) => Math.round(n * 10) / 10;
const pt = (p) => `${f(p[0])},${f(p[1])}`;

function line(a, b, w, color) {
  return `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
}

// One limb: [upper angle, lower angle, scale1?, scale2?]
function limb(start, spec, l1, l2) {
  const [a1, a2, s1 = 1, s2 = 1] = spec;
  const mid = add(start, a1, l1 * s1);
  const end = add(mid, a2, l2 * s2);
  return { mid, end };
}

function figure(p) {
  const face = p.face ?? 1;
  const out = [];
  const hip = p.hip;
  const tdir = dir(p.torso);
  const neck = add(hip, p.torso, L.torso);
  const front = [-tdir[1] * face, tdir[0] * face];
  const headC = [neck[0] + tdir[0] * 17 + (p.headTilt ? front[0] * p.headTilt : 0), neck[1] + tdir[1] * 17 + (p.headTilt ? front[1] * p.headTilt : 0)];

  if (p.view === 'front') return frontFigure(p, neck, headC);

  const shoulder = add(neck, p.torso + 180, 6);
  const legN = limb(hip, p.legN, L.thigh, L.shin);
  const legF = limb(hip, p.legF ?? p.legN, L.thigh, L.shin);
  const armN = limb(shoulder, p.armN, L.upper, L.fore);
  const armF = limb(shoulder, p.armF ?? p.armN, L.upper, L.fore);
  const footA = (leg, spec, fa) => fa ?? spec[1] - 90 * face;

  const drawLeg = (leg, spec, fa, far) => {
    out.push(line(hip, leg.mid, 21, far ? C.legsFar : C.legs));
    out.push(line(leg.mid, leg.end, 16, far ? C.legsFar : C.legs));
    out.push(line(leg.end, add(leg.end, footA(leg, spec, fa), L.foot), 10, C.shoe));
  };
  const drawArm = (arm, far) => {
    const sk = far ? C.skinFar : C.skin;
    out.push(line(shoulder, arm.mid, 12, sk));
    out.push(line(arm.mid, arm.end, 10, sk));
    out.push(`<circle cx="${f(arm.end[0])}" cy="${f(arm.end[1])}" r="6" fill="${sk}"/>`);
  };

  // far side first
  drawArm(armF, true);
  drawLeg(legF, p.legF ?? p.legN, p.footF ?? p.footN, true);
  drawLeg(legN, p.legN, p.footN, false);

  // torso: tapered shape along hip -> neck
  const prof = (t, side) => {
    // side: +1 front, -1 back
    const w = t < 0.12 ? 16 : t < 0.45 ? 16 - (t - 0.12) * 12 : t < 0.8 ? 12 + (t - 0.45) * 12 : 16 - (t - 0.8) * 15;
    const bust = side > 0 && t > 0.62 && t < 0.88 ? 3 : 0;
    const c = [hip[0] + tdir[0] * L.torso * t, hip[1] + tdir[1] * L.torso * t];
    return [c[0] + front[0] * (w + bust) * side, c[1] + front[1] * (w + bust) * side];
  };
  const band = (t0, t1, color) => {
    const ts = []; for (let i = 0; i <= 8; i++) ts.push(t0 + ((t1 - t0) * i) / 8);
    const pts = ts.map((t) => prof(t, 1)).concat(ts.reverse().map((t) => prof(t, -1)));
    out.push(`<polygon points="${pts.map(pt).join(' ')}" fill="${color}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`);
  };
  out.push(`<circle cx="${f(hip[0])}" cy="${f(hip[1])}" r="15" fill="${C.legs}"/>`);
  band(0, 0.36, C.legs);
  band(0.34, 0.5, C.skin);
  band(0.48, 1, C.top);
  out.push(line(neck, add(neck, p.torso, 8), 8, C.skin));

  head(out, headC, tdir, front);
  if (p.props) out.push(p.props({ hip, neck, shoulder, armN, armF, legN, legF, headC }));
  drawArm(armN, false);
  if (p.propsFront) out.push(p.propsFront({ hip, neck, shoulder, armN, armF, legN, legF, headC }));
  return out.join('');
}

function head(out, c, up, front) {
  // ponytail behind, hair on back/top, face in front
  const back = [-front[0], -front[1]];
  const tail = [c[0] + back[0] * 15 - up[0] * 2, c[1] + back[1] * 15 - up[1] * 2];
  const tail2 = [tail[0] + back[0] * 7 - up[0] * 9, tail[1] + back[1] * 7 - up[1] * 9];
  out.push(`<path d="M${pt([c[0] + back[0] * 8 + up[0] * 6, c[1] + back[1] * 8 + up[1] * 6])} Q${pt(tail)} ${pt(tail2)}" stroke="${C.hair}" stroke-width="9" fill="none" stroke-linecap="round"/>`);
  // hair: full circle shifted back/up, face circle shifted forward -> crescent of hair
  out.push(`<circle cx="${f(c[0] + back[0] * 2 + up[0] * 1.5)}" cy="${f(c[1] + back[1] * 2 + up[1] * 1.5)}" r="14.5" fill="${C.hair}"/>`);
  const fc = [c[0] + front[0] * 3 - up[0] * 1.5, c[1] + front[1] * 3 - up[1] * 1.5];
  out.push(`<circle cx="${f(fc[0])}" cy="${f(fc[1])}" r="11.5" fill="${C.skin}"/>`);
}
function cross(a, b) { return a[0] * b[1] - a[1] * b[0]; }

function frontFigure(p, neck, headC) {
  const out = [];
  const hip = p.hip;
  const sh = 17, hw = 11;
  const shL = [neck[0] - sh, neck[1] + 6], shR = [neck[0] + sh, neck[1] + 6];
  const hL = [hip[0] - hw, hip[1]], hR = [hip[0] + hw, hip[1]];
  const armL = limb(shL, p.armL, L.upper, L.fore), armR = limb(shR, p.armR, L.upper, L.fore);
  const legL = limb(hL, p.legL, L.thigh, L.shin), legR = limb(hR, p.legR, L.thigh, L.shin);
  if (p.props) out.push(p.props({ hip, neck, shL, shR, armL, armR, legL, legR, headC }));
  const drawLeg = (h, leg, side) => {
    out.push(line(h, leg.mid, 21, C.legs));
    out.push(line(leg.mid, leg.end, 16, C.legs));
    out.push(`<ellipse cx="${f(leg.end[0] + side * 3)}" cy="${f(leg.end[1] + 3)}" rx="8" ry="5" fill="${C.shoe}"/>`);
  };
  drawLeg(hL, legL, -1); drawLeg(hR, legR, 1);
  // torso
  const y0 = hip[1], y1 = neck[1] + 4;
  const ty = (t) => y0 + (y1 - y0) * t;
  const shape = (t0, t1, color) => {
    const ts = []; for (let i = 0; i <= 8; i++) ts.push(t0 + ((t1 - t0) * i) / 8);
    const w = (t) => (t < 0.12 ? 17 : t < 0.45 ? 17 - (t - 0.12) * 18 : t < 0.85 ? 11 + (t - 0.45) * 22 : 20);
    const pts = ts.map((t) => [hip[0] + w(t), ty(t)]).concat(ts.reverse().map((t) => [hip[0] - w(t), ty(t)]));
    out.push(`<polygon points="${pts.map(pt).join(' ')}" fill="${color}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`);
  };
  shape(0, 0.36, C.legs); shape(0.34, 0.5, C.skin); shape(0.48, 1, C.top);
  out.push(line([neck[0], neck[1] + 4], [neck[0], neck[1] - 6], 9, C.skin));
  // head: bun on top, hair framing
  out.push(`<circle cx="${f(headC[0])}" cy="${f(headC[1] - 15)}" r="7" fill="${C.hair}"/>`);
  out.push(`<circle cx="${f(headC[0])}" cy="${f(headC[1])}" r="13" fill="${C.skin}"/>`);
  out.push(`<path d="M${f(headC[0] - 13.5)},${f(headC[1] + 2)} A13.5 13.5 0 0 1 ${f(headC[0] + 13.5)},${f(headC[1] + 2)} Q${f(headC[0] + 4)},${f(headC[1] - 9)} ${f(headC[0] - 13.5)},${f(headC[1] + 2)} Z" fill="${C.hair}"/>`);
  const drawArm = (s, arm) => {
    out.push(line(s, arm.mid, 12, C.skin));
    out.push(line(arm.mid, arm.end, 10, C.skin));
    out.push(`<circle cx="${f(arm.end[0])}" cy="${f(arm.end[1])}" r="6" fill="${C.skin}"/>`);
  };
  // sleeves/shoulder caps
  drawArm(shL, armL); drawArm(shR, armR);
  out.push(`<circle cx="${f(shL[0])}" cy="${f(shL[1])}" r="7" fill="${C.top}"/><circle cx="${f(shR[0])}" cy="${f(shR[1])}" r="7" fill="${C.top}"/>`);
  if (p.propsFront) out.push(p.propsFront({ hip, neck, shL, shR, armL, armR, legL, legR, headC }));
  return out.join('');
}

// ── props ────────────────────────────────────────────
const dumbbell = (c, a = 0) => {
  const d = dir(a), n = [-d[1], d[0]];
  const e1 = [c[0] + n[0] * 10, c[1] + n[1] * 10], e2 = [c[0] - n[0] * 10, c[1] - n[1] * 10];
  return line(e1, e2, 4, C.metal) + line(add(e1, a + 90, 0), add(e1, a + 90, 5), 10, C.metal) + line(e2, add(e2, a - 90, 5), 10, C.metal);
};
const kettlebell = (c) => `<circle cx="${f(c[0])}" cy="${f(c[1] + 10)}" r="11" fill="${C.metal}"/><path d="M${f(c[0] - 7)},${f(c[1] + 2)} Q${f(c[0])},${f(c[1] - 10)} ${f(c[0] + 7)},${f(c[1] + 2)}" stroke="${C.metal}" stroke-width="4" fill="none"/>`;
const mat = (x1, x2) => `<rect x="${x1}" y="${GROUND + 2}" width="${x2 - x1}" height="7" rx="3.5" fill="${C.mat}"/>`;
const floorLine = `<rect x="-400" y="${GROUND + 9}" width="1200" height="3" fill="#DADDD6"/>`;
const arrowArc = (cx, cy, r, a0, a1) => {
  const p0 = add([cx, cy], a0, r), p1 = add([cx, cy], a1, r);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0, sweep = a1 > a0 ? 1 : 0;
  const tip = add(p1, a1 + (sweep ? 90 : -90), 0);
  const h1 = add(tip, a1 + (sweep ? 90 : -90) + 150, 7), h2 = add(tip, a1 + (sweep ? 90 : -90) - 150, 7);
  return `<path d="M${pt(p0)} A${r} ${r} 0 ${large} ${sweep} ${pt(p1)}" stroke="${C.arrow}" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="1 6"/>` +
    `<path d="M${pt(h1)} L${pt(tip)} L${pt(h2)}" stroke="${C.arrow}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
};
const arrow = (a, b) => {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
  return `<path d="M${pt(a)} L${pt(b)}" stroke="${C.arrow}" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 6"/>` +
    `<path d="M${pt(add(b, ang + 150, 8))} L${pt(b)} L${pt(add(b, ang - 150, 8))}" stroke="${C.arrow}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
};
const bench = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="10" rx="5" fill="${C.pad}"/><rect x="${x + 10}" y="${y + 10}" width="6" height="${GROUND - y - 4}" fill="${C.metalLight}"/><rect x="${x + w - 16}" y="${y + 10}" width="6" height="${GROUND - y - 4}" fill="${C.metalLight}"/>`;

// ── poses ────────────────────────────────────────────
const STAND = { hip: [200, 152], torso: -90, legN: [90, 90], legF: [92, 88] };

const P = {
  'standing-leg-circle-1': { scene: (b) => `<rect x="258" y="80" width="7" height="172" rx="3.5" fill="${C.metalLight}"/>` + b + arrowArc(222, 222, 34, -10, 80),
    fig: { ...STAND, legN: [55, 75], legF: [90, 90], armN: [20, -10], armF: [15, -5] } },
  'standing-leg-circle-2': { scene: (b) => `<rect x="258" y="80" width="7" height="172" rx="3.5" fill="${C.metalLight}"/>` + b + arrowArc(190, 222, 34, 100, 190),
    fig: { ...STAND, legN: [125, 115], legF: [90, 90], armN: [20, -10], armF: [15, -5] } },

  'arm-circles-1': { scene: (b) => b + arrowArc(108, 168, 16, 0, 300) + arrowArc(292, 168, 16, 180, 480),
    fig: { view: 'front', hip: [200, 152], torso: -90, armL: [180, 180], armR: [0, 0], legL: [95, 90], legR: [85, 90] } },
  'arm-circles-2': { scene: (b) => b + arrowArc(108, 150, 16, 0, 300) + arrowArc(292, 150, 16, 180, 480),
    fig: { view: 'front', hip: [200, 152], torso: -90, armL: [195, 195], armR: [-15, -15], legL: [95, 90], legR: [85, 90] } },

  'leg-raises-1': { scene: (b) => mat(70, 330) + b,
    fig: { hip: [215, 236], torso: 180, legN: [-4, 0], legF: [-2, 0], armN: [0, 0], armF: [2, 0] } },
  'leg-raises-2': { scene: (b) => mat(70, 330) + b + arrow([300, 220], [262, 150]),
    fig: { hip: [215, 236], torso: 180, legN: [-85, -88], legF: [-83, -86], armN: [0, 0], armF: [2, 0] } },

  'plank-1': { scene: (b) => mat(70, 330) + b,
    fig: { hip: [185, 214], torso: -8, legN: [160, 160], legF: [161, 161], armN: [90, 0], armF: [88, 0] } },
  'plank-2': { scene: (b) => mat(70, 330) + b + arrowArc(185, 214, 30, 60, 120),
    fig: { hip: [185, 220], torso: -12, legN: [163, 163], legF: [158, 158], armN: [90, 0], armF: [88, 0] } },

  'goblet-squat-1': { fig: { ...STAND, armN: [100, -60], armF: [98, -62], propsFront: ({ armN }) => kettlebell([armN.end[0] + 4, armN.end[1] - 2]) } },
  'goblet-squat-2': { scene: (b) => b + arrow([140, 120], [140, 175]),
    fig: { hip: [176, 197], torso: -68, legN: [8, 99], legF: [10, 97], armN: [95, -40], armF: [93, -42], propsFront: ({ armN }) => kettlebell([armN.end[0] + 4, armN.end[1] - 2]) } },

  'russian-twist-1': { scene: (b) => mat(70, 330) + b,
    fig: { hip: [190, 236], torso: -118, legN: [-28, 58], legF: [-30, 56], armN: [5, -5], armF: [3, -3], propsFront: ({ armN }) => dumbbell(armN.end, 0) } },
  'russian-twist-2': { scene: (b) => mat(70, 330) + b + arrowArc(190, 175, 40, -40, 40),
    fig: { hip: [190, 236], torso: -118, legN: [-28, 58], legF: [-30, 56], armN: [45, 80, 1, 0.75], armF: [43, 78, 1, 0.75], propsFront: ({ armN }) => dumbbell(armN.end, 0) } },

  'db-tricep-extension-1': { fig: { ...STAND, armN: [-97, -92], armF: [-95, -90], propsFront: ({ armN }) => dumbbell(armN.end, 0) } },
  'db-tricep-extension-2': { scene: (b) => b + arrowArc(196, 60, 26, -80, -190),
    fig: { ...STAND, armN: [-105, 125], armF: [-103, 123], props: ({ armN }) => dumbbell(armN.end, 0) } },

  'db-shoulder-press-1': { scene: (b) => bench(150, 190, 100) + b,
    fig: { view: 'front', hip: [200, 186], torso: -90, armL: [180, -90], armR: [0, -90], legL: [100, 90, 0.35], legR: [80, 90, 0.35],
      propsFront: ({ armL, armR }) => dumbbell(armL.end, 90) + dumbbell(armR.end, 90) } },
  'db-shoulder-press-2': { scene: (b) => bench(150, 190, 100) + b + arrow([200, 40], [200, 14]),
    fig: { view: 'front', hip: [200, 186], torso: -90, armL: [-125, -100], armR: [-55, -80], legL: [100, 90, 0.35], legR: [80, 90, 0.35],
      propsFront: ({ armL, armR }) => dumbbell(armL.end, 90) + dumbbell(armR.end, 90) } },

  'lat-pulldown-1': { scene: (b) => latMachine(38) + bench(160, 190, 80) + b,
    fig: { view: 'front', hip: [200, 186], torso: -90, armL: [-125, -110], armR: [-55, -70], legL: [100, 90, 0.35], legR: [80, 90, 0.35],
      propsFront: () => latBar(38) } },
  'lat-pulldown-2': { scene: (b) => latMachine(98) + bench(160, 190, 80) + b + arrow([320, 50], [320, 95]),
    fig: { view: 'front', hip: [200, 186], torso: -90, armL: [150, -95], armR: [30, -85], legL: [100, 90, 0.35], legR: [80, 90, 0.35],
      propsFront: () => latBar(98) } },

  'abductor-machine-1': { scene: (b) => `<rect x="150" y="186" width="100" height="12" rx="6" fill="${C.pad}"/><rect x="194" y="198" width="12" height="54" fill="${C.metalLight}"/>` + b,
    fig: { view: 'front', hip: [200, 184], torso: -90, armL: [100, 80], armR: [80, 100], legL: [95, 90, 0.35], legR: [85, 90, 0.35],
      propsFront: ({ legL, legR }) => abPad(legL.mid, -1) + abPad(legR.mid, 1) } },
  'abductor-machine-2': { scene: (b) => `<rect x="150" y="186" width="100" height="12" rx="6" fill="${C.pad}"/><rect x="194" y="198" width="12" height="54" fill="${C.metalLight}"/>` + b + arrow([150, 150], [118, 150]) + arrow([250, 150], [282, 150]),
    fig: { view: 'front', hip: [200, 184], torso: -90, armL: [100, 80], armR: [80, 100], legL: [150, 95, 0.55], legR: [30, 85, 0.55],
      propsFront: ({ legL, legR }) => abPad(legL.mid, -1) + abPad(legR.mid, 1) } },

  'hip-rotation-1': { scene: (b) => mat(70, 330) + b,
    fig: { hip: [200, 240], torso: -88, legN: [0, 90, 1, 0.25], legF: [180, 90, 0.85, 0.25], armN: [112, 102], armF: [118, 104] } },
  'hip-rotation-2': { scene: (b) => mat(70, 330) + b + arrowArc(200, 180, 46, -100, -60),
    fig: { hip: [200, 240], torso: -52, legN: [0, 90, 1, 0.25], legF: [180, 90, 0.85, 0.25], armN: [45, 40], armF: [50, 42] } },

  // cool-down
  'cooldown-1': { scene: (b) => mat(70, 330) + b,
    fig: { hip: [196, 196], torso: -88, legN: [0, 90], legF: [120, 180], footF: 180, armN: [75, 0], armF: [78, 5] } },
  'cooldown-2': { fig: { view: 'front', hip: [200, 152], torso: -90, armR: [172, 180], armL: [120, -30], legL: [95, 90], legR: [85, 90] } },
  'cooldown-3': { fig: { view: 'front', hip: [200, 152], torso: -90, armL: [-100, -95], armR: [-80, -85], legL: [95, 90], legR: [85, 90] } },
  'cooldown-4': { scene: (b) => mat(60, 340) + b,
    fig: { hip: [180, 238], torso: -50, legN: [180, 180], legF: [181, 181], footN: 180, footF: 180, armN: [92, 90, 0.8, 0.8], armF: [90, 88, 0.8, 0.8] } },
  'cooldown-5': { scene: (b) => mat(60, 340) + b,
    fig: { hip: [180, 142], torso: 48, legN: [108, 108], legF: [106, 106], footN: 20, footF: 20, armN: [48, 48], armF: [46, 46] } },
  'cooldown-6': { scene: (b) => mat(70, 330) + b,
    fig: { hip: [200, 152], torso: 68, legN: [90, 90], legF: [92, 88], armN: [95, 95, 0.75, 0.75], armF: [93, 93, 0.75, 0.75] } },
  'cooldown-7': { scene: (b) => mat(70, 330) + b,
    fig: { hip: [160, 198], torso: -20, legN: [90, 180], legF: [92, 180], footN: 180, footF: 180, armN: [90, 90], armF: [92, 90], headTilt: 4 } },
  'cooldown-8': { scene: (b) => mat(60, 340) + b,
    fig: { hip: [180, 236], torso: -8, legN: [185, 185], legF: [184, 184], footN: 180, footF: 180, armN: [-12, -12], armF: [-10, -10] } },
  'cooldown-9': { scene: (b) => mat(60, 340) + b,
    fig: { hip: [150, 228], torso: 6, legN: [20, 180], legF: [21, 180], footN: 180, footF: 180, armN: [14, 10], armF: [12, 9] } },
  'cooldown-10': { scene: (b) => mat(70, 330) + b,
    fig: { hip: [160, 238], torso: -22, legN: [0, 0], legF: [1, 1], footN: -80, footF: -80, armN: [5, 8], armF: [6, 8] } },
  'cooldown-11': { scene: (b) => mat(70, 330) + b,
    fig: { hip: [225, 236], torso: 180, legN: [-118, -5], legF: [-120, -8], armN: [-55, -5], armF: [-50, 0] } },
};

function latMachine(barY) {
  return `<rect x="80" y="10" width="8" height="242" fill="${C.metalLight}"/><rect x="312" y="10" width="8" height="242" fill="${C.metalLight}"/>` +
    `<rect x="80" y="8" width="240" height="8" rx="4" fill="${C.metalLight}"/>` + line([200, 16], [200, barY], 2, C.metal);
}
function latBar(y) { return `<rect x="110" y="${y - 3}" width="180" height="7" rx="3.5" fill="${C.metal}"/>`; }
function abPad(knee, side) { return `<rect x="${f(knee[0] + side * 9 - 4)}" y="${f(knee[1] - 12)}" width="8" height="24" rx="4" fill="${C.pad}"/>`; }

fs.mkdirSync(OUT, { recursive: true });
for (const [name, def] of Object.entries(P)) {
  const body = figure(def.fig);
  const scene = def.scene ? def.scene(body) : body;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" width="800" height="560">` +
    `<rect x="-400" y="-400" width="1200" height="1200" fill="${C.bg}"/>${floorLine}<g id="content">${scene}</g></svg>\n`;
  fs.writeFileSync(path.join(OUT, name + '.svg'), svg);
}
console.log(Object.keys(P).length, 'drawn');
