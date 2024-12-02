(function() {
    if (!window.BrainRotController) {
        class SocialMediaController {
            constructor() {
                console.log('SocialMediaController constructor called');
                this.scrollController = new ScrollController();
                this.isGestureActive = false;
                this.isAutoScrollActive = false;
                this.setupMessageListener();
            }

            setupMessageListener() {
                chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                    console.log('Content script received message:', message);
                    
                    switch (message.command) {
                        case 'toggleGestureControl':
                            this.toggleGestureControl();
                            sendResponse({ success: true });
                            break;
                            
                        case 'toggleAutoScroll':
                            this.toggleAutoScroll();
                            sendResponse({ success: true });
                            break;
                            
                        case 'setSpeed':
                            this.scrollController.setSpeed(message.speed);
                            sendResponse({ success: true });
                            break;
                            
                        case 'getSpeed':
                            sendResponse({ 
                                speed: this.scrollController.getCurrentSpeed() 
                            });
                            break;
                            
                        case 'ping':
                            sendResponse({ success: true });
                            break;
                            
                        case 'getState':
                            sendResponse({
                                isActive: this.isGestureActive || this.isAutoScrollActive,
                                mode: this.isGestureActive ? 'gesture' : 'auto',
                                speed: this.scrollController.getCurrentSpeed()
                            });
                            break;
                    }
                });
            }

            async toggleGestureControl() {
                if (this.isAutoScrollActive) {
                    this.stopAutoScroll();
                }

                if (!this.isGestureActive) {
                    try {
                        // Start gesture detection
                        await this.startGestureRecognition();
                        this.isGestureActive = true;
                    } catch (error) {
                        console.error('Failed to start detection:', error);
                        throw error;
                    }
                } else {
                    // Stop gesture detection
                    this.stopGestureRecognition();
                    this.isGestureActive = false;
                }
            }

            toggleAutoScroll() {
                if (this.isGestureActive) {
                    this.stopGestureRecognition();
                    this.isGestureActive = false;
                }

                if (!this.isAutoScrollActive) {
                    this.scrollController.startScrolling();
                    this.isAutoScrollActive = true;
                } else {
                    this.stopAutoScroll();
                }
            }

            stopAutoScroll() {
                this.scrollController.stopScrolling();
                this.isAutoScrollActive = false;
            }

            // Keep your existing gesture recognition methods
            async startGestureRecognition() {
                // Your existing gesture recognition code
            }

            stopGestureRecognition() {
                // Your existing gesture stop code
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