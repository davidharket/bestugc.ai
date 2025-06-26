import requests
import json
import os
from pathlib import Path

# Configuration
VOICE_ID = "b3jcIbyC3BSnaRu8avEk"  # Emma voice
API_KEY = "***REMOVED***"  # Replace with your actual API key
BASE_URL = "https://api.elevenlabs.io/v1"

# Norwegian test texts
norwegian_texts = [
    "Hei, jeg heter Emma og jeg snakker norsk.",
    "Hvor mye koster det?",
    "Takk for hjelpen, ha en fin dag!",
    "Det er kald og snøer i Oslo i dag.",
    "Jeg liker å høre på musikk og lese bøker."
]

def test_voice_info():
    """Get information about the voice"""
    url = f"{BASE_URL}/voices/{VOICE_ID}"
    headers = {
        "Accept": "application/json",
        "xi-api-key": API_KEY
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            voice_info = response.json()
            print("✅ Voice Information:")
            print(f"   Name: {voice_info.get('name', 'N/A')}")
            print(f"   Description: {voice_info.get('description', 'N/A')}")
            print(f"   Category: {voice_info.get('category', 'N/A')}")
            print(f"   Labels: {voice_info.get('labels', {})}")
            return True
        else:
            print(f"❌ Failed to get voice info: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error getting voice info: {e}")
        return False

def generate_speech(text, filename, model="eleven_multilingual_v2"):
    """Generate speech from text using the specified voice"""
    url = f"{BASE_URL}/text-to-speech/{VOICE_ID}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": API_KEY
    }
    
    data = {
        "text": text,
        "model_id": model,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        }
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            # Save the audio file
            output_dir = Path("norwegian_voice_tests")
            output_dir.mkdir(exist_ok=True)
            
            filepath = output_dir / f"{filename}.mp3"
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            print(f"✅ Generated: {filepath}")
            return True
        else:
            print(f"❌ Failed to generate speech: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error generating speech: {e}")
        return False

def test_multiple_models():
    """Test Norwegian text with different models"""
    models = [
        "eleven_multilingual_v2",
        "eleven_flash_v2_5",
        "eleven_turbo_v2_5"
    ]
    
    test_text = "Hei, dette er en test av norsk stemme."
    
    print("\n🧪 Testing different models with Norwegian text:")
    print(f"Text: '{test_text}'")
    
    for model in models:
        print(f"\n📍 Testing model: {model}")
        filename = f"norwegian_test_{model.replace('eleven_', '')}"
        success = generate_speech(test_text, filename, model)
        
        if success:
            print(f"   ✅ Successfully generated with {model}")
        else:
            print(f"   ❌ Failed with {model}")

def main():
    print("🎤 ElevenLabs Norwegian Voice Test")
    print("=" * 40)
    
    # Check if API key is set
    if API_KEY == "your_api_key_here":
        print("❌ Please set your API key in the script!")
        print("   Get your API key from: https://elevenlabs.io/app/settings/api-keys")
        return
    
    print(f"🎯 Testing voice ID: {VOICE_ID}")
    
    # Test 1: Get voice information
    print("\n1️⃣ Getting voice information...")
    if not test_voice_info():
        print("⚠️  Continuing despite voice info error...")
    
    # Test 2: Generate speech with multiple models
    test_multiple_models()
    
    # Test 3: Generate speech for each Norwegian test text
    print("\n2️⃣ Testing various Norwegian phrases:")
    for i, text in enumerate(norwegian_texts, 1):
        print(f"\n📝 Test {i}: '{text}'")
        filename = f"norwegian_phrase_{i}"
        success = generate_speech(text, filename)
        
        if not success:
            print(f"   ⚠️  Failed to generate for phrase {i}")
    
    print("\n✨ Test completed!")
    print("📁 Check the 'norwegian_voice_tests' folder for generated audio files")
    print("\n💡 Tips:")
    print("   - Listen to the audio files to verify Norwegian pronunciation")
    print("   - Try different models if one doesn't work well")
    print("   - Adjust voice_settings (stability/similarity_boost) if needed")

if __name__ == "__main__":
    main()