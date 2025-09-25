"""
Utility script, which removes background from
provided museum pieces

Install following dependencies with anaconda:

  $ conda install -c conda-forge opencv tqdm numpy matplotlib -y
"""

# Imports
import os
import cv2
import numpy as np
import logging
import argparse
from pathlib import Path
from tqdm import tqdm
from threading import Thread


# Setup logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Allowed image extensions
valid_extensions = {".jpg", ".jpeg", ".png"}

# Function to process a single image
def process_image(image_path, output_dir):
    try:
        img = cv2.imread(str(image_path))
        if img is None:
            logging.warning(f"Skipping {image_path.name} (unable to read)")
            return
        img_grayscale = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        x_range = [len(img_grayscale[0])+1, -1]
        y_range = [len(img_grayscale)+1, -1]
        for y in range(len(img_grayscale)):
            for x in range(len(img_grayscale[y])):
                if img_grayscale[y][x] < 127:
                    if y < y_range[0]:
                        y_range[0] = y
                    elif y > y_range[1]:
                        y_range[1] = y
                    if x < x_range[0]:
                        x_range[0] = x
                    elif x > x_range[1]:
                        x_range[1] = x

        # Add additional 3% padding to ranges
        PADDING = 0.03
        y_range[0] = int(max(0, y_range[0] - (y_range[1] - y_range[0]) * PADDING))
        x_range[0] = int(max(0, x_range[0] - (x_range[1] - x_range[0]) * PADDING))
        y_range[1] = int(min(len(img_grayscale), y_range[1] + (y_range[1] - y_range[0]) * PADDING))
        x_range[1] = int(min(len(img_grayscale[0]), x_range[1] + (x_range[1] - x_range[0]) * PADDING))

        roi = img_grayscale[y_range[0]:y_range[1], x_range[0]:x_range[1]]
        rect = (x_range[0], y_range[0], x_range[1] - x_range[0], y_range[1] - y_range[0])

        # Create mask and models
        mask = np.zeros(img.shape[:2], np.uint8)
        bgdModel = np.zeros((1, 65), np.float64)
        fgdModel = np.zeros((1, 65), np.float64)

        # Apply grabcut
        cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 30, cv2.GC_INIT_WITH_RECT)
        mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')

        output_rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
        output_rgba[:, :, 3] = mask2 * 255 # 0 for background, 255 for foreground

        # Save as PNG to preserve transparency
        output_path = output_dir / image_path.with_suffix('.png').name
        cv2.imwrite(str(output_path), output_rgba)
    except Exception as e:
        logging.error(f"Error processing {image_path.name}: {e}")

def main():
    parser = argparse.ArgumentParser(
        prog="bg-remover.py",
        description="Background remover for coin dataset"
    )

    parser.add_argument("--input", help="Input directory containing images with backgrounds", required=True, type=str)
    parser.add_argument("--output", help="Output directory for files with removed backgrounds", required=True, type=str)
    parser.add_argument("-j", help="How many worker jobs to use (default: os.cpu_count())", type=int, default=os.cpu_count())

    args = parser.parse_args()

    input_dir = Path(args.input)
    output_dir = Path(args.output)

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    image_files = [f for f in input_dir.iterdir() if f.suffix.lower() in valid_extensions]
    if not image_files:
        logging.warning("No valid image files found in 'images/' folder")
    else:
        thread_count = args.j
        threads = []
        for i, image_path in enumerate(tqdm(image_files, desc="Processing images")):
            if len(threads) < thread_count and i != len(image_files)-1:
                threads.append(Thread(target=process_image, args=(image_path, output_dir)))
                threads[-1].start()
                continue
            elif i == len(image_files)-1:
                # Join all threads
                for thread in threads:
                    thread.join()
            else:
                threads[0].join()
                threads.pop()

if __name__ == "__main__":
    main()
