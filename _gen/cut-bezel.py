# Two-key cut: green is the world outside the lid, magenta is the hole where the screen goes.
# Prints the hole rect as a percentage of the trimmed frame so index.html can sit .scr inside it.
#   py cut-bezel.py nightforge aero studio ledger
import sys, json, numpy as np
from PIL import Image
from scipy import ndimage
from cutout_util import save

meta = json.load(open('layers.json'))
for model in sys.argv[1:]:
    im = np.asarray(Image.open(f'../_src/{model}-bezel.png').convert('RGB')).astype(int)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    green = (g - np.maximum(r, b) > 45)
    mag   = (np.minimum(r, b) - g > 45)
    solid = ~(green | mag)
    solid = ndimage.binary_opening(solid, iterations=2)
    lab, k = ndimage.label(solid)
    a = ndimage.sum(solid, lab, range(1, k + 1))
    solid = lab == (np.argmax(a) + 1)                      # the frame, minus any speckle
    ys, xs = np.where(solid)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1

    hole = ndimage.binary_opening(mag, iterations=3)       # the screen opening
    lab, k = ndimage.label(hole)
    a = ndimage.sum(hole, lab, range(1, k + 1))
    hole = lab == (np.argmax(a) + 1)
    hy, hx = np.where(hole)
    W, H = x1 - x0, y1 - y0
    rect = [round((hx.min() - x0) / W * 100, 2), round((x1 - hx.max()) / W * 100, 2),
            round((hy.min() - y0) / H * 100, 2), round((y1 - hy.max()) / H * 100, 2)]

    alpha = np.clip((ndimage.gaussian_filter(solid.astype(float), .8) - .2) / .6, 0, 1)
    spill = np.clip(g - np.maximum(r, b), 0, None)         # green rims off the outer edge
    rgb = im.copy(); rgb[..., 1] -= spill
    out = np.dstack([rgb, alpha * 255])[y0:y1, x0:x1].clip(0, 255).astype('uint8')
    img = save(Image.fromarray(out, 'RGBA'), f'../img/{model}-bezel.webp', 1000, 84)
    meta[f'{model}-bezel'] = {'w': img.width, 'h': img.height, 'hole': rect}
    print(f"{model}: {img.size}  hole L,R,T,B % = {rect}")
json.dump(meta, open('layers.json', 'w'), indent=1)
