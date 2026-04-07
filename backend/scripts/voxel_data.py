"""
voxel_data.py — 箱庭オブジェクト ボクセルデータ定義

すべてのモデルは立方体ピクセル（ボクセル）の集まりとして定義。
1 ボクセル = Three.js上の 0.1 unit の立方体。

各関数は [{"x": int, "y": int, "z": int, "colorHex": str}, ...] を返す。

カテゴリ別最大ボクセル数:
  food      : 32×32×32
  plant     : 24×32×24
  person    : 24×40×24
  furniture : 32×32×32
  building  : 64×64×64
  field     : 64×8×64   (横広・低い)
  special   : 32×32×32
"""
import math


def _px(x: int, y: int, z: int, color: str) -> dict:
    return {"x": x, "y": y, "z": z, "colorHex": color}


# ─────────────────────────────────────────────
#  食べ物 (food)
# ─────────────────────────────────────────────

def make_carrot() -> list[dict]:
    """F001: にんじん — オレンジ色のボクセル円錐

    size: ~16×18×16
    """
    pixels = []
    ORANGE = "#FF7300"
    D_ORANGE = "#CC5500"
    GREEN = "#22C55E"
    D_GREEN = "#166534"

    # 本体（下が太く上が細い円錐形）
    for y in range(0, 14):
        r = max(1, 6 - y // 2)
        for x in range(-r, r + 1):
            for z in range(-r, r + 1):
                if x * x + z * z <= r * r * 1.3:
                    col = D_ORANGE if (x + z + y) % 2 == 0 else ORANGE
                    pixels.append(_px(8 + x, y, 8 + z, col))

    # 葉（上部の緑）
    for y in range(14, 18):
        spread = (y - 14) + 1
        for dx in range(-spread, spread + 1):
            for dz in range(-1, 2):
                if abs(dx) + abs(dz) <= spread:
                    col = D_GREEN if y == 17 else GREEN
                    pixels.append(_px(8 + dx, y, 8 + dz, col))

    return pixels


def make_tomato() -> list[dict]:
    """F002: トマト — 赤い球体ボクセル

    size: ~20×20×20
    """
    pixels = []
    RED = "#E32B1D"
    D_RED = "#B01E12"
    GREEN = "#22C55E"

    # 本体（球形）
    cx, cy, cz = 10, 9, 10
    for x in range(3, 18):
        for y in range(2, 17):
            for z in range(3, 18):
                dx, dy, dz = x - cx, y - cy, z - cz
                if dx * dx + dy * dy * 1.1 + dz * dz <= 42:
                    col = D_RED if (x + z) % 3 == 0 else RED
                    pixels.append(_px(x, y, z, col))

    # ヘタ（上部の緑）
    for dx in range(-2, 3):
        for dz in range(-2, 3):
            if abs(dx) + abs(dz) <= 2:
                pixels.append(_px(cx + dx, 17, cz + dz, GREEN))

    return pixels


def make_apple() -> list[dict]:
    """F003: りんご — 赤い球体、底部のくぼみあり

    size: ~18×20×18
    """
    pixels = []
    RED = "#CC2200"
    D_RED = "#991A00"
    GREEN = "#22C55E"
    BROWN = "#78350F"

    cx, cy, cz = 9, 9, 9
    for x in range(2, 17):
        for y in range(1, 18):
            for z in range(2, 17):
                dx, dy, dz = x - cx, y - cy, z - cz
                dist = dx * dx + dy * dy * 1.0 + dz * dz
                if dist <= 44 and dist > 0:
                    # 上下に少しくぼみ（りんごらしい形）
                    top_dent = (dx * dx + dz * dz) < 4 and dy > 5
                    bot_dent = (dx * dx + dz * dz) < 4 and dy < -5
                    if not top_dent and not bot_dent:
                        col = D_RED if (x + y + z) % 3 == 0 else RED
                        pixels.append(_px(x, y, z, col))

    # 枝（軸）
    pixels.append(_px(cx, 18, cz, BROWN))
    pixels.append(_px(cx, 19, cz, BROWN))
    # 葉
    pixels.append(_px(cx + 1, 19, cz, GREEN))
    pixels.append(_px(cx + 2, 19, cz, GREEN))

    return pixels


def make_chicken() -> list[dict]:
    """F004: 鶏肉 — きつね色の不規則ボクセル塊

    size: ~16×14×14
    """
    pixels = []
    GOLD = "#D4A574"
    BROWN = "#8B6347"
    D_BROWN = "#5C3D1E"
    WHITE = "#F5DEB3"

    # 本体
    cx, cy, cz = 8, 8, 7
    for x in range(2, 14):
        for y in range(3, 14):
            for z in range(2, 13):
                dx, dy, dz = x - cx, y - cy, z - cz
                # 楕円形（横広）
                if (dx * dx) / 25 + (dy * dy) / 18 + (dz * dz) / 22 <= 1.0:
                    pct = (dx * dx + dy * dy + dz * dz) / 30
                    if pct > 0.8:
                        col = D_BROWN
                    elif pct > 0.5:
                        col = BROWN
                    elif (x + z) % 3 == 0:
                        col = WHITE
                    else:
                        col = GOLD
                    pixels.append(_px(x, y, z, col))

    return pixels


def make_bento() -> list[dict]:
    """F005: お弁当 — 黒い箱に白・赤・緑のごはん

    size: ~20×10×16
    """
    pixels = []
    BLACK = "#1C1C1C"
    WHITE = "#F0EDE0"    # ご飯
    RED = "#CC3300"      # おかず
    GREEN = "#4CAF50"    # 野菜
    YELLOW = "#FFC107"   # たまご

    W, H, D = 20, 10, 16

    for x in range(0, W):
        for y in range(0, H):
            for z in range(0, D):
                is_wall = (x == 0 or x == W - 1 or y == 0 or y == H - 1 or z == 0 or z == D - 1)
                if is_wall:
                    pixels.append(_px(x, y, z, BLACK))
                elif y > 0:
                    # 中身（ご飯・おかず）
                    if x < W // 2:
                        col = WHITE if (x + z) % 3 != 0 else YELLOW
                    else:
                        if z < D // 2:
                            col = RED
                        else:
                            col = GREEN
                    pixels.append(_px(x, y, z, col))

    return pixels


# ─────────────────────────────────────────────
#  植物 (plant)
# ─────────────────────────────────────────────

def make_oak_large() -> list[dict]:
    """P001: 大きなオーク — 丸い葉×2段 + 幹のボクセル

    size: ~24×28×24
    """
    pixels = []
    DARK_BROWN = "#5C3D1E"
    BROWN = "#78350F"
    GREEN = "#22C55E"
    D_GREEN = "#166534"
    L_GREEN = "#4ADE80"

    cx, cz = 12, 12

    # 幹
    for y in range(0, 10):
        r = 2 if y < 6 else 1
        for dx in range(-r, r + 1):
            for dz in range(-r, r + 1):
                if dx * dx + dz * dz <= r * r * 1.5:
                    col = DARK_BROWN if (dx + dz) % 2 == 0 else BROWN
                    pixels.append(_px(cx + dx, y, cz + dz, col))

    # 下の葉群（大）
    for x in range(cx - 7, cx + 8):
        for y in range(9, 19):
            for z in range(cz - 7, cz + 8):
                dx, dy, dz = x - cx, y - 14, z - cz
                if dx * dx + dy * dy * 1.2 + dz * dz <= 38:
                    col = D_GREEN if (x + y + z) % 3 == 0 else GREEN
                    pixels.append(_px(x, y, z, col))

    # 上の葉群（小）
    for x in range(cx - 5, cx + 6):
        for y in range(17, 28):
            for z in range(cz - 5, cz + 6):
                dx, dy, dz = x - cx, y - 22, z - cz
                if dx * dx + dy * dy * 1.3 + dz * dz <= 24:
                    col = L_GREEN if (x + z) % 3 == 0 else GREEN
                    pixels.append(_px(x, y, z, col))

    return pixels


def make_rose_red() -> list[dict]:
    """P002: 赤いバラ — 花弁ボクセル + 茎 + 葉

    size: ~12×20×12
    """
    pixels = []
    RED = "#CC1A00"
    L_RED = "#FF3322"
    GREEN = "#22C55E"
    D_GREEN = "#166534"
    YELLOW = "#FBBF24"

    cx, cz = 6, 6

    # 茎
    for y in range(0, 12):
        col = D_GREEN if y % 3 == 0 else GREEN
        pixels.append(_px(cx, y, cz, col))
        if y % 4 == 2:
            pixels.append(_px(cx + 1, y, cz, D_GREEN))
            pixels.append(_px(cx, y, cz + 1, D_GREEN))

    # 葉（中段）
    for dx in range(-3, 4):
        pixels.append(_px(cx + dx, 7, cz + 1, GREEN if abs(dx) < 3 else D_GREEN))
        pixels.append(_px(cx + 1, 7, cz + dx, GREEN if abs(dx) < 3 else D_GREEN))

    # 花弁（上部）
    for x in range(cx - 3, cx + 4):
        for y in range(12, 20):
            for z in range(cz - 3, cz + 4):
                dx, dy, dz = x - cx, y - 15, z - cz
                r = dx * dx + dz * dz
                if r <= 10:
                    if dy == 0 and r <= 2:
                        pixels.append(_px(x, y, z, YELLOW))
                    elif r <= 8:
                        col = L_RED if (dx + dz + dy) % 2 == 0 else RED
                        pixels.append(_px(x, y, z, col))

    return pixels


def make_cactus() -> list[dict]:
    """P003: サボテン — 緑の塔 + 横の腕

    size: ~10×24×10
    """
    pixels = []
    GREEN = "#16A34A"
    L_GREEN = "#22C55E"
    D_GREEN = "#166534"

    cx, cz = 5, 5

    # 幹（縦）
    for y in range(0, 20):
        for dx in range(-2, 3):
            for dz in range(-2, 3):
                if dx * dx + dz * dz <= 6:
                    col = L_GREEN if (dx + dz + y) % 3 == 0 else GREEN
                    pixels.append(_px(cx + dx, y, cz + dz, col))

    # 左腕
    for x in range(cx - 6, cx - 1):
        for dx in range(-1, 2):
            for dz in range(-1, 2):
                pixels.append(_px(x + dx, 10, cz + dz, D_GREEN))
    for y in range(10, 16):
        for dx in range(-1, 2):
            for dz in range(-1, 2):
                pixels.append(_px(cx - 5 + dx, y, cz + dz, GREEN))

    # 右腕
    for x in range(cx + 2, cx + 7):
        for dx in range(-1, 2):
            for dz in range(-1, 2):
                pixels.append(_px(x + dx, 13, cz + dz, D_GREEN))
    for y in range(13, 18):
        for dx in range(-1, 2):
            for dz in range(-1, 2):
                pixels.append(_px(cx + 5 + dx, y, cz + dz, GREEN))

    # 花（頂上）
    pixels.append(_px(cx, 20, cz, "#FF69B4"))
    pixels.append(_px(cx - 1, 20, cz, "#FF69B4"))
    pixels.append(_px(cx + 1, 20, cz, "#FF69B4"))
    pixels.append(_px(cx, 20, cz - 1, "#FF69B4"))
    pixels.append(_px(cx, 20, cz + 1, "#FF69B4"))

    return pixels


# ─────────────────────────────────────────────
#  人 (person)
# ─────────────────────────────────────────────

def make_avatar_default() -> list[dict]:
    """C001: プレイヤー — シンプルなヒューマノイドボクセル

    size: ~10×24×6
    """
    pixels = []
    SKIN = "#FBBF24"
    D_SKIN = "#D97706"
    BLUE = "#3B82F6"
    D_BLUE = "#1D4ED8"
    BLACK = "#111827"
    WHITE = "#F9FAFB"
    GRAY = "#6B7280"

    # 頭
    for y in range(18, 24):
        for x in range(2, 8):
            for z in range(0, 5):
                col = D_SKIN if (x + z) % 3 == 0 else SKIN
                pixels.append(_px(x, y, z, col))

    # 目
    pixels += [_px(3, 22, 0, BLACK), _px(6, 22, 0, BLACK)]
    # 口
    pixels += [_px(4, 20, 0, D_SKIN), _px(5, 20, 0, D_SKIN)]

    # 胴体（青シャツ）
    for y in range(10, 18):
        for x in range(1, 9):
            for z in range(0, 5):
                col = D_BLUE if (x == 1 or x == 8 or y == 17) else BLUE
                pixels.append(_px(x, y, z, col))

    # 腕（左）
    for y in range(10, 17):
        for z in range(0, 4):
            pixels.append(_px(0, y, z, BLUE if y > 12 else SKIN))

    # 腕（右）
    for y in range(10, 17):
        for z in range(0, 4):
            pixels.append(_px(9, y, z, BLUE if y > 12 else SKIN))

    # 脚（左）
    for y in range(0, 10):
        for x in range(1, 5):
            for z in range(0, 4):
                col = D_BLUE if y < 2 else BLUE
                pixels.append(_px(x, y, z, col))

    # 脚（右）
    for y in range(0, 10):
        for x in range(5, 9):
            for z in range(0, 4):
                col = D_BLUE if y < 2 else BLUE
                pixels.append(_px(x, y, z, col))

    return pixels


def make_farmer_man() -> list[dict]:
    """C002: 農家のおじさん — 麦わら帽子 + 茶色い作業着

    size: ~12×26×8
    """
    pixels = []
    SKIN = "#D4A574"
    HAT = "#D4A017"
    D_HAT = "#A67C00"
    BROWN = "#78350F"
    D_BROWN = "#451A03"
    GRAY = "#6B7280"

    # 帽子（麦わら広場）
    for y in range(22, 26):
        for x in range(0, 12):
            for z in range(0, 8):
                dx = abs(x - 5.5)
                dz = abs(z - 3.5)
                if y == 25:
                    # つば
                    if dx <= 5.5 and dz <= 3.5:
                        pixels.append(_px(x, y, z, D_HAT))
                else:
                    # 本体
                    if dx <= 3 and dz <= 3:
                        col = D_HAT if (x + z) % 2 == 0 else HAT
                        pixels.append(_px(x, y, z, col))

    # 頭
    for y in range(16, 22):
        for x in range(2, 10):
            for z in range(1, 7):
                pixels.append(_px(x, y, z, SKIN))

    # 目・口
    pixels += [_px(3, 20, 1, "#1F2937"), _px(8, 20, 1, "#1F2937")]
    pixels += [_px(4, 18, 1, SKIN), _px(5, 18, 1, "#B45309"), _px(6, 18, 1, SKIN)]

    # 胴体（作業着）
    for y in range(6, 16):
        for x in range(1, 11):
            for z in range(1, 7):
                col = D_BROWN if (x == 1 or x == 10) else BROWN
                pixels.append(_px(x, y, z, col))

    # 脚
    for side in [(1, 5), (5, 10)]:
        for y in range(0, 6):
            for x in range(side[0], side[1]):
                for z in range(1, 6):
                    pixels.append(_px(x, y, z, D_BROWN if y < 1 else BROWN))

    return pixels


# ─────────────────────────────────────────────
#  家具 (furniture) — カタログID: I
# ─────────────────────────────────────────────

def make_table_wood() -> list[dict]:
    """I001: 木のテーブル — 天板 + 4本の脚

    size: ~24×10×16
    """
    pixels = []
    BROWN = "#92400E"
    D_BROWN = "#78350F"
    L_BROWN = "#B45309"

    # 天板
    for x in range(0, 24):
        for z in range(0, 16):
            for y in range(7, 10):
                col = L_BROWN if y == 9 else (D_BROWN if (x + z) % 4 == 0 else BROWN)
                pixels.append(_px(x, y, z, col))

    # 脚（4本）
    for (lx, lz) in [(1, 1), (1, 13), (21, 1), (21, 13)]:
        for y in range(0, 7):
            for dx in range(0, 2):
                for dz in range(0, 2):
                    pixels.append(_px(lx + dx, y, lz + dz, D_BROWN))

    return pixels


def make_campfire() -> list[dict]:
    """I002: キャンプファイヤー — 丸太 + 炎ボクセル

    size: ~12×12×12
    """
    pixels = []
    BROWN = "#78350F"
    D_BROWN = "#451A03"
    ORANGE = "#EA580C"
    L_ORANGE = "#FB923C"
    YELLOW = "#FACC15"
    RED = "#EF4444"

    cx, cz = 6, 6

    # 石の囲い
    for dx in range(-4, 5):
        for dz in range(-4, 5):
            if abs(dx) == 4 or abs(dz) == 4:
                if abs(dx) <= 4 and abs(dz) <= 4:
                    pixels.append(_px(cx + dx, 0, cz + dz, "#6B7280"))

    # 丸太（交差）
    for i in range(-3, 4):
        pixels.append(_px(cx + i, 1, cz, BROWN))
        pixels.append(_px(cx + i, 1, cz + 1, D_BROWN))
        pixels.append(_px(cx, 1, cz + i, BROWN))
        pixels.append(_px(cx + 1, 1, cz + i, D_BROWN))

    # 炎（ボクセル）
    flame_data = [
        (0, 2, 0, ORANGE), (1, 2, 0, ORANGE), (-1, 2, 0, ORANGE),
        (0, 2, 1, ORANGE), (0, 2, -1, ORANGE),
        (0, 3, 0, YELLOW), (1, 3, 0, ORANGE), (-1, 3, 0, ORANGE),
        (0, 4, 0, YELLOW), (0, 5, 0, L_ORANGE),
        (1, 4, 0, ORANGE), (-1, 4, 0, ORANGE),
        (0, 4, 1, ORANGE), (0, 4, -1, ORANGE),
        (0, 6, 0, RED), (1, 5, 0, L_ORANGE), (-1, 5, 0, L_ORANGE),
    ]
    for dx, dy, dz, col in flame_data:
        pixels.append(_px(cx + dx, dy, cz + dz, col))

    return pixels


def make_bookshelf() -> list[dict]:
    """I003: 本棚 — 棚板 + カラフルな本ボクセル

    size: ~16×24×5
    """
    pixels = []
    BROWN = "#92400E"
    D_BROWN = "#78350F"

    BOOK_COLORS = [
        "#EF4444", "#3B82F6", "#22C55E", "#FBBF24",
        "#8B5CF6", "#F97316", "#06B6D4", "#EC4899",
    ]

    W, H, D = 16, 24, 5

    # フレーム
    for x in range(0, W):
        for y in range(0, H):
            for z in range(0, D):
                is_frame = (x == 0 or x == W - 1 or y == 0 or y == H - 1 or z == D - 1)
                is_shelf = (y % 8 == 0 and 1 <= x <= W - 2)
                if is_frame or is_shelf:
                    col = D_BROWN if (x + y) % 2 == 0 else BROWN
                    pixels.append(_px(x, y, z, col))

    # 本（各棚に詰め込む）
    for shelf in range(3):
        y_base = shelf * 8 + 1
        book_x = 1
        book_idx = 0
        while book_x < W - 2:
            w = 2 if book_idx % 3 == 0 else 1
            col = BOOK_COLORS[book_idx % len(BOOK_COLORS)]
            for bx in range(book_x, min(book_x + w, W - 2)):
                for by in range(y_base, y_base + 6):
                    for bz in range(0, D - 1):
                        pixels.append(_px(bx, by, bz, col))
            book_x += w + 0
            book_idx += 1

    return pixels


# ─────────────────────────────────────────────
#  建造物 (building) — カタログID: B
# ─────────────────────────────────────────────

def make_cabin_small() -> list[dict]:
    """B001: 小さな小屋 — ログハウス風ボクセル

    size: ~24×24×20
    """
    pixels = []
    WOOD = "#92400E"
    D_WOOD = "#78350F"
    ROOF = "#7F1D1D"     # 暗赤色の屋根
    L_ROOF = "#991B1B"
    WINDOW = "#BAE6FD"   # 水色の窓
    DOOR = "#5C3D1E"

    W, H, D = 24, 14, 20

    # 壁
    for x in range(0, W):
        for y in range(0, H):
            for z in range(0, D):
                is_wall = (x == 0 or x == W - 1 or z == 0 or z == D - 1)
                if is_wall:
                    col = D_WOOD if y % 2 == 0 else WOOD
                    pixels.append(_px(x, y, z, col))

    # 床
    for x in range(0, W):
        for z in range(0, D):
            pixels.append(_px(x, 0, z, D_WOOD))

    # 窓（左・右）
    for wx, wz in [(4, 0), (18, 0), (4, 19), (18, 19)]:
        for dy in range(4, 9):
            for dx in range(0, 4):
                pixels.append(_px(wx + dx, dy, wz, WINDOW))

    # ドア
    for dy in range(0, 10):
        for dx in range(0, 4):
            col = DOOR if dy < 9 else D_WOOD
            pixels.append(_px(10 + dx, dy, 0, col))

    # 屋根（ピラミッド型ボクセル）
    for level in range(0, 10):
        rx = level
        rz = level
        for x in range(rx, W - rx):
            for z in range(rz, D - rz):
                is_edge = (x == rx or x == W - 1 - rx or z == rz or z == D - 1 - rz)
                if is_edge:
                    col = L_ROOF if (x + z) % 2 == 0 else ROOF
                    pixels.append(_px(x, H + level, z, col))

    return pixels


def make_windmill() -> list[dict]:
    """B002: 風車 — 丸い塔 + 十字の羽根

    size: ~20×40×20
    """
    pixels = []
    WHITE = "#F1F5F9"
    GRAY = "#CBD5E1"
    D_GRAY = "#94A3B8"
    BROWN = "#92400E"

    cx, cz = 10, 10

    # 塔（円柱形）
    for y in range(0, 30):
        r = max(2, 5 - y // 8)
        for dx in range(-r, r + 1):
            for dz in range(-r, r + 1):
                if dx * dx + dz * dz <= r * r * 1.5:
                    col = D_GRAY if (dx + dz + y) % 3 == 0 else WHITE
                    pixels.append(_px(cx + dx, y, cz + dz, col))

    # 羽根（十字・4枚）
    for blade in range(4):
        angle = blade * 90
        rad = math.radians(angle)
        cos_a, sin_a = math.cos(rad), math.sin(rad)
        for i in range(2, 12):
            bx = round(cx + cos_a * i)
            bz = round(cz + sin_a * i)
            w = max(1, 3 - i // 4)
            for dw in range(-w, w + 1):
                bx2 = round(bx - sin_a * dw)
                bz2 = round(bz + cos_a * dw)
                col = GRAY if i % 2 == 0 else BROWN
                pixels.append(_px(int(bx2), 30, int(bz2), col))

    return pixels


# ─────────────────────────────────────────────
#  フィールド (field) — カタログID: L
# ─────────────────────────────────────────────

def make_grass_tile() -> list[dict]:
    """L001: 草原タイル — 凸凹した地面

    size: 32×8×32
    """
    pixels = []
    GREEN = "#4ADE80"
    D_GREEN = "#22C55E"
    DD_GREEN = "#166534"
    DIRT = "#92400E"
    D_DIRT = "#78350F"

    import random
    rng = random.Random(42)

    SIZE = 32
    for x in range(0, SIZE):
        for z in range(0, SIZE):
            # 地面の高さ（凸凹）
            h = rng.randint(0, 3)

            # 土台
            for y in range(0, h):
                col = D_DIRT if (x + z) % 2 == 0 else DIRT
                pixels.append(_px(x, y, z, col))

            # 表面（草）
            surf_col = DD_GREEN if h == 3 else (D_GREEN if h == 2 else GREEN)
            pixels.append(_px(x, h, z, surf_col))

            # 草の穂（たまに）
            if rng.random() < 0.08:
                pixels.append(_px(x, h + 1, z, "#86EFAC"))

    return pixels


def make_river_tile() -> list[dict]:
    """L002: 川のタイル — 凸凹した川床 + 水面

    size: 32×8×32
    """
    pixels = []
    WATER = "#38BDF8"
    D_WATER = "#0284C7"
    L_WATER = "#BAE6FD"
    STONE = "#94A3B8"
    D_STONE = "#64748B"
    SAND = "#D4A574"

    import random
    rng = random.Random(7)

    SIZE = 32
    for x in range(0, SIZE):
        for z in range(0, SIZE):
            # 川床の高さ
            h = rng.randint(0, 2)

            # 川床（石・砂）
            for y in range(0, h + 1):
                col = D_STONE if (x + z) % 3 == 0 else (SAND if (x + z) % 5 == 0 else STONE)
                pixels.append(_px(x, y, z, col))

            # 水面（一定高さ）
            water_h = 4
            for y in range(h + 1, water_h + 1):
                col = L_WATER if y == water_h and (x + z) % 4 == 0 else (D_WATER if (x + z) % 3 == 0 else WATER)
                pixels.append(_px(x, y, z, col))

    return pixels


def make_stone_tile() -> list[dict]:
    """L003: 石畳タイル — 目地 + 凸凹した石のパターン

    size: 32×4×32
    """
    pixels = []
    STONE = "#9CA3AF"
    D_STONE = "#6B7280"
    L_STONE = "#D1D5DB"
    JOINT = "#374151"   # 目地

    GRID = 4  # 1タイルのサイズ

    import random
    rng = random.Random(13)

    SIZE = 32
    for x in range(0, SIZE):
        for z in range(0, SIZE):
            is_joint = (x % GRID == 0 or z % GRID == 0)
            h = 1 if is_joint else rng.randint(2, 3)

            for y in range(0, h):
                if is_joint:
                    pixels.append(_px(x, y, z, JOINT))
                else:
                    col = L_STONE if (x // GRID + z // GRID) % 2 == 0 else (D_STONE if (x + z) % 3 == 0 else STONE)
                    pixels.append(_px(x, y, z, col))

    return pixels


# ─────────────────────────────────────────────
#  特別 (special) — カタログID: SP
# ─────────────────────────────────────────────

def make_sfc_cart() -> list[dict]:
    """SP001: スーパーファミコンカートリッジ — ゲームソフト

    size: ~12×14×4
    """
    pixels = []
    GRAY = "#9CA3AF"
    D_GRAY = "#6B7280"
    BLACK = "#111827"
    BLUE = "#1D4ED8"
    L_BLUE = "#3B82F6"
    YELLOW = "#FBBF24"

    W, H, D = 12, 14, 4

    # 本体
    for x in range(0, W):
        for y in range(0, H):
            for z in range(0, D):
                is_edge = (x == 0 or x == W - 1 or y == 0 or y == H - 1 or z == 0 or z == D - 1)
                if is_edge:
                    col = D_GRAY if (x + y) % 2 == 0 else GRAY
                else:
                    col = GRAY
                pixels.append(_px(x, y, z, col))

    # ラベル（正面）
    for x in range(1, W - 1):
        for y in range(3, H - 1):
            z = 0
            # 青いラベル
            col = BLUE if (x + y) % 3 != 0 else L_BLUE
            if y > H - 4:
                col = YELLOW  # タイトル部分
            pixels.append(_px(x, y, z, col))

    # コネクタピン（下部）
    for x in range(2, W - 2, 2):
        pixels.append(_px(x, 0, 1, BLACK))
        pixels.append(_px(x, 0, 2, BLACK))

    return pixels


def make_tech_book() -> list[dict]:
    """SP002: 技術書 — 本のボクセル

    size: ~10×14×3
    """
    pixels = []
    COVER = "#1D4ED8"
    D_COVER = "#1E3A8A"
    SPINE = "#1E40AF"
    PAGE = "#F1F5F9"
    D_PAGE = "#E2E8F0"
    TITLE = "#FBBF24"

    W, H, D = 10, 14, 3

    for x in range(0, W):
        for y in range(0, H):
            for z in range(0, D):
                # 背表紙（左端）
                if x == 0:
                    col = SPINE
                # 表紙
                elif z == D - 1:
                    col = TITLE if (3 <= x <= 8 and 8 <= y <= 11) else (D_COVER if (x + y) % 2 == 0 else COVER)
                # 裏表紙
                elif z == 0:
                    col = D_COVER
                # ページ（内部）
                else:
                    col = D_PAGE if (y % 2 == 0) else PAGE
                pixels.append(_px(x, y, z, col))

    return pixels


# ─────────────────────────────────────────────
#  モデルカタログ（全モデル一覧）
# ─────────────────────────────────────────────

CATALOG: list[dict] = [
    # --- food (F) ---
    {
        "catalog_id": "F001",
        "name": "にんじん",
        "name_en": "Carrot",
        "category": "food",
        "subcategory": None,
        "description": "土の中で育つオレンジの根菜。甘みと栄養が豊富。",
        "flavor_text": "β-カロテンたっぷりのにんじん。食べると目が良くなると言われている。",
        "rarity": "common",
        "locations": ["kitchen", "garden", "grocery"],
        "seasons": ["spring", "autumn"],
        "obtain_method": "食材を登録する / 畑から収穫する",
        "model_file": "food/carrot.glb",
        "make_fn": make_carrot,
        "size": (16, 18, 16),
    },
    {
        "catalog_id": "F002",
        "name": "トマト",
        "name_en": "Tomato",
        "category": "food",
        "subcategory": None,
        "description": "真っ赤に熟した夏の野菜。リコピンたっぷり。",
        "flavor_text": "夏の太陽をたっぷり浴びて育ったトマト。サラダにもスープにも。",
        "rarity": "common",
        "locations": ["kitchen", "garden"],
        "seasons": ["summer"],
        "obtain_method": "食材を登録する",
        "model_file": "food/tomato.glb",
        "make_fn": make_tomato,
        "size": (20, 20, 20),
    },
    {
        "catalog_id": "F003",
        "name": "りんご",
        "name_en": "Apple",
        "category": "food",
        "subcategory": None,
        "description": "秋に実る赤いりんご。シャキシャキとした食感。",
        "flavor_text": "「医者いらず」とも呼ばれる。一日一個のりんごは健康の秘訣。",
        "rarity": "common",
        "locations": ["kitchen", "orchard"],
        "seasons": ["autumn"],
        "obtain_method": "食材を登録する",
        "model_file": "food/apple.glb",
        "make_fn": make_apple,
        "size": (18, 20, 18),
    },
    {
        "catalog_id": "F004",
        "name": "鶏肉",
        "name_en": "Chicken",
        "category": "food",
        "subcategory": None,
        "description": "こんがり焼けた鶏肉。高タンパク低脂質。",
        "flavor_text": "焼き色がついてジューシーな鶏肉。どんな料理にも合う万能食材。",
        "rarity": "uncommon",
        "locations": ["kitchen", "grocery"],
        "seasons": ["spring", "summer", "autumn", "winter"],
        "obtain_method": "食材を登録する",
        "model_file": "food/chicken.glb",
        "make_fn": make_chicken,
        "size": (16, 14, 14),
    },
    {
        "catalog_id": "F005",
        "name": "お弁当",
        "name_en": "Bento",
        "category": "food",
        "subcategory": None,
        "description": "色とりどりのおかずが詰まったお弁当箱。",
        "flavor_text": "誰かが手間暇かけて作ってくれたお弁当。食べると元気が出る。",
        "rarity": "uncommon",
        "locations": ["kitchen", "workplace"],
        "seasons": ["spring", "summer", "autumn", "winter"],
        "obtain_method": "食材を5種類登録する",
        "model_file": "food/bento.glb",
        "make_fn": make_bento,
        "size": (20, 10, 16),
    },

    # --- plant (P) ---
    {
        "catalog_id": "P001",
        "name": "大きなオーク",
        "name_en": "Large Oak",
        "category": "plant",
        "subcategory": None,
        "description": "太くたくましい幹を持つ大きなオークの木。",
        "flavor_text": "何百年も生きるオークの木。その根は大地を深く掴み、嵐にも揺れない。",
        "rarity": "uncommon",
        "locations": ["garden", "forest"],
        "seasons": ["spring", "summer", "autumn"],
        "obtain_method": "箱庭レベル2に到達する",
        "model_file": "plant/oak_large.glb",
        "make_fn": make_oak_large,
        "size": (24, 28, 24),
    },
    {
        "catalog_id": "P002",
        "name": "赤いバラ",
        "name_en": "Red Rose",
        "category": "plant",
        "subcategory": None,
        "description": "鮮やかな赤い花弁を持つバラ。棘に注意。",
        "flavor_text": "愛と情熱の象徴。満開のバラは箱庭に特別な雰囲気をもたらす。",
        "rarity": "rare",
        "locations": ["garden", "greenhouse"],
        "seasons": ["spring", "summer"],
        "obtain_method": "7日間連続で運動を記録する",
        "model_file": "plant/rose_red.glb",
        "make_fn": make_rose_red,
        "size": (12, 20, 12),
    },
    {
        "catalog_id": "P003",
        "name": "サボテン",
        "name_en": "Cactus",
        "category": "plant",
        "subcategory": None,
        "description": "砂漠で育つ丈夫なサボテン。手入れが楽。",
        "flavor_text": "水やりを忘れても平気。沙漠の厳しい環境で生き抜く生命力がある。",
        "rarity": "common",
        "locations": ["garden", "windowsill"],
        "seasons": ["summer"],
        "obtain_method": "最初から所持している",
        "model_file": "plant/cactus.glb",
        "make_fn": make_cactus,
        "size": (12, 24, 12),
    },

    # --- person (C) ---
    {
        "catalog_id": "C001",
        "name": "プレイヤー",
        "name_en": "Player",
        "category": "person",
        "subcategory": None,
        "description": "箱庭の主人公。青いシャツがトレードマーク。",
        "flavor_text": "この世界の住人。食材を管理し、運動し、箱庭を育てる。それがこの人の日課。",
        "rarity": "legendary",
        "locations": ["garden"],
        "seasons": ["spring", "summer", "autumn", "winter"],
        "obtain_method": "アカウントを作成する",
        "model_file": "person/avatar_default.glb",
        "make_fn": make_avatar_default,
        "size": (10, 24, 6),
    },
    {
        "catalog_id": "C002",
        "name": "農家のおじさん",
        "name_en": "Farmer",
        "category": "person",
        "subcategory": None,
        "description": "麦わら帽子をかぶった農家のおじさん。野菜のことなら何でも知っている。",
        "flavor_text": "「野菜は愛情で育つ」というのが口癖。畑を見ると目を細めて嬉しそうにする。",
        "rarity": "rare",
        "locations": ["garden", "farm"],
        "seasons": ["spring", "summer", "autumn"],
        "obtain_method": "野菜を10種類登録する",
        "model_file": "person/farmer_man.glb",
        "make_fn": make_farmer_man,
        "size": (12, 26, 8),
    },

    # --- furniture (I) ---
    {
        "catalog_id": "I001",
        "name": "木のテーブル",
        "name_en": "Wooden Table",
        "category": "furniture",
        "subcategory": None,
        "description": "頑丈な木製テーブル。箱庭に置ける家具の定番。",
        "flavor_text": "傷だらけのテーブルには、家族の歴史が刻まれている。",
        "rarity": "common",
        "locations": ["garden", "house"],
        "seasons": ["spring", "summer", "autumn", "winter"],
        "obtain_method": "最初から所持している",
        "model_file": "furniture/table_wood.glb",
        "make_fn": make_table_wood,
        "size": (24, 10, 16),
    },
    {
        "catalog_id": "I002",
        "name": "キャンプファイヤー",
        "name_en": "Campfire",
        "category": "furniture",
        "subcategory": None,
        "description": "夜の箱庭を照らすキャンプファイヤー。",
        "flavor_text": "炎が揺れるたびに、黄金色の光が箱庭を温かく包む。",
        "rarity": "uncommon",
        "locations": ["garden", "forest"],
        "seasons": ["autumn", "winter"],
        "obtain_method": "箱庭に木を3本植える",
        "model_file": "furniture/campfire.glb",
        "make_fn": make_campfire,
        "size": (14, 12, 14),
    },
    {
        "catalog_id": "I003",
        "name": "本棚",
        "name_en": "Bookshelf",
        "category": "furniture",
        "subcategory": None,
        "description": "カラフルな本が並んだ本棚。知識の宝庫。",
        "flavor_text": "読んだ本だけが人生を豊かにする。この本棚には何冊の物語が眠っているだろう。",
        "rarity": "common",
        "locations": ["house", "library"],
        "seasons": ["spring", "summer", "autumn", "winter"],
        "obtain_method": "図鑑を10冊コンプリートする",
        "model_file": "furniture/bookshelf.glb",
        "make_fn": make_bookshelf,
        "size": (16, 24, 5),
    },

    # --- building (B) ---
    {
        "catalog_id": "B001",
        "name": "小さな小屋",
        "name_en": "Small Cabin",
        "category": "building",
        "subcategory": None,
        "description": "丸太で作られた小さなログハウス。",
        "flavor_text": "木の香りと暖炉の温もり。小さくても、ここは大事な家。",
        "rarity": "uncommon",
        "locations": ["garden"],
        "seasons": ["spring", "summer", "autumn", "winter"],
        "obtain_method": "箱庭レベル3に到達する",
        "model_file": "building/cabin_small.glb",
        "make_fn": make_cabin_small,
        "size": (24, 24, 20),
    },
    {
        "catalog_id": "B002",
        "name": "風車",
        "name_en": "Windmill",
        "category": "building",
        "subcategory": None,
        "description": "風を受けてゆっくり回る白い風車。",
        "flavor_text": "風が吹くたびに羽根が回り、昔はここで粉を挽いていた。今は箱庭のシンボルになっている。",
        "rarity": "rare",
        "locations": ["field", "hilltop"],
        "seasons": ["spring", "summer"],
        "obtain_method": "30日間連続でログインする",
        "model_file": "building/windmill.glb",
        "make_fn": make_windmill,
        "size": (22, 40, 22),
    },

    # --- field (L) ---
    {
        "catalog_id": "L001",
        "name": "草原タイル",
        "name_en": "Grass Tile",
        "category": "field",
        "subcategory": None,
        "description": "生き生きとした草が生えるフィールドのタイル。",
        "flavor_text": "踏むたびにふわりと草の香りがする。生命力の象徴。",
        "rarity": "common",
        "locations": ["garden", "field"],
        "seasons": ["spring", "summer"],
        "obtain_method": "最初から使用可能",
        "model_file": "field/grass_tile.glb",
        "make_fn": make_grass_tile,
        "size": (32, 8, 32),
    },
    {
        "catalog_id": "L002",
        "name": "川のタイル",
        "name_en": "River Tile",
        "category": "field",
        "subcategory": None,
        "description": "せせらぎが聞こえる小川のフィールドタイル。",
        "flavor_text": "流れる水の音が心を落ち着かせる。川底には小石が光っている。",
        "rarity": "uncommon",
        "locations": ["garden", "riverside"],
        "seasons": ["spring", "summer", "autumn"],
        "obtain_method": "箱庭に池を作る",
        "model_file": "field/river_tile.glb",
        "make_fn": make_river_tile,
        "size": (32, 8, 32),
    },
    {
        "catalog_id": "L003",
        "name": "石畳タイル",
        "name_en": "Stone Tile",
        "category": "field",
        "subcategory": None,
        "description": "整然と並んだ石畳のフィールドタイル。",
        "flavor_text": "職人が一枚一枚丁寧に敷いた石畳。雨に濡れると美しく輝く。",
        "rarity": "common",
        "locations": ["garden", "path"],
        "seasons": ["spring", "summer", "autumn", "winter"],
        "obtain_method": "最初から使用可能",
        "model_file": "field/stone_tile.glb",
        "make_fn": make_stone_tile,
        "size": (32, 4, 32),
    },

    # --- special (SP) ---
    {
        "catalog_id": "SP001",
        "name": "スーパーファミコンカートリッジ",
        "name_en": "SFC Game Cartridge",
        "category": "special",
        "subcategory": "game_software",
        "description": "懐かしのスーパーファミコンのゲームカートリッジ。",
        "flavor_text": "差し込んで電源を入れた瞬間、あの頃の記憶がよみがえる。今でも遊べるかな？",
        "rarity": "rare",
        "locations": ["shelf", "storage"],
        "seasons": ["spring", "summer", "autumn", "winter"],
        "obtain_method": "所持品に「ゲームソフト」を登録する",
        "model_file": "special/game_software/sfc_cart.glb",
        "make_fn": make_sfc_cart,
        "size": (12, 14, 4),
    },
    {
        "catalog_id": "SP002",
        "name": "技術書",
        "name_en": "Technical Book",
        "category": "special",
        "subcategory": "book",
        "description": "分厚い技術書。知識が詰まっている。",
        "flavor_text": "読めば読むほど、世界が広がる気がする。積ん読は罪？いや、それも文化だ。",
        "rarity": "common",
        "locations": ["shelf", "desk", "library"],
        "seasons": ["spring", "summer", "autumn", "winter"],
        "obtain_method": "所持品に「本」を登録する",
        "model_file": "special/books/tech_book.glb",
        "make_fn": make_tech_book,
        "size": (10, 14, 3),
    },
]
