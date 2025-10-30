#!/usr/bin/env python3
"""
SVG to PNG Converter for Bebeguide Images
100% 저작권 침해 없는 자체 제작 이미지
"""

try:
    from PIL import Image
    from cairosvg import svg2png
    import os

    # 경로 설정
    base_dir = r"C:\Users\hee\website\images"

    print("🎨 베베가이드 이미지 변환 시작...")

    # 1. Favicon 변환 (512x512)
    print("\n1️⃣ Favicon 변환 중...")
    svg_path = os.path.join(base_dir, "favicon.svg")
    png_path = os.path.join(base_dir, "favicon-512.png")

    svg2png(url=svg_path, write_to=png_path, output_width=512, output_height=512)
    print(f"   ✅ 생성 완료: {png_path}")

    # 2. OG Image 변환 (1200x630)
    print("\n2️⃣ OG Image 변환 중...")
    svg_path = os.path.join(base_dir, "og-bebeguide.svg")
    png_path = os.path.join(base_dir, "og-bebeguide.png")

    svg2png(url=svg_path, write_to=png_path, output_width=1200, output_height=630)
    print(f"   ✅ 생성 완료: {png_path}")

    print("\n✨ 모든 이미지 변환 완료!")
    print("📜 저작권: 100% 자체 제작 (SVG 코드로 직접 생성)")
    print("🔒 상업 이용: 가능 (베베가이드 소유)")

except ImportError as e:
    print("⚠️ 필요한 라이브러리 설치 중...")
    print("다음 명령어를 실행하세요:")
    print("pip install pillow cairosvg")
    print(f"\n에러: {e}")

except Exception as e:
    print(f"❌ 에러 발생: {e}")
    print("\n대안: 온라인 SVG to PNG 변환기 사용")
    print("1. https://cloudconvert.com/svg-to-png")
    print("2. https://svgtopng.com")
    print("3. Inkscape (무료 소프트웨어)")
