#!/usr/bin/env python3
import math, os, struct, zlib

SIZE = 512
SS = 3
W = SIZE * SS

def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))

def blend(dst, src, alpha):
    a = max(0.0, min(1.0, alpha))
    return tuple(int(round(dst[i] * (1 - a) + src[i] * a)) for i in range(3))

def rounded_rect(x, y, cx, cy, w, h, r):
    dx = abs(x - cx) - (w / 2 - r)
    dy = abs(y - cy) - (h / 2 - r)
    if dx <= 0 and dy <= 0:
        return True
    dx = max(dx, 0.0)
    dy = max(dy, 0.0)
    return dx * dx + dy * dy <= r * r

def hex_points(cx, cy, r):
    return [(cx + r * math.cos(math.radians(60 * i - 30)),
             cy + r * math.sin(math.radians(60 * i - 30))) for i in range(6)]

def point_in_poly(x, y, pts):
    inside = False
    j = len(pts) - 1
    for i in range(len(pts)):
        xi, yi = pts[i]; xj, yj = pts[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi):
            inside = not inside
        j = i
    return inside

def dist_to_seg(px, py, ax, ay, bx, by):
    vx, vy = bx - ax, by - ay
    wx, wy = px - ax, py - ay
    c1 = vx * wx + vy * wy
    c2 = vx * vx + vy * vy
    t = 0.0 if c2 == 0 else max(0.0, min(1.0, c1 / c2))
    dx, dy = px - (ax + t * vx), py - (ay + t * vy)
    return math.hypot(dx, dy)

def dist_to_poly_stroke(x, y, pts):
    return min(dist_to_seg(x, y, pts[i][0], pts[i][1], pts[(i + 1) % len(pts)][0], pts[(i + 1) % len(pts)][1]) for i in range(len(pts)))

def make(size):
    img = bytearray()
    center = size / 2
    for py in range(size):
        img.append(0)
        for px in range(size):
            x, y = px + 0.5, py + 0.5
            u, v = x / size, y / size
            # transparent outside rounded square
            if not rounded_rect(x, y, center, center, size * 0.94, size * 0.94, size * 0.24):
                img.extend((0, 0, 0, 0)); continue
            # base gradient
            base_top = (16, 26, 46)
            base_bottom = (5, 9, 17)
            col = lerp(base_top, base_bottom, v)
            # subtle diagonal glow gold top-left, teal bottom-right
            g1 = max(0.0, 1.0 - math.hypot(u - 0.18, v - 0.12) / 0.72)
            g2 = max(0.0, 1.0 - math.hypot(u - 0.86, v - 0.9) / 0.7)
            col = blend(col, (194, 160, 92), 0.16 * g1 * g1)
            col = blend(col, (31, 185, 155), 0.12 * g2 * g2)
            # vignette
            d = math.hypot(u - 0.5, v - 0.5)
            col = blend(col, (0, 0, 0), max(0.0, (d - 0.38)) * 0.9)
            # hexagon crest
            outer = hex_points(center, center, size * 0.31)
            inner = hex_points(center, center, size * 0.245)
            stroke = size * 0.016
            if point_in_poly(x, y, outer) and not point_in_poly(x, y, inner):
                t = (v - 0.2) / 0.6
                gold = lerp((242, 222, 168), (157, 125, 64), max(0.0, min(1.0, t)))
                edge = dist_to_poly_stroke(x, y, inner)
                glow = max(0.0, 1.0 - abs(dist_to_poly_stroke(x, y, outer) - stroke) / (size * 0.05))
                col = blend(gold, (255, 245, 214), 0.18 * glow)
            # inner hex fill
            if point_in_poly(x, y, inner):
                col = blend(col, (10, 17, 32), 0.82)
                # crossed swords: two diagonal blades
                for sign in (-1, 1):
                    # blade polygon around diagonal
                    ang = math.radians(45 * sign)
                    dx, dy = math.cos(ang), math.sin(ang)
                    nx, ny = -dy, dx
                    half_w = size * 0.028
                    tip = size * 0.155
                    tail = size * 0.10
                    p1 = (center + dx * tip, center + dy * tip)
                    p2 = (center - dx * tail, center - dy * tail)
                    blade = [
                        (p1[0], p1[1]),
                        (p2[0] + nx * half_w, p2[1] + ny * half_w),
                        (p2[0] - nx * half_w, p2[1] - ny * half_w),
                    ]
                    if point_in_poly(x, y, blade):
                        t = (x - p2[0]) / ((p1[0] - p2[0]) or 1e-9)
                        gold = lerp((212, 184, 122), (246, 232, 195), max(0.0, min(1.0, t)))
                        col = gold
                    # crossguard
                    gx, gy = p2
                    guard = [
                        (gx + nx * size * 0.075, gy + ny * size * 0.075),
                        (gx + dx * size * 0.025 + nx * size * 0.075, gy + dy * size * 0.025 + ny * size * 0.075),
                        (gx + dx * size * 0.025 - nx * size * 0.075, gy + dy * size * 0.025 - ny * size * 0.075),
                        (gx - nx * size * 0.075, gy - ny * size * 0.075),
                    ]
                    if point_in_poly(x, y, guard):
                        col = (194, 160, 92)
            # teal gem at top right of hex
            gx, gy = center + size * 0.255, center - size * 0.255
            gd = math.hypot(x - gx, y - gy)
            if gd < size * 0.038:
                col = lerp((127, 240, 218), (31, 185, 155), gd / (size * 0.038))
                if gd > size * 0.031:
                    col = (8, 13, 24)
            # outer border
            if not rounded_rect(x, y, center, center, size * 0.94 - size * 0.014, size * 0.94 - size * 0.014, size * 0.235):
                col = blend(col, (212, 184, 122), 0.55)
            img.extend((col[0], col[1], col[2], 255))
    return bytes(img)

def downsample(raw, src, dst):
    factor = src // dst
    out = bytearray()
    for y in range(dst):
        out.append(0)
        for x in range(dst):
            r = g = b = a = 0
            for sy in range(factor):
                row = (y * factor + sy) * (src * 4 + 1)
                for sx in range(factor):
                    i = row + 1 + (x * factor + sx) * 4
                    r += raw[i]; g += raw[i+1]; b += raw[i+2]; a += raw[i+3]
            n = factor * factor
            out.extend((r // n, g // n, b // n, a // n))
    return bytes(out)

def png(width, height, raw):
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw, 9))
            + chunk(b'IEND', b''))

def ico(png_data, size):
    header = struct.pack('<HHH', 0, 1, 1)
    entry = struct.pack('<BBBBHHII', size if size < 256 else 0, size if size < 256 else 0, 0, 0, 1, 32, len(png_data), 22)
    return header + entry + png_data

raw = make(W)
p512 = png(SIZE, SIZE, downsample(raw, W, SIZE))
p256 = png(256, 256, downsample(raw, W, 256))
here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(here, 'build', 'icon.png'), 'wb') as f:
    f.write(p512)
with open(os.path.join(here, 'build', 'icon.ico'), 'wb') as f:
    f.write(ico(p256, 256))
print('icon.png', len(p512), 'icon.ico', len(p256) + 22)
