#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
베베가이드 JavaScript 모듈 분할 스크립트
script.js (3,031줄)를 7개 모듈로 자동 분할
"""

import os
import re

def split_javascript_modules():
    """script.js를 7개 모듈로 분할"""

    # 원본 파일 읽기
    with open('js/script.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # 줄 단위로 분리
    lines = content.split('\n')

    # ============ 1. main.js: UI, Navigation, Animations ============
    main_js = []
    current_line = 0

    # Lines 0-439: UI, navigation, animations
    main_js = lines[0:440]

    # 육아 팁 카드 펼치기 기능 추가 (lines 1768-1796)
    main_js.append('\n// === 육아 팁 카드 펼치기 기능 === //')
    main_js.extend(lines[1768:1797])

    main_js.append('\nconsole.log("🍼 베베가이드 main.js 로드 완료");')

    # ============ 2. data.js: All Data Constants ============
    data_js = []
    data_js.append('// 베베가이드 데이터 상수')
    data_js.append('// 임신 준비, 육아 체크리스트, 예방접종 스케줄, 돌봄 가이드\n')

    # Lines 440-865: PREGNANCY_PREP, NEWBORN_CARE, VACCINATION_SCHEDULE, CHECKLIST
    data_js.extend(lines[440:866])

    data_js.append('\nconsole.log("🍼 베베가이드 data.js 로드 완료");')

    # ============ 3. checklist.js: Checklist & Vaccination ============
    checklist_js = []
    checklist_js.append('// 베베가이드 체크리스트 및 예방접종 관리\n')

    # Lines 866-1302: Checklist functions (챗봇 제외)
    checklist_js.extend(lines[866:1303])

    # Lines 1578-1767: Vaccination schedule
    checklist_js.extend(lines[1578:1768])

    checklist_js.append('\nconsole.log("🍼 베베가이드 checklist.js 로드 완료");')

    # ============ 4. chart.js: Growth Chart ============
    chart_js = []
    chart_js.append('// 베베가이드 성장 그래프 기능\n')

    # Lines 1798-2205: Growth chart
    chart_js.extend(lines[1798:2206])

    chart_js.append('\nconsole.log("🍼 베베가이드 chart.js 로드 완료");')

    # ============ 5. diary.js: Baby Diary ============
    diary_js = []
    diary_js.append('// 베베가이드 내 아기 다이어리 기능\n')

    # Lines 2206-2689: Baby diary
    diary_js.extend(lines[2206:2690])

    diary_js.append('\nconsole.log("🍼 베베가이드 diary.js 로드 완료");')

    # ============ 6. timer.js: Feeding & Meal Timers + Bedtime Checklist ============
    timer_js = []
    timer_js.append('// 베베가이드 타이머 시스템 (수유, 이유식, 취침 체크리스트)\n')

    # Lines 2690-3030: Timers and bedtime checklist
    timer_js.extend(lines[2690:])

    timer_js.append('\nconsole.log("🍼 베베가이드 timer.js 로드 완료");')

    # ============ 7. chatbot.js: AI Chatbot ============
    chatbot_js = []
    chatbot_js.append('// 베베가이드 AI 챗봇\n')

    # Lines 1303-1577: Chatbot code
    chatbot_js.extend(lines[1303:1578])

    chatbot_js.append('\nconsole.log("🍼 베베가이드 chatbot.js 로드 완료");')

    # ============ 파일 저장 ============
    modules = {
        'js/main.js': main_js,
        'js/data.js': data_js,
        'js/checklist.js': checklist_js,
        'js/chart.js': chart_js,
        'js/diary.js': diary_js,
        'js/timer.js': timer_js,
        'js/chatbot.js': chatbot_js
    }

    for filename, content_lines in modules.items():
        with open(filename, 'w', encoding='utf-8') as f:
            f.write('\n'.join(content_lines))
        print(f'[OK] {filename} created ({len(content_lines)} lines)')

    print(f'\n[SUCCESS] 7 modules created!')
    print(f'Original: {len(lines)} lines -> Split: {sum(len(m) for m in modules.values())} lines')

if __name__ == '__main__':
    split_javascript_modules()
