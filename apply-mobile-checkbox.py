#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
모바일 체크박스 크기 적용
@media 쿼리에 14px 추가
"""

import os
import re

def apply_mobile_checkbox(filepath):
    """미디어 쿼리에 모바일 체크박스 스타일 추가"""

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 패턴: @media (max-width: 768px) {...} 안에 체크박스 스타일이 없는 경우
    # .item-text {font-size: 1rem;}} 를 찾아서
    # .item-text {font-size: 1rem;}.checkbox-wrapper input[type="checkbox"] {width: 14px;height: 14px;}} 로 변경

    pattern = r'(\.item-text \{font-size: 1rem;\}\})'
    replacement = r'.item-text {font-size: 1rem;}.checkbox-wrapper input[type="checkbox"] {width: 14px;height: 14px;}}'

    # @media 쿼리 내부에서만 변경되도록 확인
    if '@media (max-width: 768px)' in content:
        # 체크박스 스타일이 이미 있는지 확인
        if 'width: 14px;height: 14px;' not in content:
            content = re.sub(pattern, replacement, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True

    return False

def main():
    """모든 체크리스트 HTML 파일 처리"""

    print("=" * 70)
    print("Applying Mobile Checkbox Size (14px) to All Files")
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

            if apply_mobile_checkbox(filepath):
                print("[OK] Mobile style added")
                updated_files += 1
            else:
                print("[SKIP] Already has mobile style")

    print(f"\n{'=' * 70}")
    print("Complete!")
    print(f"{'=' * 70}")
    print(f"\nFiles updated: {updated_files}/13")

if __name__ == '__main__':
    main()
