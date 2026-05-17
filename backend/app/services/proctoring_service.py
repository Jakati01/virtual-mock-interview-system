import cv2
import numpy as np

# Try to import mediapipe, but make it optional
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    mp = None
    MEDIAPIPE_AVAILABLE = False

class ProctoringAI:
    def __init__(self):
        if not MEDIAPIPE_AVAILABLE:
            print("[WARNING] MediaPipe not available. Proctoring features disabled.")
            self.face_detection = None
            return

        try:
            # Now that we are on a stable version, this standard import will work perfectly
            self.mp_face_detection = mp.solutions.face_detection
            self.face_detection = self.mp_face_detection.FaceDetection(
                model_selection=0,
                min_detection_confidence=0.5
            )
        except Exception as e:
            print(f"[ERROR] Failed to initialize MediaPipe face detection: {e}")
            print("[WARNING] Proctoring features disabled due to MediaPipe error.")
            self.face_detection = None

    def analyze_frame(self, image_bytes):
        if self.face_detection is None:
            return {
                "status": "Disabled",
                "violations": ["Proctoring service unavailable"],
                "face_count": 0
            }

        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return {"status": "Error", "violations": ["Invalid Image"]}

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_detection.process(rgb_frame)

        status = "Safe"
        violations = []
        face_count = len(results.detections) if results.detections else 0

        if face_count == 0:
            status = "Warning"
            violations.append("No face detected!")
        elif face_count > 1:
            status = "Danger"
            violations.append("Multiple faces detected!")

        return {
            "status": status,
            "violations": violations,
            "face_count": face_count
        }

proctor_ai = ProctoringAI()