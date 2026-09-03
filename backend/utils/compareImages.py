import sys
import json
import base64
import io
import imagehash
from PIL import Image

def get_image_from_base64(b64_string):
    if b64_string.startswith('data:image'):
        b64_string = b64_string.split(',')[1]
    image_data = base64.b64decode(b64_string)
    image = Image.open(io.BytesIO(image_data))
    return image

def main():
    try:
        # Read from stdin
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input provided"}))
            return
            
        data = json.loads(input_data)
        
        target_b64 = data.get("target_image")
        nearby_images = data.get("nearby_images", [])
        
        if not target_b64 or not nearby_images:
            print(json.dumps({"duplicate_found": False}))
            return
            
        target_img = get_image_from_base64(target_b64)
        target_hash = imagehash.phash(target_img)
        
        # Perceptual hash difference threshold (e.g., <= 5 means very similar)
        THRESHOLD = 5
        
        for item in nearby_images:
            if not item.get("image"):
                continue
            
            try:
                nearby_img = get_image_from_base64(item["image"])
                nearby_hash = imagehash.phash(nearby_img)
                diff = target_hash - nearby_hash
                
                if diff <= THRESHOLD:
                    print(json.dumps({
                        "duplicate_found": True,
                        "duplicate_id": item["id"],
                        "distance": item.get("distance", 0)
                    }))
                    return
            except Exception as e:
                # Skip invalid images
                continue
                
        print(json.dumps({"duplicate_found": False}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
