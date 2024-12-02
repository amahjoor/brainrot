import cv2
import mediapipe as mp
import pyautogui
import time
import subprocess
import multiprocessing  # For forking the process

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
cap = cv2.VideoCapture(0)

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

# Function to execute a Python script in a child process
def run_python_script(script_path):
    # Create a child process to run the script
    process = multiprocessing.Process(target=subprocess.run, args=(["python", script_path],))
    process.start()
    process.join()  # Wait for the child process to finish

# Function to detect if the head is turned left
def head_turned_left(face_landmarks, frame):
    h, w, _ = frame.shape
    # Get the coordinates of the nose and eyes (use appropriate indices)
    nose = face_landmarks.landmark[1]  # Index for nose (adjust if needed)
    left_eye = face_landmarks.landmark[33]  # Index for left eye (adjust if needed)
    right_eye = face_landmarks.landmark[133]  # Index for right eye (adjust if needed)
    
    # Convert nose and eye coordinates to pixel values
    nose_x = int(nose.x * w)
    left_eye_x = int(left_eye.x * w)
    right_eye_x = int(right_eye.x * w)
    
    # Calculate the horizontal midpoint of the face
    face_midpoint = (left_eye_x + right_eye_x) // 2

    # If the nose is significantly to the left of the midpoint, the head is turned left
    if nose_x < face_midpoint - 30:  # Adjust the threshold as needed
        return True
    return False

# Function to detect if both middle fingers are extended
def is_double_middle_finger(hand_landmarks1, hand_landmarks2):
    # Get the landmarks for both hands' middle finger tips and knuckles
    middle_finger_tip_1 = hand_landmarks1.landmark[mp_hands.HandLandmark.MIDDLE_FINGER_TIP]
    middle_finger_knuckle_1 = hand_landmarks1.landmark[mp_hands.HandLandmark.MIDDLE_FINGER_MCP]
    middle_finger_tip_2 = hand_landmarks2.landmark[mp_hands.HandLandmark.MIDDLE_FINGER_TIP]
    middle_finger_knuckle_2 = hand_landmarks2.landmark[mp_hands.HandLandmark.MIDDLE_FINGER_MCP]
    
    # Check if both middle fingers are extended
    if middle_finger_tip_1.y < middle_finger_knuckle_1.y and middle_finger_tip_2.y < middle_finger_knuckle_2.y:
        return True
    return False

# Function to detect head nod
def head_nod(face_landmarks, frame, last_chin_y):
    # Get the coordinates of the chin (use appropriate index)
    chin = face_landmarks.landmark[152]  # Index for chin (adjust if needed)
    
    h, w, _ = frame.shape
    chin_y = int(chin.y * h)

    # If the chin moves up compared to the last position, we have a head nod
    if chin_y < last_chin_y - 20:  # Adjust threshold as needed
        return True, chin_y
    return False, chin_y

# Initialize the last chin position
last_chin_y = 0

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
            

            # Detect head nod for scrolling up
            head_nod_detected, last_chin_y = head_nod(face_landmarks, frame, last_chin_y)
            if head_nod_detected:
                print("Head nod detected! Scrolling up...")
                pyautogui.scroll(10)  # Scroll up
                time.sleep(1)  # Prevent excessive scrolling

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
                    time.sleep(1.25)
            else:
                blink_duration = 0
                ear_counter = 0

    if hand_results.multi_hand_landmarks:
        # Check if both hands are detected
        if len(hand_results.multi_hand_landmarks) == 2:
            hand_landmarks1 = hand_results.multi_hand_landmarks[0]
            hand_landmarks2 = hand_results.multi_hand_landmarks[1]
            
            # Check for double middle finger gesture
            if is_double_middle_finger(hand_landmarks1, hand_landmarks2):
                print("Double middle finger detected! Running the Python script...")
                run_python_script("./pip.py")  # Replace with the path to your script
                time.sleep(2)  # Prevent running the script repeatedly

            thumb_tip = hand_landmarks1.landmark[mp_hands.HandLandmark.THUMB_TIP]
            thumb_ip = hand_landmarks1.landmark[mp_hands.HandLandmark.THUMB_IP]

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
    if cv2.waitKey(1) & 0xFF == 27:  # 27 is the ASCII code for ESC key
        break