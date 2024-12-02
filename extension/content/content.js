(function() {
    if (!window.BrainRotController) {
        class SocialMediaController {
            constructor() {
                console.log('SocialMediaController constructor called');
                this.isActive = false;
                this.isLiked = false;
                this.detector = null;
                this.videoStream = null;
                this.platform = this.detectPlatform();
                this.setupMessageListener();
                this.lastGestureTime = 0;
                this.gestureCooldown = 1000;
                this.videoPreview = null;
                this.showDebug = true;
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
                    console.log('Content script received message:', request);
                    
                    switch(request.command) {
                        case "ping":
                            sendResponse({ status: 'ok' });
                            break;
                            
                        case "startDetection":
                            console.log('Starting detection...');
                            this.startGestureRecognition()
                                .then(response => {
                                    console.log('Detection started:', response);
                                    sendResponse(response);
                                })
                                .catch(error => {
                                    console.error('Failed to start detection:', error);
                                    sendResponse({
                                        success: false,
                                        error: error.message
                                    });
                                });
                            return true; // Keep message channel open
                            
                        case "stopDetection":
                            console.log('Stopping detection...');
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

            createCameraPreview() {
                // Create preview container
                const previewContainer = document.createElement('div');
                previewContainer.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    z-index: 9999;
                    background: rgba(0, 0, 0, 0.7);
                    padding: 10px;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                `;

                // Create video element
                this.videoPreview = document.createElement('video');
                this.videoPreview.style.cssText = `
                    width: 160px;
                    height: 120px;
                    border-radius: 4px;
                `;
                this.videoPreview.autoplay = true;
                
                // Create close button
                const closeButton = document.createElement('button');
                closeButton.textContent = 'Close Preview';
                closeButton.style.cssText = `
                    padding: 5px;
                    border: none;
                    border-radius: 4px;
                    background: #ff4444;
                    color: white;
                    cursor: pointer;
                `;
                closeButton.onclick = () => previewContainer.remove();

                // Add status text
                const statusText = document.createElement('div');
                statusText.style.color = 'white';
                statusText.textContent = 'Camera Preview';

                // Assemble preview
                previewContainer.appendChild(statusText);
                previewContainer.appendChild(this.videoPreview);
                previewContainer.appendChild(closeButton);
                document.body.appendChild(previewContainer);
            }

            async startGestureRecognition() {
                console.log('startGestureRecognition called');
                if (this.isActive) {
                    console.log('Already active, returning');
                    return { success: true };
                }
                
                try {
                    // Check camera permission status
                    const permissionResult = await navigator.permissions.query({ name: 'camera' });
                    console.log('Camera permission status:', permissionResult.state);

                    // Request camera access
                    console.log('Requesting camera access...');
                    this.videoStream = await navigator.mediaDevices.getUserMedia({ 
                        video: { 
                            width: { ideal: 640 },
                            height: { ideal: 480 },
                            facingMode: "user",
                            frameRate: { ideal: 30 }
                        } 
                    });
                    console.log('Camera access granted');

                    // Show preview if debug is enabled
                    if (this.showDebug) {
                        console.log('Creating camera preview...');
                        this.createCameraPreview();
                        if (this.videoPreview) {
                            this.videoPreview.srcObject = this.videoStream;
                            console.log('Preview created and stream attached');
                        }
                    }

                    // Initialize detector
                    if (!this.detector) {
                        console.log('Initializing detector...');
                        this.detector = new FaceDetector();
                        
                        // Set up gesture handler
                        this.detector.onGesture = (gesture) => {
                            console.log('Gesture detected:', gesture);
                            switch(gesture) {
                                case 'BLINK_SHORT':
                                    // Scroll down for short blink
                                    window.scrollBy(0, 100);
                                    break;
                                case 'BLINK_LONG':
                                    // Scroll up for long blink
                                    window.scrollBy(0, -100);
                                    break;
                            }
                        };
                        
                        await this.detector.initialize();
                        console.log('Detector initialized');
                    }

                    // Start detection
                    console.log('Starting detector...');
                    await this.detector.start(this.videoStream);
                    this.isActive = true;
                    
                    console.log('Gesture recognition started successfully');
                    return { success: true };
                    
                } catch (error) {
                    console.error('Error in startGestureRecognition:', error);
                    this.stopGestureRecognition(); // Cleanup on error
                    throw error;
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
                
                if (this.videoPreview) {
                    this.videoPreview.parentElement?.remove();
                    this.videoPreview = null;
                }
                
                this.isActive = false;
                console.log("Gesture recognition stopped");
            }
        }

        window.BrainRotController = {
            Controller: SocialMediaController,
            instance: null,
            getInstance: function() {
                if (!this.instance) {
                    console.log('Creating new SocialMediaController instance');
                    this.instance = new this.Controller();
                }
                return this.instance;
            }
        };
    }

    if (!window.BrainRotController.instance) {
        console.log('Initializing BrainRotController...');
        window.BrainRotController.getInstance();
    }
})();