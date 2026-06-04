import cv2
import numpy as np
import json
import sys
import os

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
eye_cascade  = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')


def detect_pupil_position(eye_img):
    """Return normalized horizontal pupil position (0=left, 1=right) within the eye region."""
    gray = cv2.cvtColor(eye_img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 50, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return 0.5
    largest = max(contours, key=cv2.contourArea)
    M = cv2.moments(largest)
    if M['m00'] == 0:
        return 0.5
    px = int(M['m10'] / M['m00'])
    return px / eye_img.shape[1]


def process_eye_movement(frame):
    gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))

    if len(faces) == 0:
        return "Looking Center"

    # Use the largest face
    x, y, w, h = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
    face_gray  = gray[y:y+h, x:x+w]
    face_color = frame[y:y+h, x:x+w]

    eyes = eye_cascade.detectMultiScale(face_gray, scaleFactor=1.1, minNeighbors=5, minSize=(20, 20))
    if len(eyes) == 0:
        return "Looking Center"

    positions = []
    for (ex, ey, ew, eh) in eyes[:2]:
        eye_img = face_color[ey:ey+eh, ex:ex+ew]
        if eye_img.size == 0:
            continue
        positions.append(detect_pupil_position(eye_img))

    if not positions:
        return "Looking Center"

    avg = sum(positions) / len(positions)
    if avg < 0.35:
        return "Looking Left"
    elif avg > 0.65:
        return "Looking Right"
    return "Looking Center"


def process_eye_movement_file(image_path):
    try:
        frame = cv2.imread(image_path)
        if frame is None:
            return {"gaze_direction": "Unknown", "error": "Could not read image"}
        return {"gaze_direction": process_eye_movement(frame), "error": None}
    except Exception as e:
        return {"gaze_direction": "Unknown", "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(json.dumps(process_eye_movement_file(sys.argv[1])))
    else:
        print(json.dumps({"gaze_direction": "Unknown", "error": "No image path provided"}))
