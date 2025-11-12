#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
베베가이드 실제 HTML 키워드 추출
"""

import os
import re
import json
from urllib.parse import unquote_plus

def extract_keywords_from_html(filepath):
    """HTML 파일의 실제 쿠팡 검색 키워드 추출"""

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 쿠팡 URL 패턴: q=검색어&subid=...
    pattern = r'https://www\.coupang\.com/np/search\?q=([^&]+)&subid='
    matches = re.findall(pattern, content)

    # URL 디코딩
    keywords = [unquote_plus(match) for match in matches]

    return keywords

def main():
    """모든 체크리스트 HTML 파일에서 키워드 추출"""

    print("=" * 70)
    print("Extracting All Keywords from HTML Files")
    print("=" * 70)

    checklist_dir = 'checklist'
    all_data = {}

    # 0m.html ~ 12m.html 파일 처리
    for month in range(13):
        filename = f'{month}m.html'
        filepath = os.path.join(checklist_dir, filename)

        if os.path.exists(filepath):
            keywords = extract_keywords_from_html(filepath)
            all_data[filename] = keywords

            print(f"\n{filename} - {len(keywords)} keywords:")
            for i, kw in enumerate(keywords, 1):
                print(f"  {i}. {kw}")

    # JSON 파일로 저장
    output_file = 'extracted-keywords.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"\n{'=' * 70}")
    print(f"Keywords saved to: {output_file}")
    print(f"{'=' * 70}")

    # 통계
    total_keywords = sum(len(kws) for kws in all_data.values())
    print(f"\nTotal files: {len(all_data)}")
    print(f"Total keywords: {total_keywords}")

if __name__ == '__main__':
    main()
