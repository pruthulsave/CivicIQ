import sys
import json
import os
import urllib.request

def download_model():
    MODEL_URL = "https://huggingface.co/peterhdd/pothole-detection-yolov8/resolve/main/best.pt"
    MODEL_PATH = "pothole_yolov8.pt"
    if not os.path.exists(MODEL_PATH):
        try:
            urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        except Exception:
            pass
    return MODEL_PATH

def detect(image_path):
    try:
        from ultralytics import YOLO
        model_path = download_model()
        model = YOLO(model_path)
        results = model(image_path, verbose=False)
        
        detected = False
        confidence = 0.0
        severity = "Minor"
        boundingBox = None
        
        if len(results) > 0 and len(results[0].boxes) > 0:
            box = results[0].boxes[0]
            detected = True
            confidence = float(box.conf[0])
            
            w = float(box.xywh[0][2])
            h = float(box.xywh[0][3])
            area = w * h
            if area > 50000:
                severity = "Severe"
            elif area > 10000:
                severity = "Moderate"
            else:
                severity = "Minor"
                
            xyxy = box.xyxy[0].tolist()
            boundingBox = {
                "x1": xyxy[0], "y1": xyxy[1],
                "x2": xyxy[2], "y2": xyxy[3]
            }
            
        print(json.dumps({
            "detected": detected,
            "confidence": confidence,
            "severity": severity,
            "boundingBox": boundingBox
        }))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        detect(sys.argv[1])
