#!/usr/bin/env python3
"""
コンビニはがき印刷用 名刺ジェネレーター (Hagaki Meishi Maker)
======================================================
一枚のはがき用紙（100mm × 148mm）に名刺（91mm × 55mm）を2枚配置し、
コンビニ（セブン-イレブン等）のマルチコピー機で綺麗に印刷・カットできる
高解像度画像（PNG/JPG/PDF）を生成します。

参考: https://note.com/mojacookie/n/n75bbf90a0eb5
"""

import os
import sys
import argparse
import webbrowser
import http.server
import socketserver
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

try:
    import qrcode
    HAS_QRCODE = True
except ImportError:
    HAS_QRCODE = False

# ==========================================
# 定数定義
# ==========================================
# mm単位の寸法
HAGAKI_WIDTH_MM = 100.0
HAGAKI_HEIGHT_MM = 148.0
CARD_WIDTH_MM = 91.0
CARD_HEIGHT_MM = 55.0

# デフォルトDPI（印刷標準: 600dpi）
DEFAULT_DPI = 600


def mm_to_px(mm: float, dpi: int) -> int:
    """ミリメートルをピクセルに変換"""
    return int(round((mm / 25.4) * dpi))


def find_system_font(font_type="gothic"):
    """システム内の利用可能な日本語フォントを探す"""
    candidates = []
    if font_type == "mincho":
        candidates = [
            "/usr/share/fonts/opentype/ipaexfont-mincho/ipaexm.ttf",
            "/usr/share/fonts/truetype/BIZ-UDMinchoM.ttc",
            "/usr/share/fonts/opentype/ipafont-mincho/ipam.ttf",
            "/usr/share/fonts/truetype/fonts-japanese-mincho.ttf",
            "/System/Library/Fonts/Hiragino Mincho ProN.ttc",  # macOS
            "C:\\Windows\\Fonts\\msmincho.ttc",               # Windows
        ]
    else:  # gothic
        candidates = [
            "/usr/share/fonts/opentype/ipaexfont-gothic/ipaexg.ttf",
            "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf",
            "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf",
            "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
            "/System/Library/Fonts/Hiragino Sans GB.ttc",     # macOS
            "C:\\Windows\\Fonts\\msgothic.ttc",               # Windows
            "C:\\Windows\\Fonts\\meiryo.ttc",
        ]

    for path in candidates:
        if os.path.exists(path):
            return path
    return None


def get_font(path: str = None, size: int = 24, font_type: str = "gothic"):
    """フォントオブジェクトを取得"""
    font_path = path or find_system_font(font_type)
    if font_path and os.path.exists(font_path):
        try:
            return ImageFont.truetype(font_path, size)
        except Exception:
            pass
    return ImageFont.load_default()


