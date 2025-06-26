#!/usr/bin/env python3
"""
Optimized background removal script for video files
"""

import argparse
import sys
import os
import cv2
import numpy as np
import requests
from rembg import remove
from PIL import Image
import tempfile
import time

def download_video(url, output_path):
    """Download video from URL"""
    print(f"[DOWNLOAD] Downloading video from {url}")
    
    response = requests.get(url, stream=True, timeout=60)
    response.raise_for_status()
    
    with open(output_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    
    print(f"[SUCCESS] Video downloaded: {os.path.getsize(output_path)} bytes")

def process_video(input_path, output_path, fps=15, max_size=640):
    """Process video with background removal"""
    print(f"[PROCESS] Processing video: {input_path}")
    
    # Open input video
    cap = cv2.VideoCapture(input_path)
    
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {input_path}")
    
    # Get video properties
    original_fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    print(f"[INFO] Original: {width}x{height}, {original_fps}fps, {frame_count} frames")
    
    # Calculate new dimensions maintaining aspect ratio
    if width > height:
        new_width = min(width, max_size)
        new_height = int(height * new_width / width)
    else:
        new_height = min(height, max_size)
        new_width = int(width * new_height / height)
    
    print(f"[INFO] Output: {new_width}x{new_height}, {fps}fps")
    
    # Setup video writer with alpha channel (RGBA)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (new_width, new_height), True)
    
    if not out.isOpened():
        raise ValueError(f"Could not create output video: {output_path}")
    
    # Process frames
    frame_skip = max(1, int(original_fps / fps))
    processed_frames = 0
    
    print(f"[PROCESS] Processing every {frame_skip} frames...")
    
    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Skip frames to achieve target FPS
        if frame_idx % frame_skip != 0:
            frame_idx += 1
            continue
        
        try:
            # Resize frame
            frame_resized = cv2.resize(frame, (new_width, new_height))
            
            # Convert BGR to RGB for rembg
            frame_rgb = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2RGB)
            
            # Remove background
            frame_no_bg = remove(frame_rgb)
            
            # Convert back to BGR for video writer
            frame_bgr = cv2.cvtColor(frame_no_bg, cv2.COLOR_RGBA2BGR)
            
            # Write frame
            out.write(frame_bgr)
            
            processed_frames += 1
            
            # Progress update every 30 frames
            if processed_frames % 30 == 0:
                progress = (frame_idx / frame_count) * 100
                print(f"[PROGRESS] {progress:.1f}% ({processed_frames} frames processed)")
                
        except Exception as e:
            print(f"[WARNING] Error processing frame {frame_idx}: {e}")
            # Write original frame on error
            frame_resized = cv2.resize(frame, (new_width, new_height))
            out.write(frame_resized)
            processed_frames += 1
        
        frame_idx += 1
    
    # Cleanup
    cap.release()
    out.release()
    
    print(f"[SUCCESS] Processing complete: {processed_frames} frames processed")
    
    # Verify output file
    if os.path.exists(output_path):
        file_size = os.path.getsize(output_path)
        print(f"[INFO] Output file: {file_size} bytes")
        return True
    else:
        print("[ERROR] Output file not created")
        return False

def main():
    parser = argparse.ArgumentParser(description='Remove background from video')
    parser.add_argument('input_url', help='Input video URL')
    parser.add_argument('output_path', help='Output video path')
    parser.add_argument('--model', default='u2net', help='Background removal model')
    parser.add_argument('--fps', type=int, default=15, help='Output FPS')
    parser.add_argument('--max-size', type=int, default=640, help='Maximum resolution')
    
    args = parser.parse_args()
    
    start_time = time.time()
    
    try:
        print(f"[START] Starting background removal...")
        print(f"[CONFIG] Settings: model={args.model}, fps={args.fps}, max_size={args.max_size}")
        
        # Create temporary file for input video
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_file:
            temp_input_path = temp_file.name
        
        try:
            # Download video
            download_video(args.input_url, temp_input_path)
            
            # Process video
            success = process_video(temp_input_path, args.output_path, args.fps, args.max_size)
            
            if success:
                processing_time = time.time() - start_time
                print(f"[COMPLETE] Background removal completed in {processing_time:.1f} seconds!")
                sys.exit(0)
            else:
                print("[ERROR] Background removal failed")
                sys.exit(1)
                
        finally:
            # Cleanup temp file
            if os.path.exists(temp_input_path):
                os.unlink(temp_input_path)
        
    except Exception as e:
        processing_time = time.time() - start_time
        print(f"[ERROR] Error after {processing_time:.1f} seconds: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 