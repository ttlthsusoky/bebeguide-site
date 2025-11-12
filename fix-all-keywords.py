#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
베베가이드 쿠팡 키워드 전체 수정
HTML 파일의 잘못된/일반적인 키워드를 국민템 제품명으로 최적화
"""

import os
import re

# 키워드 매핑: 기존 검색어 → 최적화된 검색어 (국민템)
KEYWORD_MAP = {
    # === 0m.html - 이미 최적화됨, 스킵 ===

    # === 1m.html (10개) ===
    "기저귀 소형": "하기스 매직컴포트 소형",
    "수유쿠션": "마이크로비즈 수유쿠션",
    "신생아 손톱깎이": "피죤 아기 손톱깎이",
    "배앓이 복대": "위드맘 베이비 배앓이 복대",
    "신생아 아기띠": "에르고베이비 신생아 아기띠",
    "아기 외출용 담요": "에이든아네이 외출용 담요",
    "젖병 보온포트": "티피유 젖병 보온포트",
    "아기 침구 세트": "베베원 신생아 침구 세트",
    "유축기": "메델라 유축기",
    "수유패드": "피죤 유기농 수유패드",

    # === 2m.html (10개) ===
    "기저귀 중형": "하기스 매직컴포트 중형",
    "아기 목 받침 쿠션": "베이비모스 목 받침 쿠션",
    "흑백 대비 카드": "타이니러브 흑백 카드",
    "베이비 바스": "베이비바스 욕조",
    "베이비 샴푸": "베베숲 샴푸",
    "아기 마사지 오일": "뮤스텔라 마사지 오일",
    "기저귀 가방": "쥬쥬비 기저귀 가방",
    "카시트": "조이 카시트",
    "가습기": "위닉스 가습기",
    "아기 딸랑이": "피셔프라이스 딸랑이",

    # === 3m.html (10개) ===
    "기저귀 중형 5-9kg용, 활동량 증가": "하기스 매직컴포트 중형",
    "턱받이 여러 개 침 많이 흘림 시기": "베베드피노 실리콘 턱받이",
    "침대 모빌 시각·청각 발달": "타이니러브 모빌",
    "콧물 흡입기 감기 예방 시즌": "노즈프리다 코흡입기",
    "손싸개/발싸개 긁힘 방지, 선택사항": "오가닉 손싸개 발싸개",
    "수면 조끼 이불 대신 안전하게": "버튼스 슬리핑조끼",
    "딸랑이 장난감 쥐기 연습": "피셔프라이스 딸랑이",
    "예방접종 수첩 접종 기록 관리": "예방접종 수첩",
    "헝겊책 촉각 자극": "베베루 헝겊책",
    "백색소음기 수면 루틴": "화이트노이즈 사운드머신",

    # === 4m.html (8개) ===
    "중형 지속 사용": "하기스 매직컴포트 중형",
    "or 안전가드": "범퍼침대 안전가드",
    "실리콘": "소피 기린 치발기",
    "전용 물티슈": "좋은느낌 물티슈",
    "유모차": "아이엔베이 유모차",
    "차단 모자": "베베드핀 자외선차단 모자",
    "발달 장난감": "피셔프라이스 발달 장난감",
    "안전 손목밴드": "미아방지 손목밴드",

    # === 5m.html (8개) ===
    "대형 교체 고려": "하기스 매직컴포트 대형",
    "식탁의자 준비": "범보 베이비시트",
    "준비 도구들": "도이 이유식기 세트",
    "수저 세트": "에디슨 실리콘 수저",
    # "베베드피노 실리콘 턱받이": 이미 최적화됨
    "알레르기 체크 노트": "이유식 알레르기 노트",
    "치발기 다양하게": "소피 기린 치발기",
    "안전한 재질": "실리콘 이유식기",

    # === 6m.html (8개) ===
    "이유식용": "도이 이유식 식기",
    "조리도구 세트": "이유식 조리도구 세트",
    "미끄럼방지": "에디슨 미끄럼방지 식기",
    "스푼 BPA프리": "에디슨 실리콘 스푼",
    # "알집매트": 이미 최적화됨
    "냉동보관용기": "BPA프리 냉동 보관용기",
    "앞치마": "베베드피노 방수 앞치마",
    "보조 유산균": "비오가이아 프로텍티스 유산균",

    # === 7m.html (8개) ===
    "대형 7-12kg용": "하기스 매직컴포트 대형",
    "이유식 도구": "도이 이유식기",
    "흘림방지": "베베드피노 실리콘 턱받이",
    "안전용품": "리틀캐빈 안전문",
    "보호대": "키즈퍼스트 모서리 보호대",
    "안전잠금장치": "베이비안전 잠금장치",
    "장난감": "피셔프라이스 장난감",
    "운동복": "베베숲 유아 운동복",

    # === 8m.html (8개) ===
    "쉬운 장난감들": "피셔프라이스 블록 장난감",
    "무릎보호대": "아기 무릎 보호대",
    "계단, 방문": "리틀캐빈 안전문",
    "안전커버": "콘센트 안전커버",
    "전용 칫솔": "조던 스텝1 칫솔",
    "치약": "조던 유아용 치약",
    "발달 놀이용품": "피셔프라이스 발달 놀이용품",
    "간식통": "유아 간식통",

    # === 9m.html (8개) ===
    "서기 보조 용품": "보행기 보조 용품",
    # "키즈퍼스트 모서리 보호대": 이미 최적화됨
    "신발 실내용": "아식스 아이다호 베이비",
    "조절 식탁의자": "범보 베이비시트",
    "준비용품": "유아 준비용품",
    "가위 안전형": "안전 유아용 가위",
    "장난감": "메가블럭",
    "체크 일지": "성장 발달 체크 일지",

    # === 10m.html (8개) ===
    "보조기구": "보행보조기",
    "실외화 첫 신발": "아식스 아이다호 베이비",
    "걸음마용": "걸음마 보조기",
    "계단 가드": "리틀캐빈 계단 안전문",
    "변환 침대": "유아 변환 침대",
    "및 언어발달 도서": "베이비올 전집",
    "무게 가벼운": "경량 유아 물통",
    "키트": "위급상황 구급 키트",

    # === 11m.html (8개) ===
    "연습 공간 확보": "알집매트",
    "활동용 모자": "유아 활동용 모자",
    "베이비 전용": "베이비 전용 선크림",
    "발달 놀이기구": "피셔프라이스 놀이기구",
    "자극 장난감": "감각 발달 장난감",
    "두꺼운 보드북": "베이비올 보드북",
    "식탁의자": "범보 베이비시트",
    "관리용품 업그레이드": "유아 관리용품",

    # === 12m.html (8개) ===
    "준비용품": "돌잔치 준비용품",
    "보호대 추가 설치": "키즈퍼스트 모서리 보호대",
    "무게 있는 것": "유아 공",
    "식기 세트": "에디슨 유아식기",
    "도서 5-10권": "베이비올 전집",
    "놀이 세트": "블록 놀이 세트",
    "장난감": "메가블럭",
    "기록 앨범": "성장 앨범",
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
        old_keyword_encoded = match.group(1)

        # URL 디코딩 (공백은 %20 또는 +로 인코딩됨)
        old_keyword = old_keyword_encoded.replace('+', ' ').replace('%20', ' ')

        # 키워드 매핑에서 찾기
        if old_keyword in KEYWORD_MAP:
            new_keyword = KEYWORD_MAP[old_keyword]
            new_keyword_encoded = new_keyword.replace(' ', '+')
            updates += 1
            print(f"    [OK] {old_keyword} -> {new_keyword}")
            return match.group(0).replace(f'q={old_keyword_encoded}', f'q={new_keyword_encoded}')

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
    print("Bebeguide Comprehensive Keyword Optimization")
    print("=" * 70)
    print()

    checklist_dir = 'checklist'
    total_updates = 0
    files_updated = 0

    # 0m.html ~ 12m.html 파일 처리
    for month in range(13):
        filename = f'{month}m.html'
        filepath = os.path.join(checklist_dir, filename)

        if os.path.exists(filepath):
            print(f"Processing {filename}...")

            if month == 0:
                print("  [SKIP] 0m.html is already optimized")
                continue

            updates = update_html_file(filepath)
            if updates > 0:
                print(f"  [SUCCESS] {updates} keywords updated\n")
                total_updates += updates
                files_updated += 1
            else:
                print(f"  [WARNING] No keywords to update\n")

    print(f"\n{'=' * 70}")
    print("Optimization Complete!")
    print(f"{'=' * 70}")
    print(f"\n[STATISTICS]:")
    print(f"  - Files updated: {files_updated}/12")
    print(f"  - Keywords optimized: {total_updates}")
    print(f"  - Success rate: {(total_updates/102*100):.1f}%")

if __name__ == '__main__':
    main()
