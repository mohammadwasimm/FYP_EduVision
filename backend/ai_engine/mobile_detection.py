import cv2
import torch
import json
import sys
from ultralytics import YOLO

# Load trained YOLO model
try:
    model = YOLO("./model/best_yolov8.pt")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)
except Exception as e:
    print(json.dumps({"mobile_detected": False, "confidence": 0, "error": str(e)}))
    sys.exit(0)

def process_mobile_detection(image_path):
    """
    Detect mobile phones in an image using YOLO model.
    Returns JSON with detection results.
    """
    try:
        frame = cv2.imread(image_path)
        if frame is None:
            return {"mobile_detected": False, "confidence": 0, "error": "Could not read image"}

        # Convert to RGB for YOLO
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        results = model(rgb_frame, verbose=False, conf=0.5)
        mobile_detected = False
        max_confidence = 0.0

        for result in results:
            for box in result.boxes:
                conf = float(box.conf[0].item())
                cls = int(box.cls[0].item())

                # Mobile class index is 0, confidence threshold 0.5
                if cls == 0:  # This is a mobile/phone class
                    mobile_detected = True
                    max_confidence = max(max_confidence, conf)

        return {
            "mobile_detected": mobile_detected,
            "confidence": float(max_confidence),
            "error": None
        }
    except Exception as e:
        return {
            "mobile_detected": False,
            "confidence": 0,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        result = process_mobile_detection(image_path)
        print(json.dumps(result))
    else:
        print(json.dumps({"mobile_detected": False, "confidence": 0, "error": "No image path provided"}))