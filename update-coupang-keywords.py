#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
베베가이드 쿠팡 검색 키워드 최적화
제목 그대로 검색 → 국민템/추천 제품명으로 개선
"""

import os
import re

# 키워드 매핑: 기존 검색어 → 최적화된 검색어 (국민템)
KEYWORD_MAP = {
    # 0개월 (신생아)
    "신생아 기저귀": "하기스 매직팬티 신생아",
    "속싸개": "에이든아네이 모슬린 속싸개",
    "배냇저고리": "베베원 배냇저고리",
    "아기 체온계": "브라운 체온계 IRT6520",
    "신생아 젖병": "닥터브라운 신생아 젖병",
    "젖병 소독기": "하님 UV 젖병소독기",
    "기저귀 발진 크림": "비판텐 연고",

    # 1개월
    "아기 목욕용품": "베베숲 목욕용품 세트",
    "보습 로션": "세타필 베이비 로션",
    "손톱깎이": "피죤 아기 손톱깎이",

    # 2개월
    "흑백 모빌": "타이니러브 모빌",
    "턱받이": "베베드피노 실리콘 턱받이",

    # 3개월
    "놀이매트": "알집매트",
    "딸랑이": "피셔프라이스 딸랑이",

    # 4개월
    "치발기": "소피 기린 치발기",
    "아기띠": "에르고베이비 아기띠",

    # 5개월
    "이유식 식기": "도이 이유식기",
    "아기 의자": "범보 베이비시트",

    # 6개월
    "빨대컵": "꼬마빌 빨대컵",
    "욕조": "스토케 플렉시배스",

    # 7개월
    "안전문": "리틀캐빈 안전문",
    "모서리 보호대": "키즈퍼스트 모서리 보호대",

    # 8개월
    "보행기": "콤비 보행기",
    "장난감 정리함": "유아이키 정리함",

    # 9개월
    "신발": "아식스 아이다호 베이비",
    "물티슈": "좋은느낌 아기물티슈",

    # 10개월
    "그림책": "베이비올 전집",
    "크레용": "베이비콜라 크레용",

    # 11개월
    "퍼즐": "에듀테 원목 퍼즐",
    "블록": "메가블럭",

    # 12개월
    "유아식 식기": "에디슨 유아식기",
    "칫솔": "조던 스텝1 칫솔",
}

def update_html_file(filepath):
    """HTML 파일의 쿠팡 검색 키워드 업데이트"""

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    updates = 0

    # 쿠팡 URL 패턴: q=검색어&subid=...
    pattern = r'https://www\.coupang\.com/np/search\?q=([^&]+)&subid='

    def replace_keyword(match):
        nonlocal updates
        old_keyword = match.group(1)

        # URL 디코딩 (공백은 %20 또는 +로 인코딩됨)
        old_keyword_decoded = old_keyword.replace('+', ' ').replace('%20', ' ')

        # 키워드 매핑에서 찾기
        if old_keyword_decoded in KEYWORD_MAP:
            new_keyword = KEYWORD_MAP[old_keyword_decoded]
            new_keyword_encoded = new_keyword.replace(' ', '+')
            updates += 1
            return match.group(0).replace(f'q={old_keyword}', f'q={new_keyword_encoded}')

        return match.group(0)

    content = re.sub(pattern, replace_keyword, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return updates

    return 0

def main():
    """모든 체크리스트 HTML 파일 업데이트"""

    print("=" * 70)
    print("Bebeguide Coupang Keyword Optimization")
    print("=" * 70)

    checklist_dir = 'checklist'
    total_updates = 0
    files_updated = 0

    # 0m.html ~ 12m.html 파일 처리
    for month in range(13):
        filename = f'{month}m.html'
        filepath = os.path.join(checklist_dir, filename)

        if os.path.exists(filepath):
            updates = update_html_file(filepath)
            if updates > 0:
                print(f"\n[OK] {filename}: {updates} keywords updated")
                total_updates += updates
                files_updated += 1
            else:
                print(f"[SKIP] {filename}: no keywords to update")

    print(f"\n{'=' * 70}")
    print("Optimization Complete!")
    print(f"{'=' * 70}")
    print(f"\nTotal files updated: {files_updated}")
    print(f"Total keywords optimized: {total_updates}")
    print(f"\nKeywords changed:")
    for old, new in list(KEYWORD_MAP.items())[:10]:
        print(f"  {old} -> {new}")
    print(f"  ... and {len(KEYWORD_MAP) - 10} more")

if __name__ == '__main__':
    main()
