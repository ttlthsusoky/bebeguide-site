#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
월령별 체크리스트 HTML 페이지 자동 생성 스크립트
"""

# 월령별 데이터
CHECKLIST_DATA = {
    3: {
        "items": [
            "🍼 기저귀 중형 (5-9kg용, 활동량 증가)",
            "🍽️ 턱받이 여러 개 (침 많이 흘림 시기)",
            "🎵 침대 모빌 (시각·청각 발달)",
            "👃 콧물 흡입기 (감기 예방 시즌)",
            "🧤 손싸개/발싸개 (긁힘 방지, 선택사항)",
            "🛏️ 수면 조끼 (이불 대신 안전하게)",
            "🧸 딸랑이 장난감 (쥐기 연습)",
            "💉 예방접종 수첩 (접종 기록 관리)",
            "📚 헝겊책 (촉각 자극)",
            "🎶 백색소음기 (수면 루틴)"
        ],
        "vaccination": [
            "<strong>DTaP (디프테리아/파상풍/백일해)</strong> - 2차",
            "<strong>IPV (소아마비)</strong> - 2차",
            "<strong>Hib</strong> - 2차",
            "<strong>PCV (폐렴구균)</strong> - 2차",
            "<strong>RV (로타바이러스)</strong> - 2차 (선택)"
        ],
        "tip": "3개월은 백신 추가접종 시기입니다. 예방접종 수첩을 잘 관리하세요."
    },
    4: {
        "items": [
            "기저귀 중형 지속 사용",
            "범퍼침대 or 안전가드",
            "치아발육기 (실리콘)",
            "아기 전용 물티슈",
            "외출용 유모차",
            "자외선 차단 모자",
            "소근육 발달 장난감",
            "아기 안전 손목밴드"
        ],
        "vaccination": [
            "<strong>DTaP</strong> - 3차",
            "<strong>IPV</strong> - 3차",
            "<strong>Hib</strong> - 3차",
            "<strong>PCV</strong> - 3차"
        ],
        "tip": "4개월은 기본 백신 3차 접종 시기입니다."
    },
    5: {
        "items": [
            "기저귀 대형 교체 고려",
            "아기 식탁의자 준비",
            "이유식 준비 도구들",
            "실리콘 수저 세트",
            "흘림방지 턱받이",
            "식품 알레르기 체크 노트",
            "아기 치발기 다양하게",
            "놀이매트 (안전한 재질)"
        ],
        "vaccination": [
            "<strong>B형간염</strong> - 3차 (6개월 전 완료)"
        ],
        "tip": "5개월부터 이유식 준비를 시작하는 시기입니다."
    },
    6: {
        "items": [
            "하이체어 (이유식용)",
            "이유식 조리도구 세트",
            "흡착식판 (미끄럼방지)",
            "실리콘 스푼 (BPA프리)",
            "바닥 놀이매트",
            "이유식 냉동보관용기",
            "아기 앞치마",
            "소화기능 보조 유산균"
        ],
        "vaccination": [
            "<strong>B형간염</strong> - 3차 (6개월에 완료)",
            "<strong>일본뇌염</strong> - 1-2차 (생백신 or 사백신)"
        ],
        "tip": "6개월은 이유식 본격 시작 시기입니다. B형간염 3차 접종을 완료하세요."
    },
    7: {
        "items": [
            "기저귀 대형 (7-12kg용)",
            "셀프 이유식 도구",
            "물컵 (흘림방지)",
            "기어다니기 안전용품",
            "모서리 보호대",
            "서랍 안전잠금장치",
            "두뇌발달 장난감",
            "아기 운동복"
        ],
        "vaccination": [],
        "tip": "7개월은 기어다니기 시작하는 시기입니다. 집안 안전 점검을 철저히 하세요."
    },
    8: {
        "items": [
            "잡기 쉬운 장난감들",
            "크롤링 무릎보호대",
            "안전문 (계단, 방문)",
            "콘센트 안전커버",
            "아기 전용 칫솔",
            "무불소 치약",
            "소근육 발달 놀이용품",
            "외출용 간식통"
        ],
        "vaccination": [],
        "tip": "8개월은 크롤링이 활발해지는 시기입니다. 안전용품을 준비하세요."
    },
    9: {
        "items": [
            "잡고 서기 보조 용품",
            "테이블 모서리 보호대",
            "아기 신발 (실내용)",
            "높이 조절 식탁의자",
            "핑거푸드 준비용품",
            "아기 가위 (안전형)",
            "목욕 장난감",
            "발달 체크 일지"
        ],
        "vaccination": [],
        "tip": "9개월은 잡고 서기를 시작하는 시기입니다. 안전하게 연습할 수 있는 환경을 만드세요."
    },
    10: {
        "items": [
            "걸음마 보조기구",
            "아기 실외화 (첫 신발)",
            "무릎보호대 (걸음마용)",
            "안전한 계단 가드",
            "높낮이 변환 침대",
            "소통 및 언어발달 도서",
            "빨대컵 (무게 가벼운)",
            "응급처치 키트"
        ],
        "vaccination": [],
        "tip": "10개월은 걸음마 준비 시기입니다. 안전한 환경을 만들어주세요."
    },
    11: {
        "items": [
            "걸음마 연습 공간 확보",
            "실외 활동용 모자",
            "선크림 (베이비 전용)",
            "대근육 발달 놀이기구",
            "언어 자극 장난감",
            "그림책 (두꺼운 보드북)",
            "유아용 식탁의자",
            "치아 관리용품 업그레이드"
        ],
        "vaccination": [],
        "tip": "11개월은 걸음마가 본격화되는 시기입니다. 실외 활동을 준비하세요."
    },
    12: {
        "items": [
            "돌잔치 준비용품",
            "코너 보호대 추가 설치",
            "빨대컵 (무게 있는 것)",
            "유아식 식기 세트",
            "소형 도서 5-10권",
            "블록 놀이 세트",
            "역할놀이 장난감",
            "성장 기록 앨범"
        ],
        "vaccination": [
            "<strong>MMR (홍역/유행성이하선염/풍진)</strong> - 1차",
            "<strong>수두</strong> - 1차",
            "<strong>일본뇌염</strong> - 3차 (사백신의 경우)"
        ],
        "tip": "12개월(돌)은 중요한 예방접종 시기입니다. MMR과 수두 접종을 꼭 받으세요."
    }
}

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{month}개월 아기 필수 준비물 체크리스트 | 베베가이드</title>
    <meta name="description" content="{month}개월 아기에게 꼭 필요한 필수 준비물 체크리스트. 안전하고 검증된 제품을 확인하세요.">
    <link rel="icon" type="image/png" sizes="512x512" href="/images/favicon-512.png">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {{margin: 0;padding: 0;box-sizing: border-box;}}
        :root {{--primary-color: #FF8E8E;--primary-light: #FFB3B3;--secondary-color: #ffd3a5;--accent-color: #a8e6cf;--dark-color: #1f2937;--gray-color: #6b7280;--light-bg: #fff8f0;--white: #ffffff;--shadow: 0 4px 6px rgba(0, 0, 0, 0.1);--shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.1);}}
        body {{font-family: 'Noto Sans KR', sans-serif;line-height: 1.6;color: var(--dark-color);background: linear-gradient(135deg, #fff8f0 0%, #ffe8e8 100%);min-height: 100vh;}}
        .container {{max-width: 900px;margin: 0 auto;padding: 20px;}}
        header {{background: var(--white);padding: 30px;border-radius: 16px;box-shadow: var(--shadow-lg);margin-bottom: 30px;text-align: center;}}
        .logo {{font-size: 1.5rem;font-weight: 700;color: var(--primary-color);margin-bottom: 20px;display: flex;align-items: center;justify-content: center;gap: 10px;}}
        h1 {{font-size: 2rem;color: var(--dark-color);margin-bottom: 10px;font-weight: 700;}}
        .subtitle {{font-size: 1.1rem;color: var(--gray-color);margin-bottom: 20px;}}
        .info-badge {{display: inline-block;background: linear-gradient(135deg, var(--primary-color), var(--primary-light));color: var(--white);padding: 8px 20px;border-radius: 20px;font-size: 0.9rem;font-weight: 500;}}
        .info-box {{background: #e3f2fd;border-left: 4px solid #2196f3;padding: 15px 20px;border-radius: 8px;margin: 20px 0;font-size: 0.95rem;color: #1565c0;}}
        .checklist-section {{background: var(--white);padding: 30px;border-radius: 16px;box-shadow: var(--shadow-lg);margin-bottom: 30px;}}
        .section-title {{font-size: 1.5rem;font-weight: 700;color: var(--dark-color);margin-bottom: 20px;padding-bottom: 15px;border-bottom: 3px solid var(--primary-color);display: flex;align-items: center;gap: 10px;}}
        .checklist-item {{display: flex;align-items: flex-start;gap: 15px;padding: 20px;margin-bottom: 15px;background: var(--light-bg);border-radius: 12px;transition: all 0.3s ease;border: 2px solid transparent;}}
        .checklist-item:hover {{transform: translateX(5px);border-color: var(--primary-light);box-shadow: var(--shadow);}}
        .checklist-item.checked {{opacity: 0.6;background: #f0f0f0;}}
        .checklist-item.checked .item-text {{text-decoration: line-through;color: var(--gray-color);}}
        .checkbox-wrapper {{flex-shrink: 0;margin-top: 2px;}}
        .checkbox-wrapper input[type="checkbox"] {{width: 24px;height: 24px;cursor: pointer;accent-color: var(--primary-color);}}
        .item-content {{flex: 1;}}
        .item-text {{font-size: 1.1rem;font-weight: 500;color: var(--dark-color);margin-bottom: 8px;line-height: 1.5;}}
        .item-link {{display: inline-flex;align-items: center;gap: 5px;color: var(--primary-color);text-decoration: none;font-size: 0.9rem;font-weight: 500;padding: 6px 12px;border-radius: 6px;background: rgba(255, 142, 142, 0.1);transition: all 0.3s ease;}}
        .item-link:hover {{background: var(--primary-color);color: var(--white);transform: translateY(-2px);}}
        .vaccination-info {{background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);padding: 25px;border-radius: 12px;margin-top: 30px;}}
        .vaccination-info h3 {{color: #2e7d32;margin-bottom: 15px;font-size: 1.3rem;}}
        .vaccination-info ul {{list-style: none;padding: 0;}}
        .vaccination-info li {{padding: 10px 0;padding-left: 30px;position: relative;color: #1b5e20;font-weight: 500;}}
        .vaccination-info li::before {{content: "💉";position: absolute;left: 0;}}
        .footer-note {{text-align: center;padding: 20px;color: var(--gray-color);font-size: 0.9rem;}}
        .back-button {{display: inline-flex;align-items: center;gap: 8px;padding: 12px 24px;background: var(--primary-color);color: var(--white);text-decoration: none;border-radius: 10px;font-weight: 500;transition: all 0.3s ease;margin-top: 20px;}}
        .back-button:hover {{background: var(--primary-light);transform: translateY(-2px);box-shadow: var(--shadow);}}
        @media (max-width: 768px) {{h1 {{font-size: 1.5rem;}}.subtitle {{font-size: 1rem;}}.checklist-section {{padding: 20px;}}.item-text {{font-size: 1rem;}}}}
        .progress-bar {{width: 100%;height: 8px;background: #e0e0e0;border-radius: 10px;overflow: hidden;margin: 20px 0;}}
        .progress-fill {{height: 100%;background: linear-gradient(90deg, var(--primary-color), var(--accent-color));width: 0%;transition: width 0.5s ease;border-radius: 10px;}}
        .progress-text {{text-align: center;font-weight: 600;color: var(--primary-color);margin-top: 10px;font-size: 1.1rem;}}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo"><i class="fas fa-baby"></i> 베베가이드</div>
            <h1>{month}개월 아기 필수 준비물 체크리스트</h1>
            <p class="subtitle">{month}개월 아기 성장에 필요한 필수 준비물</p>
            <span class="info-badge">👶 {month}개월</span>
            <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
            <div class="progress-text" id="progressText">준비 완료: 0/{total_items} (0%)</div>
        </header>

        <div class="info-box">
            <i class="fas fa-info-circle"></i>
            <strong>체크박스를 클릭하면 완료 상태가 저장됩니다.</strong> 준비가 끝난 항목을 체크해보세요!
        </div>

        <div class="checklist-section">
            <h2 class="section-title"><i class="fas fa-clipboard-check"></i> 필수 준비물 목록</h2>
{checklist_items}
        </div>

{vaccination_section}

        <div style="text-align: center; margin-top: 40px;">
            <a href="https://be-be-guide.com/#age" class="back-button"><i class="fas fa-home"></i> 베베가이드 홈으로</a>
        </div>

        <div class="footer-note">
            <p>정보 기준일: 2025-10-28 업데이트</p>
            <p style="margin-top: 10px;">이 정보는 일반적인 가이드이며, 개별 상황에 따라 달라질 수 있습니다.</p>
            <p style="margin-top: 5px; color: var(--primary-color); font-weight: 600;">© 2024 베베가이드. All rights reserved.</p>
        </div>
    </div>

    <script>
        const STORAGE_KEY = 'checklist_{month}m';
        const totalItems = {total_items};
        function loadChecklistState() {{const saved = localStorage.getItem(STORAGE_KEY);return saved ? JSON.parse(saved) : {{}};}}
        function saveChecklistState(index, checked) {{const state = loadChecklistState();state[index] = checked;localStorage.setItem(STORAGE_KEY, JSON.stringify(state));updateProgress();}}
        function updateProgress() {{const state = loadChecklistState();const checkedCount = Object.values(state).filter(v => v).length;const percentage = Math.round((checkedCount / totalItems) * 100);document.getElementById('progressFill').style.width = percentage + '%';document.getElementById('progressText').textContent = `준비 완료: ${{checkedCount}}/${{totalItems}} (${{percentage}}%)`;}}
        window.addEventListener('DOMContentLoaded', () => {{const state = loadChecklistState();document.querySelectorAll('.checklist-item').forEach((item, index) => {{const checkbox = item.querySelector('input[type="checkbox"]');const isChecked = state[index] || false;checkbox.checked = isChecked;if (isChecked) {{item.classList.add('checked');}}checkbox.addEventListener('change', (e) => {{const checked = e.target.checked;saveChecklistState(index, checked);if (checked) {{item.classList.add('checked');}} else {{item.classList.remove('checked');}}}});}});updateProgress();}});
    </script>
</body>
</html>
"""

