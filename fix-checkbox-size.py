#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
체크박스 크기 수정: 24px → 16px
모바일 최적화를 위해 크기 축소
"""

import os
import re

def fix_checkbox_size(filepath):
    """HTML 파일의 체크박스 크기 수정"""

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 체크박스 크기 패턴: width: 24px;height: 24px;
    # → width: 16px;height: 16px;
    pattern = r'\.checkbox-wrapper input\[type="checkbox"\] \{width: 24px;height: 24px;'
    replacement = r'.checkbox-wrapper input[type="checkbox"] {width: 16px;height: 16px;'

    content = re.sub(pattern, replacement, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True

    return False

def main():
    """모든 체크리스트 HTML 파일 수정"""

    print("=" * 70)
    print("Checkbox Size Optimization: 24px → 16px")
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

            if fix_checkbox_size(filepath):
                print("[OK] Checkbox size updated to 16px")
                updated_files += 1
            else:
                print("[SKIP] No changes needed")

    print(f"\n{'=' * 70}")
    print("Optimization Complete!")
    print(f"{'=' * 70}")
    print(f"\nFiles updated: {updated_files}/13")

if __name__ == '__main__':
    main()
