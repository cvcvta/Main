# Contact sheet of stills: python3 sheet.py <glob> <out.png> [cols]
import sys, glob
from PIL import Image, ImageDraw, ImageFont
files = sorted(glob.glob(sys.argv[1]))
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3
ims = [Image.open(f).convert('RGB') for f in files]
w, h = ims[0].size
tw = 640; th = int(h * tw / w)
rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cols * tw, rows * th), (30, 30, 30))
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
for i, (f, im) in enumerate(zip(files, ims)):
    im = im.resize((tw, th), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    lab = f.split('/')[-1].replace('.png', '')
    d.rectangle([0, 0, len(lab) * 9 + 8, 20], fill=(0, 0, 0))
    d.text((4, 2), lab, fill=(255, 230, 0), font=font)
    S.paste(im, ((i % cols) * tw, (i // cols) * th))
S.save(sys.argv[2])
print(len(ims), 'frames ->', sys.argv[2])
