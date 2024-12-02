import cv2
import mediapipe as mp
import pyautogui
import time

# Setup MediaPipe
mp_face_mesh = mp.solutions.face_mesh
mp_hands = mp.solutions.hands
face_mesh = mp_face_mesh.FaceMesh(min_detection_confidence=0.5)
hands = mp_hands.Hands(min_detection_confidence=0.5)

# Eye aspect ratio function
def eye_aspect_ratio(eye):
    A = dist(eye[1], eye[5])
    B = dist(eye[2], eye[4])
    C = dist(eye[0], eye[3])
    ear = (A + B) / (2.0 * C)
    return ear

def dist(p1, p2):
    return ((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2) ** 0.5

# Initialize video capture
cap = cv2.VideoCapture(1)

blink_threshold = 0.25  # Adjusted for easier blink detection
ear_counter = 0
blink_duration = 0
scroll_threshold = 10
scroll_up_threshold = 15  # Longer for scrolling up
scroll_down_threshold = 3  # Shorter for scrolling down

# Define the coordinates for the "like" button (you may need to adjust these based on your screen resolution and Instagram layout)
LIKE_BUTTON_X = 1381  # Example value, adjust as needed
LIKE_BUTTON_Y = 619  # Example value, adjust as needed

# Variable to track if the video is liked
is_liked = False
last_thumb_time = 0  # Track the last time a thumbs-up gesture was made

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    # Convert frame to RGB
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(frame_rgb)
    hand_results = hands.process(frame_rgb)

    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            # Get eye landmarks
            left_eye = [face_landmarks.landmark[i] for i in [33, 160, 158, 133, 153, 144]]
            right_eye = [face_landmarks.landmark[i] for i in [362, 385, 386, 263, 373, 374]]
            
            # Convert landmarks to pixels
            h, w, _ = frame.shape
            left_eye = [(int(landmark.x * w), int(landmark.y * h)) for landmark in left_eye]
            right_eye = [(int(landmark.x * w), int(landmark.y * h)) for landmark in right_eye]
            
            # Calculate EAR for both eyes
            ear_left = eye_aspect_ratio(left_eye)
            ear_right = eye_aspect_ratio(right_eye)
            ear = (ear_left + ear_right) / 2
            
            # Detect blink
            if ear < blink_threshold:
                ear_counter += 1
                blink_duration += 1
                if blink_duration > scroll_down_threshold:  # Short blink for scroll down
                    pyautogui.scroll(-10)  # Scroll down
                    blink_duration = 0
                elif blink_duration > scroll_up_threshold:  # Long blink for scroll up
                    pyautogui.scroll(10)  # Scroll up
                    blink_duration = 0
            else:
                blink_duration = 0
                ear_counter = 0

    if hand_results.multi_hand_landmarks:
        for hand_landmarks in hand_results.multi_hand_landmarks:
            thumb_tip = hand_landmarks.landmark[mp_hands.HandLandmark.THUMB_TIP]
            thumb_ip = hand_landmarks.landmark[mp_hands.HandLandmark.THUMB_IP]

            # Check for thumbs-up gesture
            if thumb_tip.y < thumb_ip.y:
                current_time = time.time()
                # Only trigger once every 1 second to avoid spamming
                if current_time - last_thumb_time > 1:  
                    last_thumb_time = current_time
                    if not is_liked:
                        pyautogui.click(LIKE_BUTTON_X, LIKE_BUTTON_Y)  # Like the video
                        is_liked = True  # Mark as liked
                    else:
                        pyautogui.click(LIKE_BUTTON_X, LIKE_BUTTON_Y)  # Unlike the video
                        is_liked = False  # Mark as unliked

    # Display the frame
    cv2.imshow("Instagram Reels Control", frame)

    # Exit on ESC key
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()