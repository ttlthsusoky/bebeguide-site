#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
모바일 체크박스 크기 최적화
데스크톱: 16px, 모바일: 14px
"""

import os
import re

def add_mobile_checkbox_style(filepath):
    """HTML 파일에 모바일 체크박스 스타일 추가"""

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 기존 미디어 쿼리 찾기
    media_query_pattern = r'(@media \(max-width: 768px\) \{[^}]+\})'

    # 미디어 쿼리 안에 체크박스 스타일이 있는지 확인
    if 'checkbox-wrapper input[type="checkbox"]' in content and '@media (max-width: 768px)' in content:
        # 이미 모바일 스타일이 있는지 확인
        if '.checkbox-wrapper input[type="checkbox"]' not in re.search(r'@media \(max-width: 768px\) \{[^}]+\}', content).group(0):
            # 미디어 쿼리 내용 업데이트
            def add_checkbox_to_media_query(match):
                media_content = match.group(0)
                # } 바로 앞에 체크박스 스타일 추가
                updated = media_content.replace('}', '.checkbox-wrapper input[type="checkbox"] {width: 14px;height: 14px;}}')
                return updated

            content = re.sub(r'@media \(max-width: 768px\) \{[^}]+\}', add_checkbox_to_media_query, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True

    return False

def main():
    """모든 체크리스트 HTML 파일에 모바일 체크박스 스타일 추가"""

    print("=" * 70)
    print("Mobile Checkbox Optimization: Desktop 16px → Mobile 14px")
    print("=" * 70)
    print()

    checklist_dir = 'checklist'
    updated_files = 0

    # 0m.html ~ 12m.html 파일 처리
    for month in range(13):
        filename = f'{month}m.html'
        filepath = os.path.join(checklist_dir, filename)

        if os.path.exists(filepath):
            print(f"Processing {filename}...", end=" ")

            if add_mobile_checkbox_style(filepath):
                print("[OK] Mobile checkbox style added (14px)")
                updated_files += 1
            else:
                print("[SKIP] No changes needed")

    print(f"\n{'=' * 70}")
    print("Optimization Complete!")
    print(f"{'=' * 70}")
    print(f"\nFiles updated: {updated_files}/13")
    print("\nCheckbox sizes:")
    print("  - Desktop/Tablet: 16px")
    print("  - Mobile (<768px): 14px")

if __name__ == '__main__':
    main()
