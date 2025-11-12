#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
체크리스트 컴팩트화
1. info-box 제거하고 progress 영역에 통합
2. checklist-item 높이 축소
"""

import os
import re

def compact_checklist(filepath):
    """체크리스트를 더 컴팩트하게 수정"""

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. info-box 제거
    info_box_pattern = r'\s*<div class="info-box">.*?</div>\s*'
    content = re.sub(info_box_pattern, '\n', content, flags=re.DOTALL)

    # 2. progress-text 뒤에 간단한 안내 추가
    progress_text_pattern = r'(<div class="progress-text" id="progressText">.*?</div>)'

    def add_info_to_progress(match):
        progress_div = match.group(0)
        # progress-text 뒤에 작은 안내 텍스트 추가
        return progress_div + '\n            <p class="progress-info"><i class="fas fa-info-circle"></i> 체크하면 브라우저에 저장됩니다</p>'

    content = re.sub(progress_text_pattern, add_info_to_progress, content)

    # 3. CSS 스타일 수정
    # checklist-item padding 축소: 20px → 12px
    content = content.replace(
        '.checklist-item {display: flex;align-items: flex-start;gap: 15px;padding: 20px;',
        '.checklist-item {display: flex;align-items: flex-start;gap: 12px;padding: 12px 16px;'
    )

    # progress-info 스타일 추가 (작고 회색)
    progress_bar_style = '.progress-text {text-align: center;font-weight: 600;color: var(--primary-color);margin-top: 10px;font-size: 1.1rem;}'
    new_progress_styles = '''.progress-text {text-align: center;font-weight: 600;color: var(--primary-color);margin-top: 10px;font-size: 1.1rem;}
        .progress-info {text-align: center;font-size: 0.85rem;color: var(--gray-color);margin-top: 8px;font-weight: 400;}'''

    content = content.replace(progress_bar_style, new_progress_styles)

    # section-title margin 축소
    content = content.replace(
        '.section-title {font-size: 1.5rem;font-weight: 700;color: var(--dark-color);margin-bottom: 20px;',
        '.section-title {font-size: 1.5rem;font-weight: 700;color: var(--dark-color);margin-bottom: 15px;'
    )

    # checklist-item margin 축소
    content = content.replace(
        'margin-bottom: 15px;background:',
        'margin-bottom: 10px;background:'
    )

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True

    return False

def main():
    """모든 체크리스트 HTML 파일 컴팩트화"""

    print("=" * 70)
    print("Checklist Compactification")
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

            if compact_checklist(filepath):
                print("[OK] Compacted")
                updated_files += 1
            else:
                print("[SKIP] No changes")

    print(f"\n{'=' * 70}")
    print("Complete!")
    print(f"{'=' * 70}")
    print(f"\nFiles updated: {updated_files}/13")
    print("\nChanges:")
    print("  1. Removed separate info-box")
    print("  2. Added compact info text below progress bar")
    print("  3. Reduced checklist-item padding: 20px → 12px")
    print("  4. Reduced item spacing: 15px → 10px")
    print("  5. Optimized margins throughout")

if __name__ == '__main__':
    main()
