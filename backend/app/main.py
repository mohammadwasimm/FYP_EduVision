import json
from pathlib import Path
from typing import List, Optional

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .ai_engine_wrapper import analyze_frame


app = FastAPI(title="EduVision Backend", version="1.0.0")

# Data persistence file path
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
STUDENTS_FILE = DATA_DIR / "students.json"

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health():
    """
    Simple health check endpoint to verify that the backend server is running.
    """
    return {"status": "ok", "service": "eduvision-backend"}


# ---------------------------------------------------------------------------
# AI test endpoint (uses your cheating-surveillance pipeline)
# ---------------------------------------------------------------------------
@app.post("/api/ai/analyze-frame")
async def ai_analyze_frame(file: UploadFile = File(...)):
    """
    Test endpoint: accepts a single image frame, runs the cheating-surveillance
    pipeline (head pose, gaze, mobile detection) and returns a summary.

    Frontend later can send snapshots or extracted frames from the webcam here.
    """
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file")

        # Convert bytes → OpenCV BGR frame
        np_arr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if frame is None:
            raise HTTPException(status_code=400, detail="Could not decode image")

        result = analyze_frame(frame)
        return JSONResponse(content=result)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500, detail=f"AI analysis failed: {exc}"
        ) from exc


# ---------------------------------------------------------------------------
# In-memory Students API (Admin side)
# Mirrors the Students table in the frontend (name, rollNumber, className, email, studentId).
# Later we will replace this with MongoDB.
# ---------------------------------------------------------------------------


class StudentBase(BaseModel):
    name: str = Field(..., max_length=100, example="John Doe")
    roll_number: str = Field(..., max_length=50, alias="roll-number", example="R001")
    class_name: str = Field(..., max_length=50, alias="class-name", example="Class 12A")
    email: Optional[str] = Field(None, max_length=100, example="john@example.com")

    class Config:
        populate_by_name = True


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    roll_number: Optional[str] = Field(None, alias="roll-number")
    class_name: Optional[str] = Field(None, alias="class-name")
    email: Optional[str] = None

    class Config:
        populate_by_name = True


class Student(StudentBase):
    id: str
    student_id: str = Field(..., alias="student-id")

    class Config:
        populate_by_name = True


