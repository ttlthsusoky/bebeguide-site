#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
체크리스트 레이아웃 최적화
1. info-box를 checklist-section 내부로 이동
2. 컴팩트한 레이아웃 적용
"""

import os
import re

def optimize_layout(filepath):
    """체크리스트 레이아웃 최적화"""

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. info-box를 찾아서 제거
    info_box_pattern = r'\s*<div class="info-box">.*?</div>\s*'
    info_box_match = re.search(info_box_pattern, content, re.DOTALL)

    if not info_box_match:
        return False

    info_box_content = info_box_match.group(0).strip()

    # info-box 제거
    content = re.sub(info_box_pattern, '\n', content, flags=re.DOTALL)

    # 2. checklist-section의 section-title 바로 뒤에 info-box 삽입
    section_title_pattern = r'(<h2 class="section-title">.*?</h2>)'

    def insert_info_box(match):
        return match.group(0) + '\n\n            ' + info_box_content

    content = re.sub(section_title_pattern, insert_info_box, content)

    # 3. CSS 스타일 최적화 - container 너비 축소
    # max-width: 900px → 800px
    content = content.replace('.container {max-width: 900px;', '.container {max-width: 800px;')

    # info-box 스타일 개선 - 여백 축소
    content = content.replace(
        '.info-box {background: #e3f2fd;border-left: 4px solid #2196f3;padding: 15px 20px;border-radius: 8px;margin: 20px 0;',
        '.info-box {background: #e3f2fd;border-left: 4px solid #2196f3;padding: 12px 16px;border-radius: 8px;margin: 15px 0 20px 0;'
    )

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True

    return False

def main():
    """모든 체크리스트 HTML 파일 최적화"""

    print("=" * 70)
    print("Checklist Layout Optimization")
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

            if optimize_layout(filepath):
                print("[OK] Layout optimized")
                updated_files += 1
            else:
                print("[SKIP] No changes needed")

    print(f"\n{'=' * 70}")
    print("Optimization Complete!")
    print(f"{'=' * 70}")
    print(f"\nFiles updated: {updated_files}/13")
    print("\nChanges applied:")
    print("  1. Info box moved inside checklist section")
    print("  2. Container width: 900px → 800px")
    print("  3. Reduced unnecessary spacing")

if __name__ == '__main__':
    main()
