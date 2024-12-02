if (typeof FaceDetector === 'undefined') {
    class FaceDetector {
        constructor() {
            console.log('FaceDetector constructor called');
            this.isInitialized = false;
            this.onGesture = null;
            this.lastBlink = 0;
            this.blinkDuration = 0;
            this.BLINK_THRESHOLD = 200; // ms to differentiate short/long blinks
        }

        async initialize() {
            console.log('Initializing FaceDetector...');
            try {
                this.faceMesh = new FaceMesh({
                    locateFile: (file) => {
                        return chrome.runtime.getURL(`lib/${file}`);
                    }
                });

                // Configure face mesh
                await this.faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                // Set up face mesh callback
                this.faceMesh.onResults((results) => {
                    this.processResults(results);
                });

                this.isInitialized = true;
                console.log('FaceDetector initialized successfully');
                return true;
            } catch (error) {
                console.error('FaceDetector initialization error:', error);
                throw error;
            }
        }

        async start(videoStream) {
            console.log('Starting face detection...');
            if (!this.isInitialized) {
                await this.initialize();
            }

            try {
                // Create video element for processing
                this.video = document.createElement('video');
                this.video.srcObject = videoStream;
                this.video.autoplay = true;
                
                // Start processing frames
                const camera = new Camera(this.video, {
                    onFrame: async () => {
                        await this.faceMesh.send({image: this.video});
                    },
                    width: 640,
                    height: 480
                });
                await camera.start();
                
                console.log('Face detection started');
            } catch (error) {
                console.error('Failed to start face detection:', error);
                throw error;
            }
        }

        processResults(results) {
            if (!results.multiFaceLandmarks || !results.multiFaceLandmarks.length) {
                return;
            }

            const landmarks = results.multiFaceLandmarks[0];
            const eyesClosed = this.areEyesClosed(landmarks);
            
            const now = Date.now();
            
            if (eyesClosed && this.lastBlink === 0) {
                // Eyes just closed
                this.lastBlink = now;
            } else if (!eyesClosed && this.lastBlink > 0) {
                // Eyes just opened
                this.blinkDuration = now - this.lastBlink;
                
                // Determine blink type
                if (this.blinkDuration < this.BLINK_THRESHOLD) {
                    this.onGesture?.('SHORT_BLINK');
                } else {
                    this.onGesture?.('LONG_BLINK');
                }
            }
        }

        areEyesClosed(landmarks) {
            // Implement eye closure detection logic here
            // For example, you can check the distance between eye landmarks
            // and determine if the eyes are closed based on a threshold
            return false;
        }
    }
    window.FaceDetector = FaceDetector;
}