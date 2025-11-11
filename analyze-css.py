#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
베베가이드 CSS 분석 도구
중복 스타일, 미사용 스타일, 변수화 가능한 값 탐지
"""

import re
from collections import defaultdict, Counter

def analyze_css():
    """CSS 파일 분석 및 최적화 기회 탐지"""

    with open('css/styles.css', 'r', encoding='utf-8') as f:
        css_content = f.read()

    print("=" * 60)
    print("Bebeguide CSS Analysis Report")
    print("=" * 60)

    # 1. Basic stats
    lines = css_content.split('\n')
    total_lines = len(lines)
    print(f"\n[Basic Info]")
    print(f"Total lines: {total_lines:,}")

    # 2. 색상 분석 (하드코딩된 색상 찾기)
    color_patterns = [
        r'#[0-9a-fA-F]{3,6}',  # Hex colors
        r'rgb\([^)]+\)',        # RGB
        r'rgba\([^)]+\)',       # RGBA
    ]

    colors = []
    for pattern in color_patterns:
        colors.extend(re.findall(pattern, css_content))

    color_freq = Counter(colors)

    print(f"\n[Color Analysis]")
    print(f"Total color usage: {len(colors)}")
    print(f"Unique colors: {len(color_freq)}")
    print(f"\nMost used colors (Top 10):")
    for color, count in color_freq.most_common(10):
        if count >= 3:
            print(f"  {color}: {count}x -> CSS variable candidate")

    # 3. 중복 속성 패턴 찾기
    # 자주 반복되는 스타일 패턴
    common_patterns = {
        'display: flex': css_content.count('display: flex'),
        'border-radius:': css_content.count('border-radius:'),
        'box-shadow:': css_content.count('box-shadow:'),
        'transition:': css_content.count('transition:'),
        'padding:': css_content.count('padding:'),
        'margin:': css_content.count('margin:'),
    }

    print(f"\n[Common Properties]")
    for prop, count in sorted(common_patterns.items(), key=lambda x: x[1], reverse=True):
        print(f"  {prop} {count}x")

    # 4. Media queries
    media_queries = re.findall(r'@media[^{]+', css_content)
    print(f"\n[Responsive Design]")
    print(f"Media queries: {len(media_queries)}")

    # 5. 폰트 크기 분석
    font_sizes = re.findall(r'font-size:\s*([^;]+);', css_content)
    font_size_freq = Counter(font_sizes)
    print(f"\n[Font Size Usage]")
    print(f"Unique font sizes: {len(font_size_freq)}")
    if len(font_size_freq) > 15:
        print(f"  [WARNING] Too many font sizes (15+)")
        print(f"  -> Typography system recommended")

    # 6. Optimization summary
    print(f"\n{'=' * 60}")
    print("Optimization Opportunities")
    print(f"{'=' * 60}")

    optimization_score = 0
    recommendations = []

    # Color variables
    hardcoded_colors = sum(1 for count in color_freq.values() if count >= 3)
    if hardcoded_colors > 0:
        recommendations.append(f"+ Extract {hardcoded_colors} colors to CSS variables")
        optimization_score += hardcoded_colors * 10

    # Border-radius
    border_radius_values = re.findall(r'border-radius:\s*([^;]+);', css_content)
    unique_radius = len(set(border_radius_values))
    if unique_radius > 5:
        recommendations.append(f"+ Unify border-radius ({unique_radius} -> 3-5 recommended)")
        optimization_score += 20

    # Box-shadow
    box_shadows = re.findall(r'box-shadow:\s*([^;]+);', css_content)
    unique_shadows = len(set(box_shadows))
    if unique_shadows > 5:
        recommendations.append(f"+ Unify box-shadow ({unique_shadows} -> 3-5 recommended)")
        optimization_score += 15

    # Transitions
    if common_patterns['transition:'] > 50:
        recommendations.append(f"+ Unify transition with CSS variable ({common_patterns['transition:']}x used)")
        optimization_score += 10

    print(f"\nOptimization score: {optimization_score}")
    print(f"Expected reduction: ~{optimization_score * 2}-{optimization_score * 3} lines\n")

    for rec in recommendations:
        print(rec)

    # 7. Duplicate patterns
    print(f"\n{'=' * 60}")
    print("Duplicate Pattern Samples")
    print(f"{'=' * 60}")

    # Flex center pattern
    flex_center_pattern = r'display:\s*flex;[\s\S]*?justify-content:\s*center;[\s\S]*?align-items:\s*center;'
    flex_centers = re.findall(flex_center_pattern, css_content)
    if len(flex_centers) > 3:
        print(f"\nFlex center pattern: {len(flex_centers)}x found")
        print("-> Create .flex-center utility class")

    # Shadow patterns
    if unique_shadows > 3:
        print(f"\nDifferent box-shadows: {unique_shadows}")
        print("-> Use --shadow-sm, --shadow, --shadow-lg variables")

    return {
        'total_lines': total_lines,
        'colors': len(color_freq),
        'optimization_score': optimization_score,
        'recommendations': recommendations
    }

if __name__ == '__main__':
    result = analyze_css()
    print(f"\n{'=' * 60}")
    print("Analysis Complete!")
    print(f"{'=' * 60}\n")
