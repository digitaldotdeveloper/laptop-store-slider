# Backgrounds → img/<model>-bg-{wide,tall}.webp (uses the Upscayl 4x version in _src/up when present)
import os
from PIL import Image
for m in ['nightforge', 'aero', 'studio', 'ledger']:
    for o, size, q in [('wide', (1600, 900), 76), ('tall', (1080, 1920), 78)]:
        src = f'../_src/up/{m}-bg-{o}.png'
        if not os.path.exists(src): src = f'../_src/{m}-bg-{o}.png'
        im = Image.open(src).convert('RGB')
        s = max(size[0] / im.width, size[1] / im.height)                      # cover-crop to exact frame
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        l, t = (im.width - size[0]) // 2, (im.height - size[1]) // 2
        im.crop((l, t, l + size[0], t + size[1])).save(f'../img/{m}-bg-{o}.webp', 'WEBP', quality=q, method=6)
        print(m, o, 'from', os.path.basename(os.path.dirname(src)))
