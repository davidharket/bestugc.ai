#!/usr/bin/env python3
"""
Background Removal Script with PROPER TRANSPARENCY SUPPORT
This version preserves the alpha channel for transparent backgrounds
"""

import sys
import os
import cv2
import numpy as np
from rembg import remove, new_session
import argparse
import time
import json
import subprocess

def log_progress(message, progress=None):
    """Log progress with optional percentage"""
    timestamp = time.strftime("%H:%M:%S")
    # Remove emoji characters for Windows compatibility
    clean_message = message.encode('ascii', errors='ignore').decode('ascii')
    if progress is not None:
        print(f"[{timestamp}] {clean_message} ({progress}%)", flush=True)
    else:
        print(f"[{timestamp}] {clean_message}", flush=True)

def remove_background_with_transparency(input_path, output_path):
    """Remove background from video and preserve transparency using WebM format"""
    
    log_progress("Starting background removal with transparency support")
    
    # Initialize rembg session with u2net model (better quality for transparency)
    log_progress("Initializing AI model (u2net for quality)")
    session = new_session('u2net')
    
    # Open input video
    log_progress("Opening input video")
    cap = cv2.VideoCapture(input_path)
    
    if not cap.isOpened():
        raise Exception(f"Could not open video file: {input_path}")
    
    # Get video properties
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    log_progress(f"Video info: {width}x{height}, {fps}fps, {total_frames} frames")
    
    # Optimize dimensions but keep reasonable quality for transparency
    max_dimension = 720  # Higher quality for better transparency
    if max(width, height) > max_dimension:
        scale = max_dimension / max(width, height)
        new_width = int(width * scale)
        new_height = int(height * scale)
        log_progress(f"Resizing: {width}x{height} -> {new_width}x{new_height}")
        width, height = new_width, new_height
    
    # Reduce frame rate for performance but keep quality
    target_fps = min(fps, 15)  # Higher FPS for smoother transparency
    frame_skip = max(1, fps // target_fps)
    log_progress(f"Frame optimization: {fps}fps -> {target_fps}fps")
    
    log_progress("Processing frames with transparency")
    
    # Process frames and save as PNG sequence for transparency
    temp_dir = os.path.join(os.path.dirname(output_path), 'temp_frames')
    os.makedirs(temp_dir, exist_ok=True)
    
    frame_count = 0
    processed_frames = 0
    frame_files = []
    last_progress = -1
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_count += 1
        
        # Skip frames for performance
        if frame_count % frame_skip != 0:
            continue
        
        # Resize frame if needed
        if frame.shape[1] != width or frame.shape[0] != height:
            frame = cv2.resize(frame, (width, height))
        
        # Convert BGR to RGB for rembg
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Remove background - this returns RGBA with transparency!
        result_rgba = remove(rgb_frame, session=session)
        
        # Save frame as PNG to preserve alpha channel
        frame_filename = os.path.join(temp_dir, f'frame_{processed_frames:06d}.png')
        
        # Convert RGBA to BGRA for OpenCV
        if result_rgba.shape[2] == 4:  # RGBA
            bgra_frame = cv2.cvtColor(result_rgba, cv2.COLOR_RGBA2BGRA)
            cv2.imwrite(frame_filename, bgra_frame)
        else:
            # Fallback: create alpha channel
            bgr_frame = cv2.cvtColor(result_rgba, cv2.COLOR_RGB2BGR)
            alpha = np.ones((height, width, 1), dtype=np.uint8) * 255
            bgra_frame = np.concatenate([bgr_frame, alpha], axis=2)
            cv2.imwrite(frame_filename, bgra_frame)
        
        frame_files.append(frame_filename)
        processed_frames += 1
        
        # Progress reporting
        progress = int((frame_count / total_frames) * 100)
        if progress != last_progress and progress % 10 == 0:
            log_progress(f"Processing frames", progress)
            last_progress = progress
    
    cap.release()
    
    log_progress(f"Processed {processed_frames} frames with transparency")
    
    # Create WebM video with transparency support using FFmpeg
    log_progress("Creating WebM video with transparency")
    
    # Use WebM format which supports transparency
    webm_output = output_path.replace('.mp4', '.webm')
    
    ffmpeg_cmd = [
        'ffmpeg', '-y',
        '-framerate', str(target_fps),
        '-i', os.path.join(temp_dir, 'frame_%06d.png'),
        '-c:v', 'libvpx-vp9',  # VP9 codec supports transparency
        '-pix_fmt', 'yuva420p',  # Pixel format with alpha
        '-crf', '30',  # Quality
        '-b:v', '1M',  # Bitrate
        webm_output
    ]
    
    try:
        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            log_progress("WebM with transparency created successfully")
            
            # Also create MP4 version (without transparency but web-compatible)
            log_progress("Creating MP4 fallback version")
            mp4_cmd = [
                'ffmpeg', '-y',
                '-i', webm_output,
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '28',
                '-movflags', '+faststart',
                output_path
            ]
            
            subprocess.run(mp4_cmd, capture_output=True, text=True, timeout=120)
            final_output = webm_output  # Prefer WebM for transparency
            
        else:
            raise Exception(f"FFmpeg failed: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        raise Exception("FFmpeg processing timed out")
    except FileNotFoundError:
        raise Exception("FFmpeg not found. Please install FFmpeg for transparency support")
    
    # Cleanup temp files
    log_progress("Cleaning up temporary files")
    for frame_file in frame_files:
        try:
            os.remove(frame_file)
        except:
            pass
    try:
        os.rmdir(temp_dir)
    except:
        pass
    
    # Get final file size
    file_size = os.path.getsize(final_output) / (1024 * 1024)  # MB
    log_progress(f"Final file: {os.path.basename(final_output)}, Size: {file_size:.2f}MB")
    
    return {
        'success': True,
        'processed_frames': processed_frames,
        'file_size_mb': round(file_size, 2),
        'output_path': final_output,
        'format': 'webm',
        'transparency': True
    }

def main():
    parser = argparse.ArgumentParser(description='Remove background from video with transparency')
    parser.add_argument('input_path', help='Input video file path')
    parser.add_argument('output_path', help='Output video file path')
    
    args = parser.parse_args()
    
    try:
        # Check if FFmpeg is available
        try:
            subprocess.run(['ffmpeg', '-version'], capture_output=True, timeout=5)
        except FileNotFoundError:
            raise Exception("FFmpeg is required for transparency support. Please install FFmpeg.")
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(args.output_path), exist_ok=True)
        
        result = remove_background_with_transparency(args.input_path, args.output_path)
        
        # Output result as JSON for the Node.js script to parse
        print("RESULT_JSON:", json.dumps(result))
        
    except Exception as e:
        log_progress(f"Error: {str(e)}")
        error_result = {
            'success': False,
            'error': str(e),
            'transparency': False
        }
        print("RESULT_JSON:", json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main() 