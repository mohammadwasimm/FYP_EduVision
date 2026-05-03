import os
from typing import Dict, Any

import numpy as np

# Try to import your existing AI modules from the cloned repo.
# If model files are missing, we fall back to a "dummy" implementation
# so that the backend server still runs and other APIs can be developed.
try:
    from ai_engine.eye_movement import process_eye_movement  # type: ignore
    from ai_engine.head_pose import process_head_pose  # type: ignore
    from ai_engine.mobile_detection import process_mobile_detection  # type: ignore

    AI_MODELS_AVAILABLE = True
    AI_INIT_ERROR: str | None = None
except Exception as exc:  # noqa: BLE001
    process_eye_movement = None  # type: ignore[assignment]
    process_head_pose = None  # type: ignore[assignment]
    process_mobile_detection = None  # type: ignore[assignment]
    AI_MODELS_AVAILABLE = False
    AI_INIT_ERROR = str(exc)


def analyze_frame(frame_bgr: np.ndarray) -> Dict[str, Any]:
    """
    Run the cheating-surveillance pipeline on a single frame.

    If the heavy AI models (dlib/YOLO) are not available yet (e.g. model
    files not downloaded), we return a safe placeholder response so that
    the rest of the backend can be developed and tested.
    """
    base: Dict[str, Any] = {
        "ai_models_available": AI_MODELS_AVAILABLE,
        "gaze_direction": "Unknown",
        "head_direction": "Unknown",
        "mobile_detected": False,
    }

    # If models are not available, just return the base info.
    if not AI_MODELS_AVAILABLE or not all(
        [process_eye_movement, process_head_pose, process_mobile_detection]
    ):
        if AI_INIT_ERROR:
            base["ai_init_error"] = AI_INIT_ERROR
        return base

    result = dict(base)

    # Eye movement / gaze
    try:
        _, gaze_direction = process_eye_movement(frame_bgr)  # type: ignore[misc]
        result["gaze_direction"] = gaze_direction
    except Exception as exc:  # noqa: BLE001
        result["gaze_direction_error"] = str(exc)

    # Head pose
    try:
        # When calibrated_angles=None, process_head_pose returns (frame, (pitch, yaw, roll))
        _, head_info = process_head_pose(frame_bgr, None)  # type: ignore[misc]
        if isinstance(head_info, tuple):
            # First frame behaves like calibration; treat as "Looking at Screen"
            result["head_direction"] = "Looking at Screen"
            pitch, yaw, roll = head_info
            result["head_angles"] = {"pitch": pitch, "yaw": yaw, "roll": roll}
        else:
            result["head_direction"] = str(head_info)
    except Exception as exc:  # noqa: BLE001
        result["head_direction_error"] = str(exc)

    # Mobile detection (YOLOv8)
    try:
        _, mobile_detected = process_mobile_detection(frame_bgr)  # type: ignore[misc]
        result["mobile_detected"] = bool(mobile_detected)
    except Exception as exc:  # noqa: BLE001
        result["mobile_detection_error"] = str(exc)

    return result


