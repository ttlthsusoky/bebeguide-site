#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bebeguide Complete Performance Comparison
Before -> After Images -> Final (with minification)
"""

import json

def compare_all():
    """Compare all three performance reports"""

    # Load reports
    with open('lighthouse-report.report.json', 'r', encoding='utf-8') as f:
        before = json.load(f)

    with open('lighthouse-after.report.json', 'r', encoding='utf-8') as f:
        after_images = json.load(f)

    with open('lighthouse-final.report.json', 'r', encoding='utf-8') as f:
        final = json.load(f)

    print("=" * 80)
    print("Bebeguide Complete Performance Journey")
    print("=" * 80)

    # Overall scores
    before_score = int(before['categories']['performance']['score'] * 100)
    after_images_score = int(after_images['categories']['performance']['score'] * 100)
    final_score = int(final['categories']['performance']['score'] * 100)

    print(f"\n[Performance Score Evolution]")
    print(f"Stage 1 (Before):          {before_score}/100")
    print(f"Stage 2 (After Images):    {after_images_score}/100 ({after_images_score - before_score:+d})")
    print(f"Stage 3 (Final + Minify):  {final_score}/100 ({final_score - after_images_score:+d})")
    print(f"\nTotal Improvement:         {final_score - before_score:+d} points")

    if final_score >= 90:
        print("Final Status: EXCELLENT (Green)")
    elif final_score >= 50:
        print("Final Status: NEEDS IMPROVEMENT (Orange)")
    else:
        print("Final Status: POOR (Red)")

    # Core Web Vitals comparison
    print(f"\n[Core Web Vitals Journey]")

    metrics = {
        'first-contentful-paint': 'FCP',
        'largest-contentful-paint': 'LCP',
        'total-blocking-time': 'TBT',
        'cumulative-layout-shift': 'CLS',
        'speed-index': 'Speed Index'
    }

    for key, name in metrics.items():
        if key in before['audits']:
            before_val = before['audits'][key].get('displayValue', 'N/A')
            after_val = after_images['audits'][key].get('displayValue', 'N/A')
            final_val = final['audits'][key].get('displayValue', 'N/A')

            # Clean for Windows console
            before_clean = str(before_val).encode('ascii', 'ignore').decode('ascii')
            after_clean = str(after_val).encode('ascii', 'ignore').decode('ascii')
            final_clean = str(final_val).encode('ascii', 'ignore').decode('ascii')

            print(f"\n  {name}:")
            print(f"    Before:       {before_clean}")
            print(f"    After Images: {after_clean}")
            print(f"    Final:        {final_clean}")

    # Page size comparison
    print(f"\n[Page Size Evolution]")

    before_size = before['audits']['total-byte-weight'].get('numericValue', 0)
    after_images_size = after_images['audits']['total-byte-weight'].get('numericValue', 0)
    final_size = final['audits']['total-byte-weight'].get('numericValue', 0)

    print(f"Before:       {before_size/1024/1024:.2f} MB")
    print(f"After Images: {after_images_size/1024/1024:.2f} MB ({(before_size - after_images_size)/1024:.1f} KB saved)")
    print(f"Final:        {final_size/1024/1024:.2f} MB ({(after_images_size - final_size)/1024:.1f} KB saved)")
    print(f"\nTotal Saved:  {(before_size - final_size)/1024:.1f} KB ({(before_size - final_size)/before_size*100:.1f}%)")

    # Summary of optimizations
    print(f"\n[Optimizations Applied]")
    print(f"\n1. JavaScript Modularization")
    print(f"   - Split 3,031 lines into 7 modules")
    print(f"   - Improved maintainability")

    print(f"\n2. CSS Optimization")
    print(f"   - Added 10 color variables")
    print(f"   - Unified border-radius and transitions")
    print(f"   - Added 8 utility classes")

    print(f"\n3. Image Optimization (WebP)")
    print(f"   - PNG -> WebP conversion")
    print(f"   - Saved 373.8 KB (95.8% reduction)")

    print(f"\n4. CSS/JavaScript Minification")
    print(f"   - CSS: 24.0% reduction (18.9 KB)")
    print(f"   - JS: 26.7% reduction (24.5 KB)")
    print(f"   - Total: 43.4 KB saved")

    print(f"\n5. Resource Loading")
    print(f"   - Preconnect for CDN resources")
    print(f"   - Font Awesome deferred loading")

    print(f"\n{'=' * 80}")
    print("Complete Performance Analysis!")
    print(f"{'=' * 80}\n")

if __name__ == '__main__':
    compare_all()
