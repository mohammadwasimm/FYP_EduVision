import json
import sys
import os
import logging
import io
from contextlib import redirect_stdout, redirect_stderr

# Suppress all logging
logging.basicConfig(level=logging.CRITICAL)
logging.getLogger('roboflow').setLevel(logging.CRITICAL)
logging.getLogger('urllib3').setLevel(logging.CRITICAL)

# Redirect stdout/stderr during Roboflow import to suppress print statements
devnull = io.StringIO()
with redirect_stdout(devnull), redirect_stderr(devnull):
    from roboflow import Roboflow

def process_mobile_detection(image_path):
    """
    Detect mobile phones using Roboflow Python SDK.
    Returns JSON with detection results and annotated image.
    """
    try:
        if not os.path.exists(image_path):
            return {"mobile_detected": False, "confidence": 0, "error": f"Image not found: {image_path}"}

        api_key = os.getenv("ROBOFLOW_API_KEY", "")
        if not api_key:
            return {"mobile_detected": False, "confidence": 0, "error": "ROBOFLOW_API_KEY not set"}

        # Suppress Roboflow print statements during initialization and prediction
        devnull = io.StringIO()
        with redirect_stdout(devnull), redirect_stderr(devnull):
            # Initialize Roboflow with API key
            rf = Roboflow(api_key=api_key)
            project = rf.workspace("d1156414").project("cellphone-0aodn")
            model = project.version(1).model

            # Run inference on the image
            prediction = model.predict(image_path, confidence=40, overlap=30)
            prediction_json = prediction.json()

        predictions = prediction_json.get("predictions", [])

        mobile_detected = False
        max_confidence = 0.0
        detections_found = []

        for pred in predictions:
            class_name = pred.get("class", "unknown")
            confidence = float(pred.get("confidence", 0)) / 100.0  # Roboflow returns 0-100
            detections_found.append(f"{class_name}:{confidence:.2f}")

            # Any detection counts as phone detected (Roboflow model only detects phones)
            if confidence > 0:
                mobile_detected = True
                max_confidence = max(max_confidence, confidence)

        # Get the annotated image with bounding boxes
        annotated_image_path = None
        try:
            if hasattr(prediction, 'save'):
                # Save visualization to a temp location
                output_dir = os.path.dirname(image_path)
                annotated_filename = f"annotated_{os.path.basename(image_path)}"
                annotated_path = os.path.join(output_dir, annotated_filename)
                prediction.save(annotated_path)
                if os.path.exists(annotated_path):
                    annotated_image_path = annotated_path
        except Exception as viz_err:
            # Visualization is optional, don't fail on it
            pass

        return {
            "mobile_detected": mobile_detected,
            "confidence": float(max_confidence),
            "detections": detections_found,
            "annotated_image_path": annotated_image_path,
            "error": None
        }
    except Exception as e:
        return {
            "mobile_detected": False,
            "confidence": 0,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"mobile_detected": False, "confidence": 0, "error": "No image path provided"}))
        sys.exit(0)

    image_path = sys.argv[1]
    result = process_mobile_detection(image_path)
    print(json.dumps(result))
