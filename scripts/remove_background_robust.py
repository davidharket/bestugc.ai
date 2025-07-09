# scripts/remove_background_robust.py
import sys
import os
import subprocess
import tempfile
import time
import requests
from rembg import new_session, remove
import cv2

def log_progress(message):
    print(f"[{time.strftime('%H:%M:%S')}] {message}", flush=True)

def download_file(url, target_path):
    log_progress(f"Downloading video from {url}...")
    with requests.get(url, stream=True, timeout=180) as r:
        r.raise_for_status()
        with open(target_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192): f.write(chunk)
    log_progress("Download complete.")

def run_command(command):
    process = subprocess.run(command, capture_output=True, text=True, encoding='utf-8')
    if process.returncode != 0:
        log_progress(f"Error running command: {' '.join(command)}")
        log_progress(f"Stderr: {process.stderr}")
        raise subprocess.CalledProcessError(process.returncode, command, output=process.stdout, stderr=process.stderr)
    return process

def main():
    if len(sys.argv) != 3:
        print("Usage: python script.py <input_source> <output_path>")
        sys.exit(1)

    input_source, output_path = sys.argv[1], sys.argv[2]
    
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            input_video_path = ''
            
            if input_source.startswith(('http://', 'https://')):
                input_video_path = os.path.join(temp_dir, 'input.mp4')
                download_file(input_source, input_video_path)
            else:
                log_progress(f"Using local file source: {input_source}")
                input_video_path = input_source

            TARGET_FPS = 24
            log_progress(f"OK - Enforcing standard framerate: {TARGET_FPS} FPS")

            raw_frames_dir = os.path.join(temp_dir, 'raw_frames')
            processed_frames_dir = os.path.join(temp_dir, 'processed_frames')
            os.makedirs(raw_frames_dir)
            os.makedirs(processed_frames_dir)

            log_progress("Step 1/3: Extracting frames from video...")
            extract_command = ['ffmpeg', '-i', input_video_path, os.path.join(raw_frames_dir, 'frame-%06d.png')]
            run_command(extract_command)

            log_progress("Step 2/3: Removing background from each frame (GPU ACCELERATED)...")
            
            # --- ✅ THE GPU ACCELERATION FIX ---
            # Tell rembg to use the 'u2net' model and run it on the GPU using the CUDAExecutionProvider.
            session = new_session('u2net', providers=['CUDAExecutionProvider'])
            # --- END OF FIX ---

            raw_frames = sorted(os.listdir(raw_frames_dir))
            for i, frame_name in enumerate(raw_frames):
                if (i + 1) % 50 == 0: # Log progress more frequently with faster GPU processing
                    log_progress(f"  - Processing frame {i + 1}/{len(raw_frames)}")
                
                input_frame_path = os.path.join(raw_frames_dir, frame_name)
                output_frame_path = os.path.join(processed_frames_dir, frame_name)
                
                with open(input_frame_path, 'rb') as f_in, open(output_frame_path, 'wb') as f_out:
                    input_data = f_in.read()
                    output_data = remove(input_data, session=session)
                    f_out.write(output_data)
            
            log_progress("Step 3/3: Assembling final transparent video...")
            
            assemble_command = [
                'ffmpeg', '-y',
                '-framerate', str(TARGET_FPS),
                '-i', os.path.join(processed_frames_dir, 'frame-%06d.png'),
                '-c:v', 'libvpx-vp9',
                '-pix_fmt', 'yuva420p',
                '-b:v', '1M',
                '-crf', '30',
                '-g', str(TARGET_FPS),
                '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
                '-metadata:s:v:0', 'alpha_mode="1"',
                '-an',
                output_path
            ]
            run_command(assemble_command)

            log_progress(f"SUCCESS: Robust background removal complete! Output: {output_path}")

        except Exception as e:
            log_progress(f"ERROR: An exception occurred: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main()
