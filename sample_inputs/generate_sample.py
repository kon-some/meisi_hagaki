#!/usr/bin/env python3
"""
テスト用のサンプル名刺画像（表面・裏面）を生成するスクリプト
"""
import sys
from pathlib import Path

# 親ディレクトリをモジュール検索パスに追加
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from meishi_maker import generate_card_design, mm_to_px, CARD_WIDTH_MM, CARD_HEIGHT_MM, DEFAULT_DPI
from PIL import Image, ImageDraw, ImageFont

def make_samples():
    sample_dir = Path(__file__).resolve().parent
    
    # 1. 表面サンプル
    front = generate_card_design(
        name="山田 太郎",
        name_kana="Taro Yamada",
        company="サンプル株式会社",
        title="エンジニア / デザイナー",
        tel="090-1234-5678",
        email="taro@example.com",
        url="https://example.com",
        address="東京都千代田区1-1-1",
        style="modern",
        theme_color="#1E3A8A",
        dpi=DEFAULT_DPI
    )
    front_path = sample_dir / "sample_card_front.png"
    front.save(front_path, dpi=(DEFAULT_DPI, DEFAULT_DPI))
    print(f"作成完了: {front_path}")

    # 2. 裏面サンプル
    w = mm_to_px(CARD_WIDTH_MM, DEFAULT_DPI)
    h = mm_to_px(CARD_HEIGHT_MM, DEFAULT_DPI)
    back = Image.new("RGB", (w, h), (245, 247, 250))
    draw = ImageDraw.Draw(back)
    
    # 中央にロゴや事業内容
    scale = DEFAULT_DPI / 600.0
    font = ImageFont.load_default()
    draw.rectangle([(int(100*scale), int(100*scale)), (w - int(100*scale), h - int(100*scale))], outline="#CBD5E1", width=int(3*scale))
    draw.text((w // 2 - int(200*scale), h // 2 - int(40*scale)), "SAMPLE COMPANY SERVICES", fill="#475569")
    
    back_path = sample_dir / "sample_card_back.png"
    back.save(back_path, dpi=(DEFAULT_DPI, DEFAULT_DPI))
    print(f"作成完了: {back_path}")

if __name__ == "__main__":
    make_samples()
