import os
import requests
import tempfile
from flask import Flask, request, jsonify
from moviepy.editor import (
    VideoFileClip,
    ImageClip,
    AudioFileClip,
    CompositeVideoClip,
    concatenate_videoclips,
)

app = Flask(__name__)

# --- Helper Function to Download Assets ---
def download_asset(url, temp_dir):
    """Downloads a file from a URL and saves it to a temporary directory."""
    try:
        filename = url.split("/")[-1].split("?")[0]
        if "." not in filename:
            filename += ".mp4" # Assume mp4 if no extension
        
        local_path = os.path.join(temp_dir, filename)
        
        with requests.get(url, stream=True, timeout=120) as r:
            r.raise_for_status()
            with open(local_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        return local_path
    except Exception as e:
        print(f"Failed to download asset: {url}. Error: {e}")
        return None

# --- Main Rendering Endpoint ---
@app.route("/render", methods=["POST"])
def render_video():
    data = request.json
    
    # Extract data from the request payload
    ad_data = data.get("adData", {})
    timeline = data.get("timeline", [])
    audio_url = data.get("audioUrl")
    avatar_url = data.get("processedAvatarUrl")
    cutout_url = data.get("cutoutAvatarUrl")

    if not all([timeline, audio_url, avatar_url, cutout_url]):
        return jsonify({"error": "Missing required data"}), 400

    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            print("--- Starting New Python Render Job ---")
            
            # 1. Download all required assets
            print("Step 1/3: Downloading assets...")
            audio_path = download_asset(audio_url, temp_dir)
            avatar_path = download_asset(avatar_url, temp_dir)
            cutout_path = download_asset(cutout_url, temp_dir)
            
            asset_urls = ad_data.get("selectedImages", []) + ad_data.get("selectedVideos", [])
            local_asset_paths = [download_asset(url, temp_dir) for url in asset_urls]
            valid_local_assets = [p for p in local_asset_paths if p]

            if not all([audio_path, avatar_path, cutout_path]):
                raise Exception("Failed to download one or more core assets.")

            # 2. Generate video clips for each scene in the timeline
            print("Step 2/3: Generating scene clips...")
            scene_clips = []
            fps = 30

            for i, scene in enumerate(timeline):
                scene_duration = scene["duration"] / fps
                layout = scene["layout"]
                print(f"  - Creating Scene {i+1}: {layout} ({scene_duration:.2f}s)")

                # --- Create clips based on layout ---
                if layout == "fullscreen-avatar":
                    clip = VideoFileClip(avatar_path).set_duration(scene_duration)
                    scene_clips.append(clip)

                elif layout == "fullscreen-asset":
                    asset_index = scene["assetIndices"][0] % len(valid_local_assets)
                    asset_path = valid_local_assets[asset_index]
                    if asset_path.endswith(('.mp4', '.webm')):
                        clip = VideoFileClip(asset_path).subclip(0, scene_duration)
                    else:
                        clip = ImageClip(asset_path).set_duration(scene_duration)
                    scene_clips.append(clip)
                
                elif layout in ["cutout-left-over-asset", "cutout-right-over-asset", "cutout-center-over-asset"]:
                    asset_index = scene["assetIndices"][0] % len(valid_local_assets)
                    asset_path = valid_local_assets[asset_index]

                    if asset_path.endswith(('.mp4', '.webm')):
                        bg_clip = VideoFileClip(asset_path, target_resolution=(1920, 1080)).subclip(0, scene_duration)
                    else:
                        bg_clip = ImageClip(asset_path, duration=scene_duration).set_size((1080, 1920))

                    fg_clip = VideoFileClip(cutout_path, has_mask=True).set_duration(scene_duration).resize(height=1152) # 60% of 1920

                    position = "center"
                    if layout == "cutout-left-over-asset": position = ("left", "center")
                    if layout == "cutout-right-over-asset": position = ("right", "center")
                    
                    final_scene = CompositeVideoClip([bg_clip, fg_clip.set_position(position)], size=(1080, 1920))
                    scene_clips.append(final_scene)
                
                # Add other layouts like 'avatar-with-corner-image' and 'buildup-collage' here if needed...
                else:
                    # Fallback for unimplemented scenes
                    clip = VideoFileClip(avatar_path).set_duration(scene_duration)
                    scene_clips.append(clip)

            # 3. Concatenate all scenes, add audio, and write to file
            print("Step 3/3: Assembling final video...")
            final_clip = concatenate_videoclips(scene_clips, method="compose").set_audio(AudioFileClip(audio_path))

            # Define output path
            output_dir = os.path.join(os.getcwd(), 'public', 'renders')
            os.makedirs(output_dir, exist_ok=True)
            output_filename = f"video-{int(time.time())}.mp4"
            output_path = os.path.join(output_dir, output_filename)
            
            # Write the final video file
            final_clip.write_videofile(
                output_path, 
                codec="libx264", 
                audio_codec="aac",
                temp_audiofile="temp-audio.m4a",
                remove_temp=True,
                fps=fps,
                threads=4, # Use multiple threads
                preset="medium" # Good balance of speed/quality
            )

            print(f"✅ Render successful! File saved to {output_path}")
            return jsonify({"success": True, "videoUrl": f"/renders/{output_filename}"})

        except Exception as e:
            print(f"❌ Render failed: {e}")
            return jsonify({"error": "Render failed", "details": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)