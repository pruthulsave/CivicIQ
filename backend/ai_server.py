import os
import urllib.request
import base64
import io
import imagehash
from PIL import Image
from flask import Flask, request, jsonify

# Flask App
app = Flask(__name__)

# YOLO Model Initialization
model = None

def download_model():
    MODEL_URL = "https://huggingface.co/peterhdd/pothole-detection-yolov8/resolve/main/best.pt"
    MODEL_PATH = "pothole_yolov8.pt"
    if not os.path.exists(MODEL_PATH):
        try:
            print("Downloading YOLOv8 model...")
            urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        except Exception as e:
            print(f"Failed to download model: {e}")
    return MODEL_PATH

def init_model():
    global model
    try:
        from ultralytics import YOLO
        model_path = download_model()
        model = YOLO(model_path)
        # Warmup
        model("https://ultralytics.com/images/bus.jpg", verbose=False)
        print("Model loaded and warmed up.")
    except Exception as e:
        print(f"Error loading model: {e}")

def get_image_from_base64(b64_string):
    if b64_string.startswith('data:image'):
        b64_string = b64_string.split(',')[1]
    image_data = base64.b64decode(b64_string)
    image = Image.open(io.BytesIO(image_data))
    return image

@app.route('/detect', methods=['POST'])
def detect_and_compare():
    try:
        data = request.json
        image_path = data.get('image_path')
        target_b64 = data.get('target_image')
        nearby_images = data.get('nearby_images', [])

        result = {
            "detections": [],
            "duplicate": False
        }

        # 1. Detection
        if image_path and os.path.exists(image_path) and model:
            results = model(image_path, verbose=False)
            
            if len(results) > 0 and len(results[0].boxes) > 0:
                for box in results[0].boxes:
                    confidence = float(box.conf[0])
                    
                    w = float(box.xywh[0][2])
                    h = float(box.xywh[0][3])
                    area = w * h
                    
                    severity = "Low"
                    if area > 50000:
                        severity = "High"
                    elif area > 10000:
                        severity = "Medium"
                        
                    xyxy = box.xyxy[0].tolist()
                    result["detections"].append({
                        "label": "pothole",
                        "confidence": confidence,
                        "severity": severity,
                        "box": [xyxy[0], xyxy[1], xyxy[2], xyxy[3]]
                    })

        # 2. Duplicate Check
        if target_b64 and nearby_images:
            try:
                target_img = get_image_from_base64(target_b64)
                target_hash = imagehash.phash(target_img)
                THRESHOLD = 5
                
                for item in nearby_images:
                    if not item.get("image"):
                        continue
                    try:
                        nearby_img = get_image_from_base64(item["image"])
                        nearby_hash = imagehash.phash(nearby_img)
                        if target_hash - nearby_hash <= THRESHOLD:
                            result["duplicate"] = True
                            break
                    except Exception:
                        continue
            except Exception as e:
                print(f"Hashing error: {e}")

        return jsonify(result), 200

    except Exception as e:
        print(f"API Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_model()
    # Run on port 5001 to avoid conflicting with Node on 5000
    app.run(host='127.0.0.1', port=5001, debug=False, use_reloader=False)