# File-based persistence functions
def load_students() -> List[Student]:
    """Load students from JSON file."""
    if not STUDENTS_FILE.exists():
        # Return default students if file doesn't exist
        return [
            Student(
                id="stu-001",
                name="John Doe",
                roll_number="R001",
                class_name="Class 12A",
                email="john@example.com",
                student_id="STU001",
            ),
            Student(
                id="stu-002",
                name="Jane Smith",
                roll_number="R002",
                class_name="Class 12A",
                email="jane@example.com",
                student_id="STU002",
            ),
        ]
    
    try:
        with open(STUDENTS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Convert list of dicts to Student objects
            # Pydantic will handle aliases automatically
            students = []
            for item in data:
                try:
                    students.append(Student(**item))
                except Exception as e:
                    print(f"Error parsing student: {item}, error: {e}")
                    continue
            return students
    except FileNotFoundError:
        # File doesn't exist yet, return default
        return []
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        print(f"Error loading students from file: {e}")
        return []


def save_students(students: List[Student]) -> None:
    """Save students to JSON file."""
    try:
        # Convert Pydantic models to dict with aliases for JSON serialization
        data = []
        for student in students:
            # Try Pydantic v2 method first, fallback to v1
            try:
                student_dict = student.model_dump(by_alias=True)
            except AttributeError:
                # Pydantic v1
                student_dict = student.dict(by_alias=True)
            data.append(student_dict)
        
        with open(STUDENTS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving students to file: {e}")


# Load students from file on startup
students_db: List[Student] = load_students()


def _next_student_ids() -> tuple[str, str]:
    """
    Generate next id and studentId like stu-006 / STU006.
    """
    if not students_db:
        next_index = 1
    else:
        # ids are like "stu-001"
        last_num = max(int(s.id.split("-")[1]) for s in students_db)
        next_index = last_num + 1

    key = f"stu-{next_index:03d}"
    student_id = f"STU{next_index:03d}"
    return key, student_id


@app.get("/api/students", response_model=List[Student])
def list_students(search: Optional[str] = None):
    """
    Return all students (optionally filtered by simple search query).
    """
    if not search:
        return students_db

    query = search.strip().lower()
    return [
        s
        for s in students_db
        if query in s.name.lower()
        or query in s.roll_number.lower()
        or query in s.class_name.lower()
    ]


@app.get("/api/students/{student_id}", response_model=Student)
def get_student_by_id(student_id: str):
    """
    Get a single student by ID.
    """
    for student in students_db:
        if student.id == student_id:
            return student
    
    raise HTTPException(status_code=404, detail="Student not found")


@app.post("/api/students", response_model=Student, status_code=201)
def create_student(payload: StudentCreate):
    """
    Create a new student with validation.
    """
    import re

    validation_errors = {}

    # Validate required fields
    if not payload.name or not payload.name.strip():
        validation_errors["name"] = "Name is required and cannot be empty"

    if not payload.roll_number or not payload.roll_number.strip():
        validation_errors["roll-number"] = "Roll number is required and cannot be empty"

    if not payload.class_name or not payload.class_name.strip():
        validation_errors["class-name"] = "Class name is required and cannot be empty"

    # Validate email format if provided
    if payload.email and payload.email.strip():
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, payload.email.strip()):
            validation_errors["email"] = "Invalid email format"

    if validation_errors:
        raise HTTPException(status_code=400, detail=validation_errors)
    
    # Trim whitespace
    name = payload.name.strip()
    roll_number = payload.roll_number.strip()
    class_name = payload.class_name.strip()
    email = payload.email.strip() if payload.email and payload.email.strip() else None
    
    # Check for duplicate roll number
    for existing_student in students_db:
        if existing_student.roll_number.lower() == roll_number.lower():
            raise HTTPException(
                status_code=400,
                detail={"roll-number": f"Student with roll number '{roll_number}' already exists"}
            )
    
    # Check for duplicate email (if provided)
    if email:
        for existing_student in students_db:
            if existing_student.email and existing_student.email.lower() == email.lower():
                raise HTTPException(
                    status_code=400,
                    detail={"email": f"Student with email '{email}' already exists"}
                )
    
    # Create new student
    key, student_id = _next_student_ids()
    student = Student(
        id=key,
        name=name,
        roll_number=roll_number,
        class_name=class_name,
        email=email or "-",
        student_id=student_id,
    )
    students_db.append(student)
    save_students(students_db)  # Persist to file
    return student


@app.put("/api/students/{student_id}", response_model=Student)
def update_student(student_id: str, payload: StudentUpdate):
    """
    Update an existing student with validation.
    """
    student_to_update = None
    student_index = None
    
    for idx, s in enumerate(students_db):
        if s.id == student_id:
            student_to_update = s
            student_index = idx
            break
    
    if not student_to_update:
        raise HTTPException(status_code=404, detail="Student not found")

    validation_errors = {}

    if payload.name is not None and not payload.name.strip():
        validation_errors["name"] = "Name is required and cannot be empty"

    if payload.roll_number is not None and not payload.roll_number.strip():
        validation_errors["roll-number"] = "Roll number is required and cannot be empty"

    if payload.class_name is not None and not payload.class_name.strip():
        validation_errors["class-name"] = "Class name is required and cannot be empty"

    # Validate roll number if being updated
    if payload.roll_number and payload.roll_number.strip():
        for idx, existing_student in enumerate(students_db):
            if (existing_student.id != student_id and 
                existing_student.roll_number.lower() == payload.roll_number.lower().strip()):
                validation_errors["roll-number"] = (
                    f"Student with roll number '{payload.roll_number.strip()}' already exists"
                )
    
    # Validate email if being updated
    if payload.email and payload.email.strip():
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, payload.email.strip()):
            validation_errors["email"] = "Invalid email format"
        
        # Check for duplicate email
        for idx, existing_student in enumerate(students_db):
            if (existing_student.id != student_id and 
                existing_student.email and 
                existing_student.email.lower() == payload.email.lower().strip()):
                validation_errors["email"] = (
                    f"Student with email '{payload.email.strip()}' already exists"
                )

    if validation_errors:
        raise HTTPException(status_code=400, detail=validation_errors)
    
    # Update student
    updated = student_to_update.model_copy(
        update={
            "name": payload.name.strip() if payload.name and payload.name.strip() else student_to_update.name,
            "roll_number": payload.roll_number.strip() if payload.roll_number and payload.roll_number.strip() else student_to_update.roll_number,
            "class_name": payload.class_name.strip() if payload.class_name and payload.class_name.strip() else student_to_update.class_name,
            "email": payload.email.strip() if payload.email and payload.email.strip() else student_to_update.email,
        }
    )
    students_db[student_index] = updated
    save_students(students_db)  # Persist to file
    return updated


@app.delete("/api/students/{student_id}", status_code=204)
def delete_student(student_id: str):
    """
    Delete a student.
    """
    global students_db
    before = len(students_db)
    students_db = [s for s in students_db if s.id != student_id]
    if len(students_db) == before:
        raise HTTPException(status_code=404, detail="Student not found")
    save_students(students_db)  # Persist to file
    return JSONResponse(status_code=204, content=None)


@app.get("/api/students/{student_id}/assignments")
def list_student_assignments(student_id: str):
    """
    Simple mock of 'View Submitted Papers' for the Students page.
    Later this will read from the Assignments collection.
    """
    # Just return some demo data for now.
    demo = [
        {
            "key": "paper-1",
            "title": "Mathematics Final",
            "subject": "Mathematics",
            "dateTime": "Jan 2, 2026 10:45 AM",
            "score": 85,
            "total": 100,
            "percent": "85%",
        },
        {
            "key": "paper-2",
            "title": "Physics Midterm",
            "subject": "Physics",
            "dateTime": "Dec 28, 2025 2:30 PM",
            "score": 72,
            "total": 100,
            "percent": "72%",
        },
    ]
    # Return array directly (frontend expects array)
    return demo



