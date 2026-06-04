import cv2
import numpy as np
import math
import json
import sys
import os

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Simple 3-D model points for solvePnP using basic facial geometry heuristics
# (nose tip, chin, left eye, right eye, left mouth, right mouth)
MODEL_POINTS = np.array([
    (0.0,   0.0,   0.0),
    (0.0,  -50.0, -10.0),
    (-30.0, 40.0, -10.0),
    (30.0,  40.0, -10.0),
    (-25.0,-30.0, -10.0),
    (25.0, -30.0, -10.0),
], dtype=np.float64)


def estimate_landmarks(face_rect, frame_shape):
    """Estimate 6 facial landmark positions from the face bounding box."""
    x, y, w, h = face_rect
    # Approximate landmark positions as fractions of the bounding box
    pts = np.array([
        (x + w * 0.50, y + h * 0.45),  # nose tip
        (x + w * 0.50, y + h * 0.85),  # chin
        (x + w * 0.25, y + h * 0.35),  # left eye
        (x + w * 0.75, y + h * 0.35),  # right eye
        (x + w * 0.30, y + h * 0.70),  # left mouth corner
        (x + w * 0.70, y + h * 0.70),  # right mouth corner
    ], dtype=np.float64)
    return pts


def process_head_pose(frame):
    h, w = frame.shape[:2]
    gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))

    if len(faces) == 0:
        return "Looking at Screen"

    face_rect = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
    image_points = estimate_landmarks(face_rect, frame.shape)

    focal = w
    camera_matrix = np.array([
        [focal, 0,     w / 2.0],
        [0,     focal, h / 2.0],
        [0,     0,     1.0    ],
    ], dtype=np.float64)
    dist_coeffs = np.zeros((4, 1))

    ok, rvec, _ = cv2.solvePnP(
        MODEL_POINTS, image_points, camera_matrix, dist_coeffs,
        flags=cv2.SOLVEPNP_ITERATIVE
    )
    if not ok:
        return "Looking at Screen"

    R, _ = cv2.Rodrigues(rvec)
    sy = math.sqrt(R[0, 0] ** 2 + R[1, 0] ** 2)
    if sy > 1e-6:
        pitch = math.degrees(math.atan2(R[2, 1], R[2, 2]))
        yaw   = math.degrees(math.atan2(-R[2, 0], sy))
        roll  = math.degrees(math.atan2(R[1, 0], R[0, 0]))
    else:
        pitch = math.degrees(math.atan2(-R[1, 2], R[1, 1]))
        yaw   = math.degrees(math.atan2(-R[2, 0], sy))
        roll  = 0.0

    if abs(yaw) <= 12 and abs(pitch) <= 8 and abs(roll) <= 5:
        return "Looking at Screen"
    elif yaw < -15:
        return "Looking Left"
    elif yaw > 15:
        return "Looking Right"
    elif pitch > 10:
        return "Looking Up"
    elif pitch < -10:
        return "Looking Down"
    elif abs(roll) > 7:
        return "Tilted"
    return "Looking at Screen"


def process_head_pose_file(image_path):
    try:
        frame = cv2.imread(image_path)
        if frame is None:
            return {"head_direction": "Unknown", "error": "Could not read image"}
        return {"head_direction": process_head_pose(frame), "error": None}
    except Exception as e:
        return {"head_direction": "Unknown", "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(json.dumps(process_head_pose_file(sys.argv[1])))
    else:
        print(json.dumps({"head_direction": "Unknown", "error": "No image path provided"}))
