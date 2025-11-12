#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
베베가이드 쿠팡 키워드 현황 분석
"""

import os
import re
from urllib.parse import unquote_plus

def analyze_html_file(filepath):
    """HTML 파일의 쿠팡 검색 키워드 추출"""

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 쿠팡 URL 패턴: q=검색어&subid=...
    pattern = r'https://www\.coupang\.com/np/search\?q=([^&]+)&subid='
    matches = re.findall(pattern, content)

    # URL 디코딩
    keywords = [unquote_plus(match) for match in matches]

    return keywords

def main():
    """모든 체크리스트 HTML 파일 분석"""

    print("=" * 70)
    print("Bebeguide Coupang Keyword Analysis")
    print("=" * 70)

    checklist_dir = 'checklist'
    all_keywords = {}

    # 0m.html ~ 12m.html 파일 처리
    for month in range(13):
        filename = f'{month}m.html'
        filepath = os.path.join(checklist_dir, filename)

        if os.path.exists(filepath):
            keywords = analyze_html_file(filepath)
            all_keywords[filename] = keywords

            print(f"\n{filename} ({len(keywords)} keywords):")
            for i, kw in enumerate(keywords, 1):
                # 최적화 여부 판단 (브랜드명 포함 여부)
                is_optimized = any(brand in kw for brand in [
                    '하기스', '에이든', '베베', '브라운', '닥터브라운', '하님', '비판텐',
                    '피죤', '세타필', '타이니러브', '피셔프라이스', '알집매트',
                    '소피', '에르고베이비', '도이', '범보', '꼬마빌', '스토케',
                    '리틀캐빈', '키즈퍼스트', '콤비', '유아이키', '아식스', '좋은느낌',
                    '베이비올', '베이비콜라', '에듀테', '메가블럭', '에디슨', '조던'
                ])
                status = "[OK]" if is_optimized else "[--]"
                print(f"  {i}. {status} {kw}")

    # 통계
    print(f"\n{'=' * 70}")
    print("Statistics")
    print(f"{'=' * 70}")

    total_keywords = sum(len(kws) for kws in all_keywords.values())
    optimized_keywords = sum(
        1 for kws in all_keywords.values()
        for kw in kws
        if any(brand in kw for brand in [
            '하기스', '에이든', '베베', '브라운', '닥터브라운', '하님', '비판텐',
            '피죤', '세타필', '타이니러브', '피셔프라이스', '알집매트',
            '소피', '에르고베이비', '도이', '범보', '꼬마빌', '스토케',
            '리틀캐빈', '키즈퍼스트', '콤비', '유아이키', '아식스', '좋은느낌',
            '베이비올', '베이비콜라', '에듀테', '메가블럭', '에디슨', '조던'
        ])
    )

    print(f"\nTotal keywords: {total_keywords}")
    print(f"Optimized keywords: {optimized_keywords}")
    print(f"Not optimized: {total_keywords - optimized_keywords}")
    print(f"Optimization rate: {optimized_keywords / total_keywords * 100:.1f}%")

if __name__ == '__main__':
    main()
