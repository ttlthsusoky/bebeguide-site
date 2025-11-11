#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
베베가이드 CSS 자동 최적화 도구
- 색상 변수화
- border-radius 통일
- box-shadow 통일
- transition 변수화
- 유틸리티 클래스 추가
"""

import re
from collections import Counter

def optimize_css():
    """CSS 파일 최적화"""

    with open('css/styles.css', 'r', encoding='utf-8') as f:
        css_content = f.read()

    print("=" * 60)
    print("CSS Optimization Started")
    print("=" * 60)

    original_lines = len(css_content.split('\n'))
    print(f"\nOriginal: {original_lines} lines")

    # ==================== 1. 색상 변수 추가 ====================
    print("\n[Step 1] Extracting color variables...")

    # 자주 사용되는 색상 찾기
    color_patterns = [
        r'#[0-9a-fA-F]{3,6}',
        r'rgb\([^)]+\)',
        r'rgba\([^)]+\)',
    ]

    colors = []
    for pattern in color_patterns:
        colors.extend(re.findall(pattern, css_content))

    color_freq = Counter(colors)

    # 3회 이상 사용된 색상만 변수화
    frequent_colors = {color: count for color, count in color_freq.items() if count >= 3}

    # 기존 변수 섹션 찾기
    root_section = re.search(r'(:root\s*\{[^}]+\})', css_content, re.DOTALL)

    if root_section and frequent_colors:
        existing_root = root_section.group(1)

        # 새로운 색상 변수 생성
        new_color_vars = []
        color_var_map = {}

        # 이미 정의된 색상은 제외
        for i, (color, count) in enumerate(sorted(frequent_colors.items(), key=lambda x: x[1], reverse=True)[:20], 1):
            # 변수 이름 생성 (간단하게)
            if color.startswith('#'):
                var_name = f'--color-{i}'
            elif 'rgba' in color:
                var_name = f'--color-rgba-{i}'
            else:
                var_name = f'--color-rgb-{i}'

            new_color_vars.append(f'    {var_name}: {color};')
            color_var_map[color] = f'var({var_name})'

        # :root에 새 변수 추가
        if new_color_vars:
            # 기존 :root 마지막 }를 찾아서 그 전에 추가
            new_vars_text = '\n    /* Optimized color variables */\n' + '\n'.join(new_color_vars[:10])  # 상위 10개만
            updated_root = existing_root.replace('}', f'{new_vars_text}\n}}')
            css_content = css_content.replace(existing_root, updated_root)

            print(f"  + Added {min(10, len(new_color_vars))} color variables")

    # ==================== 2. border-radius 통일 ====================
    print("\n[Step 2] Unifying border-radius...")

    # 가장 많이 사용되는 border-radius 찾기
    radius_pattern = r'border-radius:\s*([^;]+);'
    radius_values = re.findall(radius_pattern, css_content)
    radius_freq = Counter(radius_values)

    # 표준 값으로 통일
    radius_map = {
        'small': '8px',
        'medium': '12px',
        'large': '16px',
        'xl': '20px',
        'full': '50%'
    }

    # 가장 많이 사용되는 3개 값을 기준으로 매핑
    top_radius = radius_freq.most_common(5)
    for value, count in top_radius:
        # 픽셀 값에 따라 자동 매핑
        if 'px' in value:
            px_val = int(re.search(r'(\d+)', value).group(1))
            if px_val <= 6:
                standard = radius_map['small']
            elif px_val <= 14:
                standard = radius_map['medium']
            elif px_val <= 18:
                standard = radius_map['large']
            else:
                standard = radius_map['xl']

            if value != standard and count >= 3:
                css_content = css_content.replace(f'border-radius: {value}', f'border-radius: var(--border-radius)')
                print(f"  + Unified: {value} -> var(--border-radius) ({count}x)")

    # ==================== 3. box-shadow 통일 ====================
    print("\n[Step 3] Unifying box-shadow...")

    # 기존에 정의된 --shadow 변수 활용
    # 복잡한 box-shadow는 그대로 두고, 간단한 것만 변수로 교체
    simple_shadows = [
        r'box-shadow:\s*0\s+10px\s+25px\s+rgba\(0,\s*0,\s*0,\s*0\.1\)',
        r'box-shadow:\s*0\s+10px\s+25px\s+rgba\(0,\s*0,\s*0,\s*0\.10\)',
    ]

    for pattern in simple_shadows:
        matches = re.findall(pattern, css_content)
        if matches:
            css_content = re.sub(pattern, 'box-shadow: var(--shadow)', css_content)
            print(f"  + Replaced {len(matches)} shadow instances with var(--shadow)")

    # ==================== 4. transition 변수화 ====================
    print("\n[Step 4] Unifying transitions...")

    # 가장 많이 사용되는 transition
    transition_pattern = r'transition:\s*([^;]+);'
    transitions = re.findall(transition_pattern, css_content)
    transition_freq = Counter(transitions)

    # all 0.3s ease를 변수로
    common_transition = 'all 0.3s ease'
    if common_transition in transition_freq:
        count = transition_freq[common_transition]
        css_content = css_content.replace(f'transition: {common_transition}', 'transition: var(--transition)')
        print(f"  + Replaced {count} transitions with var(--transition)")

    # ==================== 5. 유틸리티 클래스 추가 ====================
    print("\n[Step 5] Adding utility classes...")

    utility_classes = """
/* Utility Classes (Auto-generated) */
.flex-center {
    display: flex;
    justify-content: center;
    align-items: center;
}

.flex-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.text-center {
    text-align: center;
}

.shadow {
    box-shadow: var(--shadow);
}

.shadow-hover:hover {
    box-shadow: var(--shadow-hover);
}

.rounded {
    border-radius: var(--border-radius);
}

.transition {
    transition: var(--transition);
}
"""

    # 파일 끝에 유틸리티 클래스 추가 (중복 체크)
    if '.flex-center' not in css_content:
        css_content += '\n' + utility_classes
        print("  + Added 8 utility classes")

    # ==================== 결과 저장 ====================
    optimized_lines = len(css_content.split('\n'))
    reduction = original_lines - optimized_lines
    reduction_pct = (reduction / original_lines * 100) if reduction > 0 else 0

    with open('css/styles.css', 'w', encoding='utf-8') as f:
        f.write(css_content)

    print(f"\n{'=' * 60}")
    print("Optimization Complete!")
    print(f"{'=' * 60}")
    print(f"\nOriginal: {original_lines} lines")
    print(f"Optimized: {optimized_lines} lines")
    print(f"Reduction: {reduction} lines ({reduction_pct:.1f}%)")
    print(f"\nOptimized file saved: css/styles.css")

if __name__ == '__main__':
    optimize_css()
