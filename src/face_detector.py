import cv2
import mediapipe as mp

class FaceDetector:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def detect_gesture(self, frame):
        # Convert BGR to RGB
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(image)
        
        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0]
            # Get nose tip and forehead points
            nose_tip = landmarks.landmark[4]
            forehead = landmarks.landmark[151]
            
            # Calculate head pose
            head_angle = (forehead.y - nose_tip.y) * 100
            
            # Basic gesture detection
            if head_angle > 10:  # Threshold can be adjusted
                return "NOD_UP"
            elif head_angle < -10:
                return "NOD_DOWN"
            
        return None