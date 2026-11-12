"""Turn a 1080x1920 Motion film into a 1080x1350 (4:5) film.

The 9:16 layout is kept intact and placed on a wider 4:5 stage (1408x1760 design px,
scaled to 1080x1350): section backgrounds, overlays and full-bleed photos are extended
to the new width, and the camera layers are shifted so the 9:16 content sits centred,
showing design rows TOP..TOP+1760 of the original frame.
usage: to45.py in.html out.html [top]
"""
import sys

src, dst = sys.argv[1], sys.argv[2]
TOP = int(sys.argv[3]) if len(sys.argv) > 3 else 80
SW, SH = 1408, 1760          # stage in design px (4:5)
OX = (SW - 1080) // 2        # 164
K = 1080 / SW                # output scale

s = open(src).read()

def rep(a, b, count=1):
    global s
    assert a in s, a[:60]
    s = s.replace(a, b, count)

rep('<meta name="viewport" content="width=1080, height=1920">', '<meta name="viewport" content="width=1080, height=1350">')
rep('html, body { margin: 0; width: 1080px; height: 1920px;', 'html, body { margin: 0; width: 1080px; height: 1350px;')
s = s.replace('height: 1920, clock:', 'height: 1350, clock:')
assert 'height: 1350, clock:' in s

css = f"""
<style id="fit45">
#main {{ inset: auto !important; left: 0 !important; top: 0 !important; width: {SW}px !important; height: {SH}px !important;
  transform: scale({K:.6f}); transform-origin: 0 0; }}
</style>
"""
rep('</head>', css + '</head>')

js = r"""
<script id="fit45js">
(() => {
  const SW = %d, SH = %d, OX = %d, TOP = %d;
  const px = v => parseFloat(v) || 0;
  // a full-width (1080) strip inside the 9:16 frame: widen it to the 4:5 stage
  const widen = (el, base = -OX) => {
    const cs = getComputedStyle(el);
    if (cs.position !== 'absolute') return false;
    if (Math.abs(px(cs.width) - 1080) > 1 || Math.abs(px(cs.left)) > 1) return false;
    el.style.left = base + 'px'; el.style.width = SW + 'px'; if (base === 0) el.style.marginTop = (-TOP) + 'px';
    for (const k of el.children) {
      const kc = getComputedStyle(k);
      if (kc.position === 'absolute' && kc.left !== 'auto') {
        if (k.tagName === 'IMG' && Math.abs(px(kc.width) - 1080) <= 1) { k.style.width = SW + 'px'; k.style.objectFit = 'cover'; }
        else k.style.left = (px(kc.left) + OX) + 'px';
      }
    }
    return true;
  };
  const cover = el => { el.style.left = (-OX) + 'px'; el.style.right = (-OX) + 'px'; el.style.width = 'auto'; };
  for (const sc of document.querySelectorAll('#main > .sc, #main > section')) {
    for (const el of [...sc.children]) {
      const cs = getComputedStyle(el);
      if (el.classList.contains('pat')) { el.style.inset = '-60px'; continue; }
      if (cs.position !== 'absolute') continue;
      const full = px(cs.left) === 0 && px(cs.top) === 0 && Math.abs(px(cs.width) - 1080) <= 1 && Math.abs(px(cs.height) - 1920) <= 1;
      const isLayer = el.classList.contains('cam') || (full && el.children.length > 0);
      if (isLayer) {
        // a content layer: keep its 1080x1920 coordinate system, centred on the stage
        el.style.inset = 'auto'; el.style.left = OX + 'px'; el.style.top = (-TOP) + 'px';
        el.style.width = '1080px'; el.style.height = '1920px';
        el.querySelectorAll('*').forEach(d => { if (d.parentElement === el || d.parentElement?.parentElement === el) widen(d); });
        // inset:0 overlays directly inside the layer: let them cover the whole stage
        for (const d of el.children) { const dc = getComputedStyle(d);
          if (dc.position === 'absolute' && px(dc.left) === 0 && px(dc.top) === 0 && Math.abs(px(dc.width) - 1080) <= 1 && Math.abs(px(dc.height) - 1920) <= 1 && d.children.length === 0) cover(d); }
      } else if (full) {
        // a plain background overlay: fill the stage
        el.style.inset = '0'; el.style.width = 'auto'; el.style.height = 'auto';
      } else if (!widen(el, 0)) {
        // a positioned decoration outside the camera: shift it with the content
        el.style.marginLeft = OX + 'px'; el.style.marginTop = (-TOP) + 'px';
      }
    }
  }
})();
</script>
""" % (SW, SH, OX, TOP)
# run right after the markup, before the runtime and the film build
anchor = '<script src="./runtime/vendor/gsap.min.js"></script>'
rep(anchor, js + anchor)
open(dst, 'w').write(s)
print('ok', dst)
