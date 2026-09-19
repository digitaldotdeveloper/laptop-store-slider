from PIL import Image

MAXW, Q, AQ = 900, 82, 88            # the largest a layer is ever drawn is ~870 device px on a phone

def save(img, dst, maxw=MAXW, q=Q):
    if img.width > maxw:
        img = img.resize((maxw, round(img.height * maxw / img.width)), Image.LANCZOS)
    kw = dict(quality=q, method=6)
    if img.mode == 'RGBA': kw['alpha_quality'] = AQ
    img.save(dst, 'WEBP', **kw)
    return img
