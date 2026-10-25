// Crops each SVG to its drawing (4:3 frame, floor kept in view).
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const dir = process.argv[2]; const b = await chromium.launch(); const p = await b.newPage();
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.svg'))) {
    const file = dir + '/' + f; let svg = fs.readFileSync(file, 'utf8');
    await p.setContent(svg);
    const bb = await p.evaluate(() => { const r = document.getElementById('content').getBBox(); return [r.x, r.y, r.width, r.height]; });
    let [x, y, w, h] = bb; const bottom = Math.max(y + h, 262); h = bottom - y;
    const pad = 22; x -= pad; y -= pad; w += pad * 2; h += pad * 1.4;
    if (w / h < 4 / 3) { const nw = h * 4 / 3; x -= (nw - w) / 2; w = nw; } else { const nh = w * 3 / 4; y -= nh - h; h = nh; }
    svg = svg.replace(/viewBox="[^"]*" width="\d+" height="\d+"/, `viewBox="${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" width="800" height="600"`);
    fs.writeFileSync(file, svg);
  }
  await b.close();
})();
