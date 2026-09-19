# Keys need their own cut: the baked backlight bridges the caps into one blob and stains the
# magenta, so key on "magenta-ish" rather than "pure magenta", and keep every island that is
# bigger than a speck instead of every island close to the biggest one.
#   py cut-keys.py nightforge aero studio ledger
import sys, json, numpy as np
from PIL import Image
from scipy import ndimage
from cutout_util import save

meta = json.load(open('layers.json'))
for model in sys.argv[1:]:
    im = np.asarray(Image.open(f'../_src/{model}-keys.png').convert('RGB')).astype(int)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    mag = (np.minimum(r, b) - g > 22) & (r > 60) & (b > 60)      # magenta, plus anything it tinted
    fg = ndimage.binary_closing(~mag, np.ones((3, 3)), iterations=2)
    lab, k = ndimage.label(fg)
    areas = ndimage.sum(fg, lab, range(1, k + 1))
    keep = [i + 1 for i, a in enumerate(areas) if a > fg.size * 4e-4]   # ~a third of one keycap
    fg = np.isin(lab, keep)
    fg = ndimage.binary_erosion(fg, iterations=2)                 # eat the stained rim
    alpha = np.clip((ndimage.gaussian_filter(fg.astype(float), 1.0) - .2) / .6, 0, 1)
    spill = np.clip(np.minimum(r, b) - g, 0, None)                # neutralise what is left of the cast
    rgb = im.copy(); rgb[..., 0] -= spill; rgb[..., 2] -= spill
    ys, xs = np.where(alpha > .02)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    out = np.dstack([rgb, alpha * 255])[y0:y1, x0:x1].clip(0, 255).astype('uint8')
    img = save(Image.fromarray(out, 'RGBA'), f'../img/{model}-keys.webp')
    meta[f'{model}-keys'] = {'w': img.width, 'h': img.height, 'ratio': round(img.width / img.height, 3)}
    print(model, 'keys', img.size, len(keep), 'caps kept')
json.dump(meta, open('layers.json', 'w'), indent=1)
