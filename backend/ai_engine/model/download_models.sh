#!/bin/bash
cd "$(dirname "$0")"

echo "Downloading YOLO v8..."
wget https://github.com/ultralytics/assets/releases/download/v8.1.0/yolov8s.pt -O best_yolov8.pt

echo "Downloading dlib facial landmarks..."
wget http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2
bunzip2 -f shape_predictor_68_face_landmarks.dat.bz2

echo "✓ All models downloaded!"
ls -lh *.pt *.dat
