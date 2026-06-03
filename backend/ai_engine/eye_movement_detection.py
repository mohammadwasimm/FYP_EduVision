import cv2
import dlib
import numpy as np
import json
import sys

# Load face detector & landmarks 
detector = dlib.get_frontal_face_detector()
import os
predictor_path = os.path.join(os.path.dirname(__file__), "model", "shape_predictor_68_face_landmarks.dat")
predictor = dlib.shape_predictor(predictor_path)

def detect_pupil(eye_region):
    """Detect pupil position in eye region"""
    gray = cv2.cvtColor(eye_region, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 50, 255, cv2.THRESH_BINARY_INV)

    contours, _ = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None

    largest = max(contours, key=cv2.contourArea)
    M = cv2.moments(largest)
    if M['m00'] == 0:
        return None

    px = int(M['m10'] / M['m00'])
    py = int(M['m01'] / M['m00'])
    return (px, py)

def process_eye_movement(frame):
    """Detect gaze direction from frame"""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = detector(gray)

    gaze_direction = "Looking Center"

    for face in faces:
        landmarks = predictor(gray, face)

        # Left eye (landmarks 36-41)
        left_eye_region = np.array([
            (landmarks.part(36).x, landmarks.part(36).y),
            (landmarks.part(37).x, landmarks.part(37).y),
            (landmarks.part(38).x, landmarks.part(38).y),
            (landmarks.part(39).x, landmarks.part(39).y),
            (landmarks.part(40).x, landmarks.part(40).y),
            (landmarks.part(41).x, landmarks.part(41).y),
        ])

        # Right eye (landmarks 42-47)
        right_eye_region = np.array([
            (landmarks.part(42).x, landmarks.part(42).y),
            (landmarks.part(43).x, landmarks.part(43).y),
            (landmarks.part(44).x, landmarks.part(44).y),
            (landmarks.part(45).x, landmarks.part(45).y),
            (landmarks.part(46).x, landmarks.part(46).y),
            (landmarks.part(47).x, landmarks.part(47).y),
        ])

        # Extract eye regions
        left_min_x = int(left_eye_region[:, 0].min())
        left_max_x = int(left_eye_region[:, 0].max())
        left_min_y = int(left_eye_region[:, 1].min())
        left_max_y = int(left_eye_region[:, 1].max())

        right_min_x = int(right_eye_region[:, 0].min())
        right_max_x = int(right_eye_region[:, 0].max())
        right_min_y = int(right_eye_region[:, 1].min())
        right_max_y = int(right_eye_region[:, 1].max())

        left_eye_img = frame[left_min_y:left_max_y, left_min_x:left_max_x]
        right_eye_img = frame[right_min_y:right_max_y, right_min_x:right_max_x]

        # Detect pupils
        left_pupil = detect_pupil(left_eye_img) if left_eye_img.size > 0 else None
        right_pupil = detect_pupil(right_eye_img) if right_eye_img.size > 0 else None

        # Determine gaze direction based on pupil position
        if left_pupil and right_pupil:
            left_x = left_pupil[0]
            right_x = right_pupil[0]
            left_width = left_max_x - left_min_x
            right_width = right_max_x - right_min_x

            # Normalize pupil position (0=left, 1=right)
            left_pos = left_x / left_width if left_width > 0 else 0.5
            right_pos = right_x / right_width if right_width > 0 else 0.5
            avg_pos = (left_pos + right_pos) / 2

            if avg_pos < 0.35:
                gaze_direction = "Looking Left"
            elif avg_pos > 0.65:
                gaze_direction = "Looking Right"
            else:
                gaze_direction = "Looking Center"

        break  # Process only first face

    return gaze_direction

def process_eye_movement_file(image_path):
    """
    Detect eye movement (gaze direction) from image file.
    Returns JSON with gaze direction.
    """
    try:
        frame = cv2.imread(image_path)
        if frame is None:
            return {"gaze_direction": "Unknown", "error": "Could not read image"}

        gaze_direction = process_eye_movement(frame)
        return {
            "gaze_direction": gaze_direction,
            "error": None
        }
    except Exception as e:
        return {
            "gaze_direction": "Unknown",
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        result = process_eye_movement_file(image_path)
        print(json.dumps(result))
    else:
        print(json.dumps({"gaze_direction": "Unknown", "error": "No image path provided"}))
