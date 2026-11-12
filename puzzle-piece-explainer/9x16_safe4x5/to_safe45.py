"""Keep a 1080x1920 Motion film at 9:16, but fit all text and graphics inside the
centred 4:5 area (1080x1350, rows 285-1635), so a 4:5 feed crop loses only background.

Design rows TOP..TOP+1760 of the original are scaled by 1080/1408 into the safe area.
Backgrounds, overlays and full-bleed photos are extended to fill the whole 9:16 frame.
usage: to_safe45.py in.html out.html [top]
"""
import sys

src, dst = sys.argv[1], sys.argv[2]
TOP = int(sys.argv[3]) if len(sys.argv) > 3 else 105
K = 1080 / 1408                       # content scale
SW, SH = 1408, 1920 / K               # stage in design px (fills 1080x1920 after scaling)
OX = (SW - 1080) / 2                  # 164
OY = (SH - 1760) / 2 - TOP            # where 9:16 row 0 lands on the stage

s = open(src).read()
css = f"""
<style id="safe45">
#main {{ inset: auto !important; left: 0 !important; top: 0 !important; width: {SW}px !important; height: {SH:.2f}px !important;
  transform: scale({K:.6f}); transform-origin: 0 0; }}
</style>
"""
assert '</head>' in s
s = s.replace('</head>', css + '</head>', 1)

js = r"""
<script id="safe45js">
(() => {
  const SW = %f, SH = %f, OX = %f, OY = %f;
  const px = v => parseFloat(v) || 0;
  const box = el => { const c = getComputedStyle(el); return { c, l: px(c.left), t: px(c.top), w: px(c.width), h: px(c.height) }; };
  const near = (a, b) => Math.abs(a - b) <= 2;
  // el is positioned in 9:16 coords; (ox, oy) = where 9:16 (0,0) sits in its parent; the stage spans parent coords (-ox,-oy)..(SW-ox, SH-oy)
  const adapt = (el, ox, oy, isSection) => {
    const b = box(el);
    if (b.c.position !== 'absolute') return;
    const covers = b.l <= 0 && b.t <= 0 && b.l + b.w >= 1078 && b.t + b.h >= 1918;
    const strip = near(b.l, 0) && near(b.w, 1080);
    if (covers) {
      el.style.inset = 'auto'; el.style.left = (-ox + (isSection ? ox : 0)) + 'px'; el.style.top = (-oy + (isSection ? oy : 0)) + 'px';
      el.style.width = SW + 'px'; el.style.height = SH + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto';
      if (el.tagName === 'IMG') el.style.objectFit = 'cover';
      for (const k of el.children) { const kb = box(k); if (kb.c.position === 'absolute' && kb.c.left !== 'auto') { k.style.left = (kb.l + ox) + 'px'; k.style.top = (kb.t + oy) + 'px'; } }
      return;
    }
    if (strip) {
      const up = b.t <= 2, down = b.t + b.h >= 1915;
      const newTop = up ? -oy : b.t, newBot = down ? SH - oy : b.t + b.h;
      const dy = b.t - newTop;
      el.style.left = (-ox + (isSection ? ox : 0)) + 'px'; el.style.width = SW + 'px';
      el.style.top = (newTop + (isSection ? oy : 0)) + 'px'; el.style.height = (newBot - newTop) + 'px';
      for (const k of el.children) { const kb = box(k);
        if (kb.c.position !== 'absolute' || kb.c.left === 'auto') continue;
        const spansV = kb.t <= 2 && kb.t + kb.h >= b.h - 30;
        if (k.tagName === 'IMG' && (near(kb.w, 1080) || spansV)) {
          k.style.left = (near(kb.w, 1080) ? 0 : kb.l + ox) + 'px'; if (near(kb.w, 1080)) k.style.width = SW + 'px';
          if (spansV) { k.style.top = '0px'; k.style.height = (newBot - newTop) + 'px'; } else k.style.top = (kb.t + dy) + 'px';
          k.style.objectFit = 'cover';
        } else { k.style.left = (kb.l + ox) + 'px'; k.style.top = (kb.t + dy) + 'px'; }
      }
      return;
    }
    if (isSection) { el.style.marginLeft = ox + 'px'; el.style.marginTop = oy + 'px'; }
  };
  for (const sc of document.querySelectorAll('#main > .sc, #main > section')) {
    for (const el of [...sc.children]) {
      const b = box(el);
      if (el.classList.contains('pat')) { el.style.inset = '-60px'; continue; }
      if (b.c.position !== 'absolute') continue;
      const full = near(b.l, 0) && near(b.t, 0) && near(b.w, 1080) && near(b.h, 1920);
      if (el.classList.contains('cam') || (full && el.children.length > 0)) {
        el.style.inset = 'auto'; el.style.left = OX + 'px'; el.style.top = OY + 'px';
        el.style.width = '1080px'; el.style.height = '1920px';
        for (const d of [...el.children]) adapt(d, OX, OY, false);
      } else if (full) { el.style.inset = '0'; el.style.width = 'auto'; el.style.height = 'auto'; }
      else adapt(el, OX, OY, true);
    }
  }
})();
</script>
""" % (SW, SH, OX, OY)
anchor = '<script src="./runtime/vendor/gsap.min.js"></script>'
assert anchor in s
s = s.replace(anchor, js + anchor, 1)
open(dst, 'w').write(s)
print('ok', dst, 'OY', round(OY, 1))
