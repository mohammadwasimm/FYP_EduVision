import cv2
import dlib
import numpy as np
import math
import json
import sys

# Load face detector & landmarks predictor
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("model/shape_predictor_68_face_landmarks.dat")

# 3D Model Points (Mapped to Facial Landmarks)
model_points = np.array([
    (0.0, 0.0, 0.0),        # Nose tip
    (0.0, -50.0, -10.0),    # Chin
    (-30.0, 40.0, -10.0),   # Left eye
    (30.0, 40.0, -10.0),    # Right eye
    (-25.0, -30.0, -10.0),  # Left mouth corner
    (25.0, -30.0, -10.0)    # Right mouth corner
], dtype=np.float64)

# Camera Calibration (Assuming 640x480)
focal_length = 640
center = (320, 240)
camera_matrix = np.array([
    [focal_length, 0, center[0]],
    [0, focal_length, center[1]],
    [0, 0, 1]
], dtype=np.float64)

dist_coeffs = np.zeros((4, 1))

def get_head_pose_angles(image_points):
    """Calculate head pose angles from image points"""
    success, rotation_vector, translation_vector = cv2.solvePnP(
        model_points, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
    )
    if not success:
        return None

    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
    sy = math.sqrt(rotation_matrix[0, 0]**2 + rotation_matrix[1, 0]**2)
    singular = sy < 1e-6

    if not singular:
        pitch = math.atan2(rotation_matrix[2, 1], rotation_matrix[2, 2])
        yaw = math.atan2(-rotation_matrix[2, 0], sy)
        roll = math.atan2(rotation_matrix[1, 0], rotation_matrix[0, 0])
    else:
        pitch = math.atan2(-rotation_matrix[1, 2], rotation_matrix[1, 1])
        yaw = math.atan2(-rotation_matrix[2, 0], sy)
        roll = 0

    return np.degrees(pitch), np.degrees(yaw), np.degrees(roll)

def process_head_pose(frame):
    """Detect head pose from frame"""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = detector(gray)

    head_direction = "Looking at Screen"

    for face in faces:
        landmarks = predictor(gray, face)
        image_points = np.array([
            (landmarks.part(30).x, landmarks.part(30).y),  # Nose tip
            (landmarks.part(8).x, landmarks.part(8).y),    # Chin
            (landmarks.part(36).x, landmarks.part(36).y),  # Left eye
            (landmarks.part(45).x, landmarks.part(45).y),  # Right eye
            (landmarks.part(48).x, landmarks.part(48).y),  # Left mouth corner
            (landmarks.part(54).x, landmarks.part(54).y)   # Right mouth corner
        ], dtype=np.float64)

        angles = get_head_pose_angles(image_points)
        if angles is None:
            continue

        pitch, yaw, roll = angles

        # Determine head direction based on angles
        # Thresholds for detecting if student is looking at screen
        PITCH_THRESHOLD = 8
        YAW_THRESHOLD = 12
        ROLL_THRESHOLD = 5

        if abs(yaw) <= YAW_THRESHOLD and abs(pitch) <= PITCH_THRESHOLD and abs(roll) <= ROLL_THRESHOLD:
            head_direction = "Looking at Screen"
        elif yaw < -15:
            head_direction = "Looking Left"
        elif yaw > 15:
            head_direction = "Looking Right"
        elif pitch > 10:
            head_direction = "Looking Up"
        elif pitch < -10:
            head_direction = "Looking Down"
        elif abs(roll) > 7:
            head_direction = "Tilted"
        else:
            head_direction = "Looking at Screen"

        break  # Process only first face

    return head_direction

def process_head_pose_file(image_path):
    """
    Detect head pose from image file.
    Returns JSON with head direction.
    """
    try:
        frame = cv2.imread(image_path)
        if frame is None:
            return {"head_direction": "Unknown", "error": "Could not read image"}

        head_direction = process_head_pose(frame)
        return {
            "head_direction": head_direction,
            "error": None
        }
    except Exception as e:
        return {
            "head_direction": "Unknown",
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        result = process_head_pose_file(image_path)
        print(json.dumps(result))
    else:
        print(json.dumps({"head_direction": "Unknown", "error": "No image path provided"}))
