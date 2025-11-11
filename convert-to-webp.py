#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bebeguide Image Optimization Script
PNG/JPG -> WebP conversion with quality optimization
"""

import os
from PIL import Image

def convert_to_webp():
    """Convert PNG/JPG images to WebP format"""

    images_dir = 'images'
    conversions = []

    print("=" * 60)
    print("Bebeguide Image Optimization - WebP Conversion")
    print("=" * 60)

    # Find all PNG and JPG files
    for filename in os.listdir(images_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            input_path = os.path.join(images_dir, filename)

            # Skip if already converted
            webp_filename = os.path.splitext(filename)[0] + '.webp'
            output_path = os.path.join(images_dir, webp_filename)

            if os.path.exists(output_path):
                print(f"\n[SKIP] {filename} (WebP already exists)")
                continue

            # Get original file size
            original_size = os.path.getsize(input_path)

            try:
                # Open and convert image
                img = Image.open(input_path)

                # Convert RGBA to RGB if necessary (for PNG with transparency)
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background

                # Save as WebP with optimization
                # Quality 80-85 is good balance between size and quality
                img.save(output_path, 'WebP', quality=85, method=6)

                # Get new file size
                webp_size = os.path.getsize(output_path)
                reduction = ((original_size - webp_size) / original_size) * 100

                conversions.append({
                    'original': filename,
                    'webp': webp_filename,
                    'original_size': original_size,
                    'webp_size': webp_size,
                    'reduction': reduction
                })

                print(f"\n[OK] {filename}")
                print(f"     Original: {original_size/1024:.1f} KB")
                print(f"     WebP: {webp_size/1024:.1f} KB")
                print(f"     Reduction: {reduction:.1f}%")

            except Exception as e:
                print(f"\n[ERROR] {filename}: {str(e)}")

    # Summary
    print(f"\n{'=' * 60}")
    print("Conversion Summary")
    print(f"{'=' * 60}")

    if conversions:
        total_original = sum(c['original_size'] for c in conversions)
        total_webp = sum(c['webp_size'] for c in conversions)
        total_reduction = ((total_original - total_webp) / total_original) * 100

        print(f"\nTotal files converted: {len(conversions)}")
        print(f"Total original size: {total_original/1024:.1f} KB")
        print(f"Total WebP size: {total_webp/1024:.1f} KB")
        print(f"Total reduction: {total_reduction:.1f}%")
        print(f"Saved: {(total_original - total_webp)/1024:.1f} KB")
    else:
        print("\nNo new conversions needed!")

    print(f"\n{'=' * 60}\n")

if __name__ == '__main__':
    convert_to_webp()
