(function() {
    if (!window.BrainRotController) {
        class SocialMediaController {
            constructor() {
                console.log('SocialMediaController constructor called');
                this.scrollController = new ScrollController();
                this.setupMessageListener();
            }

            setupMessageListener() {
                chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                    console.log('Content script received message:', message);
                    
                    switch (message.command) {
                        case 'startDetection':
                            this.toggleScrolling();
                            sendResponse({ success: true });
                            break;
                            
                        case 'stopDetection':
                            this.scrollController.stopScrolling();
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
                                isScrolling: this.scrollController.isScrolling,
                                speed: this.scrollController.getCurrentSpeed()
                            });
                            break;
                    }
                });
            }

            toggleScrolling() {
                this.scrollController.toggleScrolling();
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