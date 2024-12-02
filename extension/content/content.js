class SocialMediaController {
    constructor() {
        this.isActive = false;
        this.isLiked = false;
        this.detector = null;
        this.videoStream = null;
        this.platform = this.detectPlatform();
        this.setupMessageListener();
        this.lastGestureTime = 0;
        this.gestureCooldown = 1000;
    }

    detectPlatform() {
        const url = window.location.href;
        if (url.includes('instagram.com')) return 'instagram';
        if (url.includes('youtube.com/shorts')) return 'youtube';
        return null;
    }

    getPlatformSelectors() {
        const selectors = {
            instagram: {
                nextButton: '[aria-label="Next"]',
                previousButton: '[aria-label="Previous"]',
                likeButton: '[aria-label="Like"]',
                unlikeButton: '[aria-label="Unlike"]'
            },
            youtube: {
                nextButton: '.ytd-shorts-player-controls button[aria-label="Next video"]',
                previousButton: '.ytd-shorts-player-controls button[aria-label="Previous video"]',
                likeButton: '#like-button button',
                unlikeButton: '#like-button button[aria-pressed="true"]'
            }
        };
        return selectors[this.platform] || null;
    }

    handleGesture(gesture) {
        const now = Date.now();
        if (now - this.lastGestureTime < this.gestureCooldown) return;

        const selectors = this.getPlatformSelectors();
        if (!selectors) return;

        switch (gesture) {
            case 'BLINK_SHORT':
                this.clickElement(selectors.nextButton);
                break;
            case 'BLINK_LONG':
                this.clickElement(selectors.previousButton);
                break;
            case 'THUMBS_UP':
                const likeButton = this.isLiked ? 
                    selectors.unlikeButton : 
                    selectors.likeButton;
                this.clickElement(likeButton);
                this.isLiked = !this.isLiked;
                break;
        }

        this.lastGestureTime = now;
    }

    clickElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.click();
            console.log(`Clicked ${selector}`);
        }
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('Received message:', request);
            
            switch(request.command) {
                case "startDetection":
                    this.startGestureRecognition()
                        .then(response => sendResponse(response))
                        .catch(error => sendResponse({
                            success: false,
                            error: error.message
                        }));
                    return true; // Keep message channel open
                    
                case "stopDetection":
                    this.stopGestureRecognition();
                    sendResponse({success: true});
                    break;
                    
                case "getState":
                    sendResponse({isActive: this.isActive});
                    break;
            }
            return true; // Keep message channel open
        });
    }

    async startGestureRecognition() {
        if (this.isActive) return { success: true };
        
        try {
            // Check camera permission status
            const permissionResult = await navigator.permissions.query({ name: 'camera' });
            console.log('Camera permission status:', permissionResult.state);

            // Request camera access
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
            await this.detector.start(this.videoStream);
            this.isActive = true;
            
            return { success: true };
            
        } catch (error) {
            console.error('Error starting gesture recognition:', error);
            let errorMessage = '';
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = 'Camera access denied. To fix this:\n' +
                    '1. Click the camera icon in the address bar\n' +
                    '2. Select "Allow"\n' +
                    '3. Refresh the page and try again';
            } else {
                errorMessage = error.message || 'Failed to start gesture recognition';
            }
            
            return { 
                success: false, 
                error: errorMessage 
            };
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
}

// Initialize controller when content script loads
const controller = new SocialMediaController();