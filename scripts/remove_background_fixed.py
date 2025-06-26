# scripts/remove_background_fixed.py
import sys, os, cv2, requests, subprocess, tempfile, time

def log_progress(message):
    print(f"[{time.strftime('%H:%M:%S')}] {message}", flush=True)

def download_file(url, target_path):
    log_progress(f"Downloading video from {url}")
    with requests.get(url, stream=True, timeout=120) as r:
        r.raise_for_status()
        with open(target_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192): f.write(chunk)
    log_progress("Download complete")

def process_video(input_path, output_path):
    from rembg import new_session, remove
    
    session = new_session('u2net_lite', providers=['CPUExecutionProvider'])
    
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened(): raise Exception("Could not open video file.")
    
    target_fps = min(cap.get(cv2.CAP_PROP_FPS), 30) # Use 30fps for smoother output
    temp_frame_dir = tempfile.mkdtemp(prefix="rembg_frames_")
    log_progress(f"Using temp directory: {temp_frame_dir}")

    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret: break
        # Resize frame for faster processing
        resized_frame = cv2.resize(frame, (720, 1280)) # Standard 720p portrait
        rgba_frame = remove(resized_frame, session=session)
        cv2.imwrite(os.path.join(temp_frame_dir, f'frame_{frame_count:06d}.png'), rgba_frame)
        frame_count += 1
    cap.release()
    
    log_progress(f"Assembling video with FFmpeg...")
    
    # --- THIS IS THE CRITICAL FIX ---
    # We are adding flags to ensure the video is perfectly compatible.
    ffmpeg_cmd = [
        'ffmpeg', '-y', 
        '-framerate', str(target_fps), 
        '-i', os.path.join(temp_frame_dir, 'frame_%06d.png'),
        '-c:v', 'libvpx-vp9',     # VP9 codec for transparency
        '-pix_fmt', 'yuva420p',   # Pixel format with Alpha channel
        '-crf', '30',             # Constant Rate Factor (quality, lower is better)
        '-b:v', '0',              # Allow variable bitrate
        '-an',                    # No audio in cutout
        '-movflags', '+faststart',# Crucial for web streaming metadata
        '-g', '15',               # Keyframe every 15 frames for better seeking
        output_path
    ]
    # --- END OF FIX ---
    
    subprocess.run(ffmpeg_cmd, check=True, capture_output=True, text=True, timeout=300)
    
    log_progress("Cleaning up temp frames...")
    # ... (rest of the script is fine) ...
    for f in os.listdir(temp_frame_dir): os.remove(os.path.join(temp_frame_dir, f))
    os.rmdir(temp_frame_dir)
    log_progress(f"✅ Transparent video created: {output_path}")


def main():
    if len(sys.argv) != 3:
        print("Usage: python script.py <input_url> <output_path>")
        sys.exit(1)
    
    input_url, output_path = sys.argv[1], sys.argv[2]
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=True) as temp_input:
        try:
            download_file(input_url, temp_input.name)
            process_video(temp_input.name, output_path)
        except Exception as e:
            log_progress(f"❌ An error occurred: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main()