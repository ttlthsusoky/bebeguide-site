#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bebeguide Performance Report Generator
Lighthouse JSON 분석 및 성능 리포트 생성
"""

import json

def analyze_lighthouse_report():
    """Lighthouse 리포트 분석"""

    with open('lighthouse-report.report.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 성능 점수
    categories = data['categories']
    performance = categories['performance']

    # Core Web Vitals
    audits = data['audits']

    print("=" * 70)
    print("Bebeguide Performance Analysis Report")
    print("=" * 70)

    # 1. Overall Performance Score
    print(f"\n[Performance Score]")
    score = performance['score']
    score_pct = int(score * 100) if score else 0
    print(f"Overall: {score_pct}/100")

    if score_pct >= 90:
        print("Status: EXCELLENT (Green)")
    elif score_pct >= 50:
        print("Status: NEEDS IMPROVEMENT (Orange)")
    else:
        print("Status: POOR (Red)")

    # 2. Core Web Vitals
    print(f"\n[Core Web Vitals]")

    metrics = {
        'first-contentful-paint': 'FCP (First Contentful Paint)',
        'largest-contentful-paint': 'LCP (Largest Contentful Paint)',
        'total-blocking-time': 'TBT (Total Blocking Time)',
        'cumulative-layout-shift': 'CLS (Cumulative Layout Shift)',
        'speed-index': 'Speed Index'
    }

    for key, name in metrics.items():
        if key in audits:
            audit = audits[key]
            value = audit.get('numericValue')
            display = audit.get('displayValue', 'N/A')
            score = audit.get('score', 0)
            score_pct = int(score * 100) if score else 0

            # Clean display value for Windows console
            display_clean = str(display).encode('ascii', 'ignore').decode('ascii')
            if key == 'cumulative-layout-shift':
                print(f"  {name}: {display_clean} (Score: {score_pct})")
            else:
                print(f"  {name}: {display_clean} (Score: {score_pct})")

    # 3. Opportunities (개선 기회)
    print(f"\n[Improvement Opportunities]")

    opportunities = [
        'render-blocking-resources',
        'unused-css-rules',
        'unused-javascript',
        'modern-image-formats',
        'offscreen-images',
        'unminified-css',
        'unminified-javascript',
        'efficient-animated-content'
    ]

    opportunity_list = []

    for key in opportunities:
        if key in audits:
            audit = audits[key]
            if audit.get('score', 1) < 1:  # Not perfect score
                savings = audit.get('details', {}).get('overallSavingsMs', 0)
                if savings > 0:
                    title = audit.get('title', key)
                    opportunity_list.append({
                        'title': title,
                        'savings': savings,
                        'description': audit.get('description', '')
                    })

    # Sort by savings (highest first)
    opportunity_list.sort(key=lambda x: x['savings'], reverse=True)

    if opportunity_list:
        for i, opp in enumerate(opportunity_list[:5], 1):  # Top 5
            print(f"\n  {i}. {opp['title']}")
            print(f"     Potential savings: {opp['savings']/1000:.2f}s")
    else:
        print("  No major opportunities detected!")

    # 4. Diagnostics
    print(f"\n[Diagnostics]")

    # Network payloads
    if 'total-byte-weight' in audits:
        audit = audits['total-byte-weight']
        size = audit.get('numericValue', 0)
        print(f"  Total page size: {size/1024/1024:.2f} MB")

    # DOM size
    if 'dom-size' in audits:
        audit = audits['dom-size']
        elements = audit.get('numericValue', 0)
        print(f"  DOM elements: {int(elements)}")

    # Main thread work
    if 'mainthread-work-breakdown' in audits:
        audit = audits['mainthread-work-breakdown']
        time = audit.get('numericValue', 0)
        print(f"  Main thread work: {time/1000:.2f}s")

    print(f"\n{'=' * 70}")
    print("Analysis Complete!")
    print(f"{'=' * 70}\n")

    # Save summary to file
    summary = {
        'performance_score': score_pct,
        'opportunities': len(opportunity_list),
        'top_improvements': [opp['title'] for opp in opportunity_list[:3]]
    }

    with open('performance-summary.json', 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print("Summary saved to: performance-summary.json")
    print("Full HTML report: lighthouse-report.report.html\n")

if __name__ == '__main__':
    analyze_lighthouse_report()
