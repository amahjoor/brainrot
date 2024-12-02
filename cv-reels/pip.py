import tkinter as tk
import vlc
import time
# Function to stop the player and close the window gracefully
def on_close():
    print("Closing player...")
    player.stop()
    root.quit()

# Create the root Tkinter window (but keep it hidden)
root = tk.Tk()

# Hide the Tkinter window (so it's not visible)
root.withdraw()

# Set the video window size and properties
root.geometry("400x225")  # Size of the video window
root.attributes('-topmost', True)  # Keep the window on top

# Create a VLC instance
instance = vlc.Instance("--no-xlib")  # Option to prevent Xlib error (for Linux users)

# Create a VLC media player object
player = instance.media_player_new()

# Path to your downloaded video (ensure the path is correct)
video_path = r"C:\Users\ryanm\Downloads\ebbd2ab7e17370ea9750bddcb75468f9_001.mp4"  # Update path

# Check if the file exists before attempting to load it
import os
if not os.path.exists(video_path):
    print(f"Error: The file '{video_path}' does not exist.")
    on_close()
else:
    # Load the video file
    media = instance.media_new(video_path)
    player.set_media(media)

    # Set the window for VLC player (use the Tkinter window's handle)
    player.set_xwindow(root.winfo_id())  # For Windows/Linux

    # Play the video
    player.play()

    # Check if the player has started playing the video
    time.sleep(1)  # Allow time for the video to start
    if player.get_state() != vlc.State.Playing:
        print("Error: VLC player failed to start.")
        on_close()
    else:
        print("Video is playing...")

    # Ensure the video runs and the window stays open
    try:
        while True:
            root.update()  # Update the Tkinter window
            if player.get_state() == vlc.State.Ended:
                print("Video has finished.")
                break  # Stop if the video finishes
            time.sleep(0.1)
    except KeyboardInterrupt:
        print("Program interrupted. Closing...")
        on_close()  # Handle program exit