# ==========================================
# トンボ・切り取り線描画
# ==========================================
def draw_crop_marks(
    draw: ImageDraw.ImageDraw,
    rect: tuple[int, int, int, int],
    hagaki_w: int,
    hagaki_h: int,
    mark_len: int,
    line_width: int,
    color=(80, 80, 80, 255),
    show_border=False,
    border_color=(220, 220, 220, 255),
):
    """
    指定された名刺矩形の四隅・外側にトンボ（カッター用ガイド線）を描画。
    名刺の内側を傷つけず、定規を合わせるための外側マークを描きます。
    """
    x1, y1, x2, y2 = rect

    # 初心者向け薄い枠線
    if show_border:
        draw.rectangle([x1, y1, x2, y2], outline=border_color, width=max(1, line_width // 2))

    # 四隅のコーナートンボ（名刺外側へ伸びる十字/L字線）
    # 左上 (x1, y1)
    draw.line([(max(0, x1 - mark_len), y1), (x1, y1)], fill=color, width=line_width)
    draw.line([(x1, max(0, y1 - mark_len)), (x1, y1)], fill=color, width=line_width)

    # 右上 (x2, y1)
    draw.line([(x2, y1), (min(hagaki_w, x2 + mark_len), y1)], fill=color, width=line_width)
    draw.line([(x2, max(0, y1 - mark_len)), (x2, y1)], fill=color, width=line_width)

    # 左下 (x1, y2)
    draw.line([(max(0, x1 - mark_len), y2), (x1, y2)], fill=color, width=line_width)
    draw.line([(x1, y2), (x1, min(hagaki_h, y2 + mark_len))], fill=color, width=line_width)

    # 右下 (x2, y2)
    draw.line([(x2, y2), (min(hagaki_w, x2 + mark_len), y2)], fill=color, width=line_width)
    draw.line([(x2, y2), (x2, min(hagaki_h, y2 + mark_len))], fill=color, width=line_width)


# ==========================================
# 2面配置（はがきレイアウト合成）
# ==========================================
def create_hagaki_layout(
    top_card_img: Image.Image,
    bottom_card_img: Image.Image = None,
    dpi: int = DEFAULT_DPI,
    gap_mm: float = 0.0,
    rotate_180: bool = False,
    show_border: bool = False,
    avoid_postal: bool = True,
    background_color: tuple = (255, 255, 255),
) -> Image.Image:
    """
    はがき用紙（100x148mm）に名刺2枚を配置し、トンボを描画する。

    :param top_card_img: 上段の名刺画像（PIL Image）
    :param bottom_card_img: 下段の名刺画像。Noneの場合は上段と同じ画像を使用
    :param dpi: 解像度（デフォルト600dpi）
    :param gap_mm: 2枚の名刺の間の隙間(mm)。0なら中央接合（カット回数が最小）
    :param rotate_180: 裏面印刷用。全体を180度反転させてコンビニ機の給紙ズレを相殺
    :param show_border: 名刺の周囲に薄いカットガイド枠線を表示するか
    :param avoid_postal: 郵便番号枠（上から約12〜20mm）を避けるため、全体を約6mm下に下げて上余白25mmにする
    :param background_color: はがきの背景色（通常は白）
    :return: はがきサイズのPIL Image
    """
    if bottom_card_img is None:
        bottom_card_img = top_card_img

    # ピクセルサイズ計算
    hagaki_w = mm_to_px(HAGAKI_WIDTH_MM, dpi)
    hagaki_h = mm_to_px(HAGAKI_HEIGHT_MM, dpi)
    card_w = mm_to_px(CARD_WIDTH_MM, dpi)
    card_h = mm_to_px(CARD_HEIGHT_MM, dpi)
    gap_px = mm_to_px(gap_mm, dpi)

    # はがきキャンバス作成
    canvas = Image.new("RGB", (hagaki_w, hagaki_h), background_color)
    draw = ImageDraw.Draw(canvas)

    # 水平マージン（左右均等中央配置）
    margin_x = (hagaki_w - card_w) // 2

    # 垂直マージン（郵便番号枠回避 vs 上下均等）
    if avoid_postal:
        # 上余白を25.0mmに設定し、郵便番号赤枠と名刺の重なりを完全回避！
        margin_y = mm_to_px(25.0, dpi)
    else:
        total_cards_h = card_h * 2 + gap_px
        margin_y = (hagaki_h - total_cards_h) // 2

    # 名刺1（上段）の座標
    top_x1 = margin_x
    top_y1 = margin_y
    top_x2 = top_x1 + card_w
    top_y2 = top_y1 + card_h

    # 名刺2（下段）の座標
    bot_x1 = margin_x
    bot_y1 = top_y2 + gap_px
    bot_x2 = bot_x1 + card_w
    bot_y2 = bot_y1 + card_h

    # 名刺画像をリサイズして配置
    def prepare_card(img: Image.Image) -> Image.Image:
        # アスペクト比を維持しつつピッタリ合わせる
        if img.size != (card_w, card_h):
            return img.resize((card_w, card_h), Image.Resampling.LANCZOS)
        return img

    top_resized = prepare_card(top_card_img)
    bot_resized = prepare_card(bottom_card_img)

    canvas.paste(top_resized, (top_x1, top_y1))
    canvas.paste(bot_resized, (bot_x1, bot_y1))

    # トンボ（トリムマーク）の描画
    mark_len = mm_to_px(3.5, dpi)  # 3.5mmの外側ガイド線
    line_w = max(1, mm_to_px(0.15, dpi))  # 約0.15mm幅の細線
    mark_color = (60, 60, 60)
    border_color = (210, 210, 210)

    # 上段のトンボ
    draw_crop_marks(
        draw,
        (top_x1, top_y1, top_x2, top_y2),
        hagaki_w,
        hagaki_h,
        mark_len,
        line_w,
        mark_color,
        show_border,
        border_color,
    )

    # 下段のトンボ
    draw_crop_marks(
        draw,
        (bot_x1, bot_y1, bot_x2, bot_y2),
        hagaki_w,
        hagaki_h,
        mark_len,
        line_w,
        mark_color,
        show_border,
        border_color,
    )

    # もし名刺同士が接している場合（gap=0）、中央分割線用の左右トンボを強調
    if gap_px == 0:
        center_y = top_y2
        draw.line([(0, center_y), (top_x1, center_y)], fill=mark_color, width=line_w)
        draw.line([(top_x2, center_y), (hagaki_w, center_y)], fill=mark_color, width=line_w)
    else:
        # ギャップがある場合、上下のカットライン左右にトンボ
        draw.line([(0, top_y2), (top_x1, top_y2)], fill=mark_color, width=line_w)
        draw.line([(top_x2, top_y2), (hagaki_w, top_y2)], fill=mark_color, width=line_w)
        draw.line([(0, bot_y1), (bot_x1, bot_y1)], fill=mark_color, width=line_w)
        draw.line([(bot_x2, bot_y1), (bot_w := hagaki_w, bot_y1)], fill=mark_color, width=line_w)

    # 用紙端までガイド線を伸ばす外側補助線（カッター定規をはがき端から滑らせる用）
    # 縦カットライン (x = top_x1, x = top_x2)
    draw.line([(top_x1, 0), (top_x1, max(0, top_y1 - mark_len // 2))], fill=(180, 180, 180), width=1)
    draw.line([(top_x1, min(hagaki_h, bot_y2 + mark_len // 2)), (top_x1, hagaki_h)], fill=(180, 180, 180), width=1)
    draw.line([(top_x2, 0), (top_x2, max(0, top_y1 - mark_len // 2))], fill=(180, 180, 180), width=1)
    draw.line([(top_x2, min(hagaki_h, bot_y2 + mark_len // 2)), (top_x2, hagaki_h)], fill=(180, 180, 180), width=1)

    # 裏面印刷用の180度回転処理（セブンの給紙ズレ対策）
    if rotate_180:
        canvas = canvas.rotate(180)

    return canvas


# ==========================================
# 名刺デザイン自動生成（テンプレートエンジン）
# ==========================================
def generate_card_design(
    name: str,
    name_kana: str = "",
    company: str = "",
    title: str = "",
    tel: str = "",
    email: str = "",
    url: str = "",
    address: str = "",
    style: str = "business",  # "business", "center", "modern", "stylish", "minimal"
    theme_color: str = "#1E3A8A",  # アクセントカラー
    dpi: int = DEFAULT_DPI,
    qr_data: str = None,
    logo_path: str = None,
) -> Image.Image:
    """
    入力された情報から 91mm × 55mm の名刺画像を美しく自動生成する
    """
    card_w = mm_to_px(CARD_WIDTH_MM, dpi)
    card_h = mm_to_px(CARD_HEIGHT_MM, dpi)

    card = Image.new("RGB", (card_w, card_h), (255, 255, 255))
    draw = ImageDraw.Draw(card)

    font_type = "mincho" if style in ["classic", "formal"] else "gothic"
    font_path = find_system_font(font_type)

    # 基準サイズ（600dpi基準スケール）
    scale = dpi / 600.0

    # ----------------------------------------------------
    # スタイル別レンダリング
    # ----------------------------------------------------
    if style == "center":
        # 🎯 名前ど真ん中（中央揃えスタイル）
        center_x = card_w // 2

        # 1. 会社名＆肩書（上部中央）
        top_y = int(240 * scale)
        if company:
            comp_font = get_font(font_path, int(44 * scale), font_type)
            draw.text((center_x, top_y), company, font=comp_font, fill="#334155", anchor="mt")
            top_y += int(70 * scale)
        if title:
            title_font = get_font(font_path, int(32 * scale), font_type)
            draw.text((center_x, top_y), title, font=title_font, fill="#64748B", anchor="mt")

        # 2. ふりがな＆氏名（ど真ん中）
        center_y = card_h // 2 - int(20 * scale)
        if name_kana:
            kana_font = get_font(font_path, int(26 * scale), font_type)
            draw.text((center_x, center_y - int(85 * scale)), name_kana, font=kana_font, fill="#64748B", anchor="ms")
        if name:
            name_font = get_font(font_path, int(100 * scale), font_type)
            draw.text((center_x, center_y), name, font=name_font, fill="#0F172A", anchor="mm")

        # 装飾ライン
        line_y = center_y + int(90 * scale)
        draw.line(
            [(center_x - int(450 * scale), line_y), (center_x + int(450 * scale), line_y)],
            fill=theme_color,
            width=max(2, int(4 * scale)),
        )

        # 3. 連絡先（下部中央）
        contact_items = []
        if tel: contact_items.append(f"TEL: {tel}")
        if email: contact_items.append(f"Mail: {email}")
        if url: contact_items.append(f"Web: {url}")
        if address: contact_items.append(f"Add: {address}")

        info_font = get_font(font_path, int(28 * scale), font_type)
        bottom_y = card_h - int(100 * scale) - len(contact_items) * int(44 * scale)
        for idx, item in enumerate(contact_items):
            draw.text((center_x, bottom_y + idx * int(44 * scale)), item, font=info_font, fill="#334155", anchor="mt")

        # 4. QRコード（右下に配置）
        target_qr = qr_data or url
        if target_qr and HAS_QRCODE:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=max(1, int(6 * scale)),
                border=1,
            )
            qr.add_data(target_qr)
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
            qr_size = qr_img.size[0]
            card.paste(qr_img, (card_w - qr_size - int(110 * scale), card_h - qr_size - int(90 * scale)))

        return card

    # 従来のスタイル（左揃え・モダン・スタイリッシュ）
    if style == "modern":
        # 上部にアクセントカラーの帯
        bar_h = int(24 * scale)
        draw.rectangle([(0, 0), (card_w, bar_h)], fill=theme_color)
    elif style == "stylish":
        # 左側にアクセントカラーの縦帯
        bar_w = int(28 * scale)
        draw.rectangle([(0, 0), (bar_w, card_h)], fill=theme_color)

    margin_left = int(140 * scale)
    if style == "stylish":
        margin_left = int(180 * scale)

    curr_y = int(120 * scale)

    # 1. 会社名 / 所属
    if company:
        comp_font = get_font(font_path, int(42 * scale), font_type)
        draw.text((margin_left, curr_y), company, font=comp_font, fill="#444444")
        curr_y += int(70 * scale)

    # 2. 肩書
    if title:
        title_font = get_font(font_path, int(34 * scale), font_type)
        draw.text((margin_left, curr_y), title, font=title_font, fill="#666666")
        curr_y += int(55 * scale)

    # 3. 氏名
    if name:
        if name_kana:
            kana_font = get_font(font_path, int(26 * scale), font_type)
            draw.text((margin_left, curr_y), name_kana, font=kana_font, fill="#888888")
            curr_y += int(38 * scale)

        name_font = get_font(font_path, int(96 * scale), font_type)
        draw.text((margin_left, curr_y), name, font=name_font, fill="#111111")
        curr_y += int(130 * scale)

    # ビジネススタイルの場合のライン
    if style in ["business", "modern"]:
        line_y = curr_y - int(20 * scale)
        draw.line(
            [(margin_left, line_y), (card_w - int(140 * scale), line_y)],
            fill=theme_color,
            width=max(2, int(4 * scale)),
        )
        curr_y += int(20 * scale)

    # 4. 連絡先情報
    info_font = get_font(font_path, int(30 * scale), font_type)
    contact_items = []
    if tel: contact_items.append(f"TEL: {tel}")
    if email: contact_items.append(f"Mail: {email}")
    if url: contact_items.append(f"Web: {url}")
    if address: contact_items.append(f"Add: {address}")

    info_y = max(curr_y, card_h - int(60 * scale) - len(contact_items) * int(46 * scale))
    for item in contact_items:
        draw.text((margin_left, info_y), item, font=info_font, fill="#333333")
        info_y += int(46 * scale)

    # 5. QRコード
    target_qr = qr_data or url
    if target_qr and HAS_QRCODE:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=max(1, int(7 * scale)),
            border=1,
        )
        qr.add_data(target_qr)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
        qr_size = qr_img.size[0]
        card.paste(qr_img, (card_w - qr_size - int(120 * scale), card_h - qr_size - int(100 * scale)))

    return card


def save_result(img: Image.Image, output_path: str, dpi: int = DEFAULT_DPI, also_pdf: bool = False):
    """画像またはPDFとして保存"""
    p = Path(output_path)
    p.parent.mkdir(parents=True, exist_ok=True)
    
    # 拡張子の判定
    if p.suffix.lower() == ".pdf":
        img.save(p, "PDF", resolution=float(dpi))
        print(f"[OK] はがき印刷用PDFを保存しました: {p}")
    else:
        # PNG/JPG等の画像
        img.save(p, dpi=(dpi, dpi))
        print(f"[OK] はがき印刷用画像を保存しました: {p}")
        if also_pdf:
            pdf_path = p.with_suffix(".pdf")
            img.save(pdf_path, "PDF", resolution=float(dpi))
            print(f"[OK] 同時生成PDFを保存しました: {pdf_path}")


def start_web_server(port: int = 8080):
    """Web GUI用のローカルサーバーを起動"""
    web_dir = Path(__file__).resolve().parent / "web"
    os.chdir(web_dir)
    handler = http.server.SimpleHTTPRequestHandler

    # アドレス再利用を許可し、マルチスレッド対応
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer(("", port), handler) as httpd:
        url = f"http://localhost:{port}/index.html"
        print("=" * 60)
        print("  📇 Webブラウザ版 名刺ジェネレーターを起動しました")
        print(f"  URL: {url}")
        print("  ブラウザで上記のURLを開いてください。")
        print("  （終了するには Ctrl+C を押してください）")
        print("=" * 60)
        if os.environ.get("DISPLAY"):
            try:
                webbrowser.open(url)
            except Exception:
                pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nサーバーを停止しました。")


# ==========================================
# CLIコマンドハンドラ
# ==========================================
def main():
    parser = argparse.ArgumentParser(
        description="コンビニはがき印刷用 名刺2面付けツール (Hagaki Meishi Maker)"
    )
    subparsers = parser.add_subparsers(dest="command", help="実行モード")

    # 1. layout: 既存画像の配置モード
    layout_parser = subparsers.add_parser("layout", help="既存の名刺画像をはがきに2面配置する")
    layout_parser.add_argument("--card", "-c", help="名刺画像ファイル（上下両方に同じ画像を配置）")
    layout_parser.add_argument("--top", "-t", help="上段の名刺画像ファイル")
    layout_parser.add_argument("--bottom", "-b", help="下段の名刺画像ファイル")
    layout_parser.add_argument("--output", "-o", default="output/hagaki_meishi.png", help="出力ファイルパス (PNG/JPG/PDF)")
    layout_parser.add_argument("--dpi", type=int, default=DEFAULT_DPI, help="解数度DPI (デフォルト: 600)")
    layout_parser.add_argument("--gap", type=float, default=0.0, help="名刺間の間隔mm (デフォルト: 0.0mm 接合)")
    layout_parser.add_argument("--rotate-180", action="store_true", help="裏面印刷用: 180度回転して出力（コンビニ機の給紙ズレ相殺用）")
    layout_parser.add_argument("--show-border", action="store_true", help="名刺の輪郭に薄いガイド枠線を描画する")
    layout_parser.add_argument("--center-vertical", action="store_true", help="郵便番号枠回避を行わず上下均等に配置する")
    layout_parser.add_argument("--pdf", action="store_true", help="PDFも同時に出力する")

    # 2. create: 文字入力から新規作成モード
    create_parser = subparsers.add_parser("create", help="文字情報を入力して名刺を自動作成＆はがき配置する")
    create_parser.add_argument("--name", "-n", required=True, help="氏名 (例: 山田 太郎)")
    create_parser.add_argument("--kana", default="", help="ふりがな / ローマ字 (例: Taro Yamada)")
    create_parser.add_argument("--company", default="", help="会社名 / 屋号 / 所属")
    create_parser.add_argument("--title", default="", help="肩書 / 役職 (例: 代表 / エンジニア)")
    create_parser.add_argument("--tel", default="", help="電話番号")
    create_parser.add_argument("--email", default="", help="メールアドレス")
    create_parser.add_argument("--url", default="", help="WebサイトURL / SNSリンク")
    create_parser.add_argument("--address", default="", help="住所")
    create_parser.add_argument("--style", default="business", choices=["business", "center", "modern", "stylish"], help="デザインスタイル (デフォルト: business 左揃えビジネス)")
    create_parser.add_argument("--color", default="#2B5B84", help="アクセントカラーのHEX値 (例: #2B5B84)")
    create_parser.add_argument("--output", "-o", default="output/hagaki_meishi.png", help="出力ファイルパス")
    create_parser.add_argument("--dpi", type=int, default=DEFAULT_DPI, help="解像度DPI (デフォルト: 600)")
    create_parser.add_argument("--gap", type=float, default=0.0, help="名刺間の間隔mm (デフォルト: 0.0mm)")
    create_parser.add_argument("--show-border", action="store_true", help="名刺の輪郭に薄いガイド枠線を描画する")
    create_parser.add_argument("--center-vertical", action="store_true", help="郵便番号枠回避を行わず上下均等に配置する")
    create_parser.add_argument("--save-card-only", action="store_true", help="はがき配置だけでなく名刺単体画像も保存する")
    create_parser.add_argument("--pdf", action="store_true", help="PDFも同時に出力する")

    # 3. web: Webブラウザ版GUIサーバーの起動
    web_parser = subparsers.add_parser("web", help="Webブラウザ版 GUIツールを起動する")
    web_parser.add_argument("--port", "-p", type=int, default=8080, help="ポート番号 (デフォルト: 8080)")

    # 3. interactive: 対話モード (引数なし時)
    args = parser.parse_args()

    # コマンド未指定時は対話形式で案内
    if not args.command:
        print("=" * 60)
        print("  コンビニはがき印刷用 名刺ジェネレーター (Hagaki Meishi)")
        print("  はがき1枚に名刺2枚を中央配置し、切り取り線（トンボ）付きで出力")
        print("=" * 60)
        print("1: 手持ちの名刺画像をはがきに2枚並べる (layout)")
        print("2: 文字を入力して名刺を新規作成してはがきに並べる (create)")
        print("3: Web画面（ブラウザで編集＆プレビュー）の起動方法を表示")
        print("q: 終了")
        print("-" * 60)
        choice = input("選択してください (1/2/3/q): ").strip()

        if choice == "1":
            card_path = input("名刺の画像ファイルパスを入力してください: ").strip()
            if not os.path.exists(card_path):
                print(f"エラー: ファイルが見つかりません: {card_path}")
                return
            is_back = input("裏面印刷用データですか？(180度回転してズレを防止しますか) [y/N]: ").strip().lower() == "y"
            show_b = input("カッター用ガイド枠線（薄い線）を表示しますか？ [y/N]: ").strip().lower() == "y"
            out_file = input("出力ファイル名 (デフォルト: output/hagaki_meishi.png): ").strip() or "output/hagaki_meishi.png"

            # 実行
            os.makedirs(os.path.dirname(os.path.abspath(out_file)), exist_ok=True)
            card_img = Image.open(card_path)
            res = create_hagaki_layout(card_img, dpi=DEFAULT_DPI, rotate_180=is_back, show_border=show_b)
            res.save(out_file, dpi=(DEFAULT_DPI, DEFAULT_DPI))
            print(f"\n[OK] 保存完了: {out_file}")
            print_conveni_tips()
            return

        elif choice == "2":
            name = input("氏名 (必須): ").strip()
            if not name:
                print("氏名は必須です。")
                return
            kana = input("ふりがな / ローマ字: ").strip()
            company = input("会社名 / 屋号 / 所属: ").strip()
            title = input("肩書 / 役職: ").strip()
            tel = input("電話番号: ").strip()
            email = input("メールアドレス: ").strip()
            url = input("Webサイト / SNS / URL: ").strip()
            out_file = input("出力ファイル名 (デフォルト: output/hagaki_meishi.png): ").strip() or "output/hagaki_meishi.png"

            os.makedirs(os.path.dirname(os.path.abspath(out_file)), exist_ok=True)
            card_img = generate_card_design(
                name=name, name_kana=kana, company=company, title=title,
                tel=tel, email=email, url=url, dpi=DEFAULT_DPI
            )
            res = create_hagaki_layout(card_img, dpi=DEFAULT_DPI)
            res.save(out_file, dpi=(DEFAULT_DPI, DEFAULT_DPI))
            print(f"\n[OK] 保存完了: {out_file}")
            print_conveni_tips()
            return

        elif choice == "3":
            start_web_server()
            return
        else:
            return

    # コマンド実行
    if args.command == "web":
        start_web_server(port=args.port)
        return

    if args.command == "layout":
        top_img_path = args.top or args.card
        bot_img_path = args.bottom or args.card
        if not top_img_path:
            print("エラー: --card または --top を指定してください。")
            sys.exit(1)

        top_img = Image.open(top_img_path)
        bot_img = Image.open(bot_img_path) if bot_img_path else top_img

        res = create_hagaki_layout(
            top_img, bot_img,
            dpi=args.dpi,
            gap_mm=args.gap,
            rotate_180=args.rotate_180,
            show_border=args.show_border,
            avoid_postal=not args.center_vertical,
        )
        save_result(res, args.output, dpi=args.dpi, also_pdf=args.pdf)
        print_conveni_tips()

    elif args.command == "create":
        card_img = generate_card_design(
            name=args.name,
            name_kana=args.kana,
            company=args.company,
            title=args.title,
            tel=args.tel,
            email=args.email,
            url=args.url,
            address=args.address,
            style=args.style,
            theme_color=args.color,
            dpi=args.dpi,
        )

        if args.save_card_only:
            card_only_path = str(Path(args.output).with_name("card_single.png"))
            card_img.save(card_only_path, dpi=(args.dpi, args.dpi))
            print(f"[OK] 名刺単体画像: {card_only_path}")

        res = create_hagaki_layout(
            card_img,
            dpi=args.dpi,
            gap_mm=args.gap,
            show_border=args.show_border,
            avoid_postal=not args.center_vertical,
        )
        save_result(res, args.output, dpi=args.dpi, also_pdf=args.pdf)
        print_conveni_tips()


def print_conveni_tips():
    print("""
------------------------------------------------------------
【セブン-イレブンでの印刷手順】
1. アプリ「セブン-イレブン マルチコピー」をスマホにインストール
2. 作成した画像をスマホの写真アプリに保存
3. アプリで [はがきプリント] → [そのままプリント] を選択
4. 画像を選択し、プリント設定を行う:
   ★ 重要: 「ちょっと小さめ」は【OFF（そのまま）】にする！
5. マルチコピー機で「はがきプリント」を選び、QRコードを読ませて印刷
   ※ 用紙はセブン備え付けの私製はがき、または持ち込みはがきを使用
------------------------------------------------------------
""")


def print_web_guide():
    print("""
------------------------------------------------------------
【Webブラウザ版 GUIツールのご案内】
リアルタイムプレビューを見ながら名刺を作成・配置できる
Webツールが `web/index.html` に用意されています。

ブラウザで直接開くか、以下のコマンドでローカルサーバーを起動してください:
  cd web && python3 -m http.server 8080
ブラウザで http://localhost:8080 を開くと、画面上で直感的に名刺を作成できます！
------------------------------------------------------------
""")


if __name__ == "__main__":
    main()
