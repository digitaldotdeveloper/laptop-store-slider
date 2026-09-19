# Where does the keycap plate sit inside the deck plate? Both were framed the same way by the
# model, so compare their bounding boxes in source pixels and print the CSS rect for index.html.
import sys, numpy as np
from PIL import Image
from scipy import ndimage

def bbox(path, keys=False):
    im = np.asarray(Image.open(path).convert('RGB')).astype(int)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    mag = (np.minimum(r, b) - g > 22) & (r > 60) & (b > 60) if keys else ((r - g > 90) & (b - g > 90))
    fg = ndimage.binary_opening(~mag, iterations=2)
    lab, k = ndimage.label(fg)
    a = ndimage.sum(fg, lab, range(1, k + 1))
    thr = fg.size * 4e-4 if keys else a.max() * .02
    fg = np.isin(lab, [i + 1 for i, v in enumerate(a) if v > thr])
    ys, xs = np.where(fg)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1, im.shape[1], im.shape[0]

for m in sys.argv[1:]:
    dx0, dy0, dx1, dy1, dw, dh = bbox(f'../_src/{m}-deck.png')
    kx0, ky0, kx1, ky1, kw, kh = bbox(f'../_src/{m}-keys.png', keys=True)
    sx, sy = dw / kw, dh / kh                       # in case the two renders differ in size
    kx0, kx1, ky0, ky1 = kx0 * sx, kx1 * sx, ky0 * sy, ky1 * sy
    W, H = dx1 - dx0, dy1 - dy0
    print(f"{m}: kb:[{(kx0-dx0)/W*100:.1f},{(dx1-kx1)/W*100:.1f},{(ky0-dy0)/H*100:.1f},{(ky1-ky0)/H*100:.1f}]")
