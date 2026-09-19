# Key the magenta out of each layer, trim to the object, save WebP with alpha into ../img/.
#   py cutout.py nightforge [aero ...]
import sys, json, numpy as np
from PIL import Image
from scipy import ndimage
PARTS = ['lid', 'deck', 'board', 'battery', 'bottom', 'keys']

MAXW, Q, AQ = 900, 82, 88            # the largest a layer is ever drawn is ~870 device px on a phone

def save(img, dst, maxw=MAXW, q=Q):
    if img.width > maxw:
        img = img.resize((maxw, round(img.height * maxw / img.width)), Image.LANCZOS)
    kw = dict(quality=q, method=6)
    if img.mode == 'RGBA': kw['alpha_quality'] = AQ
    img.save(dst, 'WEBP', **kw)
    return img

meta = {}
try: meta = json.load(open('layers.json'))
except FileNotFoundError: pass
for model in sys.argv[1:]:
    scr = Image.open(f'../_src/{model}-screen.png').convert('RGB')
    save(scr, f'../img/{model}-screen.webp', 1100, 80)
    for part in PARTS:
        im = np.asarray(Image.open(f'../_src/{model}-{part}.png').convert('RGB')).astype(int)
        r, g, b = im[..., 0], im[..., 1], im[..., 2]
        mag = (r - g > 90) & (b - g > 90)
        fg = ndimage.binary_opening(~mag, iterations=2)
        lab, k = ndimage.label(fg)
        areas = ndimage.sum(fg, lab, range(1, k + 1))
        keep = [i + 1 for i, a in enumerate(areas) if a > areas.max() * 0.02]   # drops the Gemini sparkle
        fg = np.isin(lab, keep)
        fg = ndimage.binary_erosion(fg, iterations=1)
        alpha = np.clip((ndimage.gaussian_filter(fg.astype(float), 0.9) - .15) / .7, 0, 1)
        spill = np.clip(np.minimum(r, b) - g, 0, None)              # pull the pink cast off edge pixels
        rgb = im.copy(); rgb[..., 0] -= spill // 2; rgb[..., 2] -= spill // 2
        ys, xs = np.where(alpha > .02)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        out = np.dstack([rgb, alpha * 255])[y0:y1, x0:x1].clip(0, 255).astype('uint8')
        img = save(Image.fromarray(out, 'RGBA'), f'../img/{model}-{part}.webp')
        meta[f'{model}-{part}'] = {'w': img.width, 'h': img.height, 'ratio': round(img.width / img.height, 3)}
        print(model, part, img.size, round(img.width / img.height, 2))
json.dump(meta, open('layers.json', 'w'), indent=1)
