# scripts/remove_background_greenscreen.py
import sys
import os
import subprocess
import tempfile
import time
import requests
from rembg import new_session, remove
from PIL import Image
import numpy as np
import io

def log_progress(message):
    print(f"[{time.strftime('%H:%M:%S')}] {message}", flush=True)

def run_command(command):
    process = subprocess.run(command, capture_output=True, text=True, encoding='utf-8')
    if process.returncode != 0:
        log_progress(f"Error running command: {' '.join(command)}")
        log_progress(f"Stderr: {process.stderr}")
        raise subprocess.CalledProcessError(process.returncode, command, output=process.stdout, stderr=process.stderr)
    return process
def create_transparent_webm(processed_frames_dir, output_path):
    webm_path = output_path.replace('.mp4', '.webm')
    command = [
        'ffmpeg', '-y',
        '-framerate', '30',
        '-i', os.path.join(processed_frames_dir, 'frame-%06d.png'),
        '-c:v', 'libvpx-vp9',
        '-pix_fmt', 'yuva420p',  # This preserves alpha channel
        '-b:v', '1M',
        '-auto-alt-ref', '0',
        '-an',
        webm_path
    ]
    run_command(command)
    return webm_path

def main():
    if len(sys.argv) != 3:
        print("Usage: python script.py <input_source> <output_path>")
        sys.exit(1)

    input_source, output_path = sys.argv[1], sys.argv[2]
    
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            log_progress(f"Using local file source: {input_source}")
            if not os.path.exists(input_source):
                raise FileNotFoundError(f"Input file not found: {input_source}")
            input_video_path = input_source

            raw_frames_dir = os.path.join(temp_dir, 'raw_frames')
            processed_frames_dir = os.path.join(temp_dir, 'processed_frames')
            os.makedirs(raw_frames_dir)
            os.makedirs(processed_frames_dir)

            log_progress("Step 1/3: Extracting frames from video...")
            extract_command = ['ffmpeg', '-i', input_video_path, os.path.join(raw_frames_dir, 'frame-%06d.png')]
            run_command(extract_command)

            log_progress("Step 2/3: Removing background and adding green screen...")
            session = new_session('u2net')
            raw_frames = sorted(os.listdir(raw_frames_dir))
            for i, frame_name in enumerate(raw_frames):
                if (i + 1) % 30 == 0:
                    log_progress(f"  - Processing frame {i + 1}/{len(raw_frames)}")
                
                input_frame_path = os.path.join(raw_frames_dir, frame_name)
                output_frame_path = os.path.join(processed_frames_dir, frame_name)
                
                with open(input_frame_path, 'rb') as f_in:
                    input_data = f_in.read()
                    output_data = remove(input_data, session=session)
                    in_mem_file = io.BytesIO(output_data)
                    output_rgba = Image.open(in_mem_file)
                    
                    green_bg = Image.new("RGBA", output_rgba.size, (0, 255, 0, 255))
                    final_frame = Image.alpha_composite(green_bg, output_rgba)
                    final_frame.convert("RGB").save(output_frame_path)
            
            log_progress("Step 3/3: Assembling final green screen video with failsafe settings...")
            
            # --- ✅ THE DEFINITIVE FAILSAFE FFMPEG COMMAND FOR MP4 ---
            assemble_command = [
                'ffmpeg', '-y',
                '-framerate', '30',
                '-i', os.path.join(processed_frames_dir, 'frame-%06d.png'),
                '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p',
                '-profile:v', 'baseline',
                '-level', '3.0',
                '-preset', 'medium',
                '-crf', '23',
                '-movflags', '+faststart',  # This is crucial for web playback
                '-metadata:s:v:0', 'rotate=0',  # Ensure no rotation metadata issues
                '-an',
                '-t', '30',  # Limit to 30 seconds max
                output_path
            ]
            # --- END OF FAILSAFE COMMAND ---

            run_command(assemble_command)

            log_progress(f"SUCCESS: Green screen video created! Output: {output_path}")

        except Exception as e:
            log_progress(f"ERROR: An exception occurred: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main()