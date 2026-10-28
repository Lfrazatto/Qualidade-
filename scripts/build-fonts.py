"""Gera subconjuntos WOFF (Latin + português) das fontes Inter / Inter Display (SIL OFL 1.1)
e DejaVu Sans Mono (licença Bitstream Vera/DejaVu) para hospedagem própria (CSP font-src 'self')."""
import sys
from fontTools import subset
from fontTools.ttLib import TTFont

SRC = '/usr/share/fonts/opentype/inter/'
OUT = 'public/assets/fonts/'
FONTS = {
    'inter-400': SRC + 'Inter-Regular.otf',
    'inter-500': SRC + 'Inter-Medium.otf',
    'inter-600': SRC + 'Inter-SemiBold.otf',
    'inter-display-700': SRC + 'InterDisplay-Bold.otf',
    'inter-display-800': SRC + 'InterDisplay-ExtraBold.otf',
    'mono-400': '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
}
UNICODES = list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + [
    0x131, 0x152, 0x153, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026,
    0x2190, 0x2191, 0x2192, 0x2193, 0x2197, 0x21BB, 0x221E, 0x00D7, 0x00F7, 0x2315, 0x2316, 0x2713]
for name, path in FONTS.items():
    opts = subset.Options()
    opts.flavor = 'woff'
    opts.layout_features = ['kern', 'liga', 'calt', 'tnum', 'case', 'ss01', 'cv11', 'locl', 'ccmp', 'mark', 'mkmk']
    opts.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    opts.notdef_outline = True
    opts.hinting = False
    font = TTFont(path)
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=UNICODES)
    sub.subset(font)
    font.flavor = 'woff'
    font.save(OUT + name + '.woff')
    print(name, round(len(open(OUT + name + '.woff', 'rb').read()) / 1024, 1), 'KB')