def generate_checklist_items(items):
    """체크리스트 아이템 HTML 생성"""
    html = ""
    for idx, item in enumerate(items):
        # 이모지 제거하고 검색 키워드 생성
        search_keyword = item.split(' ', 1)[1] if ' ' in item else item
        search_keyword = search_keyword.replace('(', '').replace(')', '').strip()

        html += f"""
            <div class="checklist-item" data-index="{idx}">
                <div class="checkbox-wrapper"><input type="checkbox" id="item-{idx}"></div>
                <div class="item-content">
                    <div class="item-text">{item}</div>
                    <a href="https://www.coupang.com/np/search?q={search_keyword}&subid=AF8186321" class="item-link" target="_blank" rel="noopener"><i class="fas fa-shopping-cart"></i> 제품 보러가기</a>
                </div>
            </div>
"""
    return html

def generate_vaccination_section(vaccination_list, tip):
    """예방접종 섹션 HTML 생성"""
    if not vaccination_list:
        return """        <div class="vaccination-info">
            <h3><i class="fas fa-syringe"></i> 예방접종 안내</h3>
            <p style="color:#1b5e20; font-weight:500;">이 시기에는 정기 예방접종이 없습니다.</p>
            <p style="margin-top:15px; font-size:0.9rem; color:#2e7d32;">
                💡 """ + tip + """
            </p>
        </div>"""

    items_html = "\n".join([f"                <li>{item}</li>" for item in vaccination_list])

    return f"""        <div class="vaccination-info">
            <h3><i class="fas fa-syringe"></i> 예방접종 안내 (질병관리청 기준)</h3>
            <ul>
{items_html}
            </ul>
            <p style="margin-top:15px; font-size:0.9rem; color:#2e7d32;">
                💡 {tip}
            </p>
        </div>"""

def generate_html_file(month, data):
    """HTML 파일 생성"""
    checklist_items = generate_checklist_items(data["items"])
    vaccination_section = generate_vaccination_section(data["vaccination"], data["tip"])

    html = HTML_TEMPLATE.format(
        month=month,
        total_items=len(data["items"]),
        checklist_items=checklist_items,
        vaccination_section=vaccination_section
    )

    filename = f"{month}m.html"
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"OK {filename} created!")

if __name__ == "__main__":
    print("Starting HTML generation...\n")

    for month, data in CHECKLIST_DATA.items():
        generate_html_file(month, data)

    print(f"\nTotal {len(CHECKLIST_DATA)} files generated!")
    print("Generated files: 3m.html ~ 12m.html")
