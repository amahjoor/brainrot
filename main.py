import cv2
from src.face_detector import FaceDetector
from src.instagram_controller import InstagramController
from dotenv import load_dotenv
import os

def main():
    # Load environment variables
    load_dotenv()
    
    # Get credentials with validation
    username = os.getenv('INSTAGRAM_USERNAME')
    password = os.getenv('INSTAGRAM_PASSWORD')
    
    # Debug print (remove these lines in production)
    print(f"Username loaded: {username is not None}")
    print(f"Password loaded: {password is not None}")
    
    if not username or not password:
        raise ValueError("""
            Instagram credentials not found in .env file!
            Please make sure you have a .env file with:
            INSTAGRAM_USERNAME=your_username
            INSTAGRAM_PASSWORD=your_password
        """)
    
    # Initialize components
    face_detector = FaceDetector()
    instagram = InstagramController()
    
    # Login
    instagram.login(username, password)
    
    # Initialize webcam
    cap = cv2.VideoCapture(0)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        # Detect gestures
        gesture = face_detector.detect_gesture(frame)
        
        # Handle gestures
        if gesture == "NOD_UP":
            instagram.next_reel()
        elif gesture == "NOD_DOWN":
            instagram.like_current_reel()
        elif gesture == "HEAD_TILT_RIGHT":
            instagram.save_current_reel()
            
        # Display frame (for debugging)
        cv2.imshow('Face Gesture Control', frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()