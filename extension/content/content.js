class InstagramController {
    constructor() {
        this.isActive = false;
        this.isLiked = false;
        this.detector = null;
        this.videoStream = null;
        this.setupMessageListener();
        this.lastGestureTime = 0;
        this.gestureCooldown = 1000; // 1 second cooldown
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch(request.command) {
                case "startDetection":
                    this.startGestureRecognition();
                    sendResponse({success: true});
                    break;
                case "stopDetection":
                    this.stopGestureRecognition();
                    sendResponse({success: true});
                    break;
                case "getState":
                    sendResponse({isActive: this.isActive});
                    break;
            }
            return true; // Keep message channel open for async response
        });
    }

    async startGestureRecognition() {
        if (this.isActive) return;
        
        try {
            // Initialize video stream
            this.videoStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640,
                    height: 480,
                    frameRate: { ideal: 30, max: 60 }
                } 
            });

            // Initialize detector if not already done
            if (!this.detector) {
                this.detector = new FaceDetector();
                await this.detector.initialize();
            }

            // Start detection
            this.detector.onGesture((gesture) => this.handleGesture(gesture));
            await this.detector.start(this.videoStream);
            
            this.isActive = true;
            console.log("Gesture recognition started");
            
        } catch (error) {
            console.error("Error starting gesture recognition:", error);
            this.stopGestureRecognition();
        }
    }

    stopGestureRecognition() {
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
        }
        
        if (this.detector) {
            this.detector.stop();
        }
        
        this.isActive = false;
        console.log("Gesture recognition stopped");
    }

    handleGesture(gesture) {
        const now = Date.now();
        if (now - this.lastGestureTime < this.gestureCooldown) {
            return; // Still in cooldown
        }
        
        switch(gesture) {
            case 'BLINK':
                this.scrollToNextReel();
                break;
            case 'THUMBS_UP':
                this.toggleLike();
                break;
            case 'HEAD_TILT_RIGHT':
                this.saveReel();
                break;
        }
        
        this.lastGestureTime = now;
    }

    scrollToNextReel() {
        console.log("Scrolling to next reel");
        window.scrollBy({
            top: window.innerHeight,
            behavior: 'smooth'
        });
    }

    toggleLike() {
        console.log("Toggling like");
        const likeButton = document.querySelector('span.xp7jhwk [aria-label="Like"]');
        if (likeButton) {
            likeButton.click();
            this.isLiked = !this.isLiked;
        }
    }

    saveReel() {
        console.log("Saving reel");
        const saveButton = document.querySelector('[aria-label="Save"]');
        if (saveButton) {
            saveButton.click();
        }
    }
}

// Initialize controller when content script loads
const controller = new InstagramController();