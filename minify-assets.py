#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bebeguide Asset Minification Script
CSS and JavaScript minification without external dependencies
"""

import re
import os

def minify_css(css_content):
    """Simple CSS minification"""

    # Remove comments
    css = re.sub(r'/\*[\s\S]*?\*/', '', css_content)

    # Remove newlines and extra spaces
    css = re.sub(r'\s+', ' ', css)

    # Remove spaces around special characters
    css = re.sub(r'\s*([{}:;,>+~])\s*', r'\1', css)

    # Remove trailing semicolons before }
    css = re.sub(r';\}', '}', css)

    # Remove spaces around parentheses
    css = re.sub(r'\s*\(\s*', '(', css)
    css = re.sub(r'\s*\)\s*', ')', css)

    return css.strip()

def minify_js(js_content):
    """Simple JavaScript minification (safe, no variable renaming)"""

    # Remove single-line comments (but preserve URLs)
    js = re.sub(r'(?<!:)//.*?$', '', js_content, flags=re.MULTILINE)

    # Remove multi-line comments
    js = re.sub(r'/\*[\s\S]*?\*/', '', js)

    # Remove leading/trailing whitespace from each line
    lines = [line.strip() for line in js.split('\n')]
    js = '\n'.join(lines)

    # Remove empty lines
    js = re.sub(r'\n\s*\n', '\n', js)

    # Remove spaces around operators (safe subset)
    js = re.sub(r'\s*([{}();,=])\s*', r'\1', js)

    return js.strip()

def minify_assets():
    """Minify CSS and JavaScript files"""

    print("=" * 70)
    print("Bebeguide Asset Minification")
    print("=" * 70)

    files_processed = []

    # ========== CSS Minification ==========
    print("\n[1] CSS Minification")

    css_file = 'css/styles.css'
    css_min_file = 'css/styles.min.css'

    if os.path.exists(css_file):
        with open(css_file, 'r', encoding='utf-8') as f:
            css_content = f.read()

        original_size = len(css_content)

        # Minify
        minified_css = minify_css(css_content)

        # Save
        with open(css_min_file, 'w', encoding='utf-8') as f:
            f.write(minified_css)

        minified_size = len(minified_css)
        reduction = ((original_size - minified_size) / original_size) * 100

        print(f"  {css_file}")
        print(f"    Original: {original_size/1024:.1f} KB")
        print(f"    Minified: {minified_size/1024:.1f} KB")
        print(f"    Reduction: {reduction:.1f}%")
        print(f"    Saved to: {css_min_file}")

        files_processed.append({
            'file': css_file,
            'original': original_size,
            'minified': minified_size,
            'reduction': reduction
        })

    # ========== JavaScript Minification ==========
    print("\n[2] JavaScript Minification")

    js_files = [
        'js/data.js',
        'js/main.js',
        'js/checklist.js',
        'js/chart.js',
        'js/diary.js',
        'js/timer.js',
        'js/chatbot.js'
    ]

    total_js_original = 0
    total_js_minified = 0

    for js_file in js_files:
        if os.path.exists(js_file):
            with open(js_file, 'r', encoding='utf-8') as f:
                js_content = f.read()

            original_size = len(js_content)

            # Minify
            minified_js = minify_js(js_content)

            # Save
            js_min_file = js_file.replace('.js', '.min.js')
            with open(js_min_file, 'w', encoding='utf-8') as f:
                f.write(minified_js)

            minified_size = len(minified_js)
            reduction = ((original_size - minified_size) / original_size) * 100

            print(f"\n  {js_file}")
            print(f"    Original: {original_size/1024:.1f} KB")
            print(f"    Minified: {minified_size/1024:.1f} KB")
            print(f"    Reduction: {reduction:.1f}%")

            total_js_original += original_size
            total_js_minified += minified_size

            files_processed.append({
                'file': js_file,
                'original': original_size,
                'minified': minified_size,
                'reduction': reduction
            })

    # ========== Summary ==========
    print(f"\n{'=' * 70}")
    print("Minification Summary")
    print(f"{'=' * 70}")

    total_original = sum(f['original'] for f in files_processed)
    total_minified = sum(f['minified'] for f in files_processed)
    total_reduction = ((total_original - total_minified) / total_original) * 100

    print(f"\nTotal files processed: {len(files_processed)}")
    print(f"Total original size: {total_original/1024:.1f} KB")
    print(f"Total minified size: {total_minified/1024:.1f} KB")
    print(f"Total reduction: {total_reduction:.1f}%")
    print(f"Total saved: {(total_original - total_minified)/1024:.1f} KB")

    print(f"\n[Next Steps]")
    print("1. Update index.html to use .min.css and .min.js files")
    print("2. Test the minified files in browser")
    print("3. Run Lighthouse to measure performance improvement")

    print(f"\n{'=' * 70}\n")

if __name__ == '__main__':
    minify_assets()
