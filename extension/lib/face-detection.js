if (typeof FaceDetector === 'undefined') {
    class FaceDetector {
        constructor() {
            console.log('FaceDetector constructor called');
            this.isInitialized = false;
            this.onGesture = null;
            this.lastBlink = 0;
            this.blinkDuration = 0;
            this.BLINK_THRESHOLD = 200;
            this.faceMesh = null;
            
            this.EAR_THRESHOLD = 0.2;
            this.lastEyeState = 'open';
        }

        async initialize() {
            console.log('Initializing FaceDetector...');
            try {
                if (!window.BrainRot) {
                    console.error('BrainRot namespace not found');
                    throw new Error('Required libraries not loaded');
                }

                console.log('Creating FaceMesh instance...');
                this.faceMesh = new window.BrainRot.FaceMesh({
                    locateFile: (file) => {
                        console.log('Loading MediaPipe file:', file);
                        const url = chrome.runtime.getURL(`lib/mediapipe/${file}`);
                        console.log('File URL:', url);
                        return url;
                    }
                });

                console.log('Configuring FaceMesh...');
                await this.faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                this.faceMesh.onResults((results) => {
                    if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
                        this.processLandmarks(results.multiFaceLandmarks[0]);
                    }
                });

                this.isInitialized = true;
                console.log('FaceDetector initialized successfully');
                return true;
            } catch (error) {
                console.error('FaceDetector initialization error:', error);
                throw error;
            }
        }

        processLandmarks(landmarks) {
            // Safety check for landmarks
            if (!landmarks || !Array.isArray(landmarks)) {
                console.log('Invalid landmarks data');
                return;
            }

            try {
                // Calculate eye aspect ratios
                const leftEAR = this.getEyeAspectRatio(landmarks, 'left');
                const rightEAR = this.getEyeAspectRatio(landmarks, 'right');
                const avgEAR = (leftEAR + rightEAR) / 2;

                const now = Date.now();
                
                // Detect blink
                if (avgEAR < this.EAR_THRESHOLD) {
                    // Eyes are closed
                    if (this.lastEyeState === 'open') {
                        // Blink just started
                        this.lastBlink = now;
                        this.lastEyeState = 'closed';
                        console.log('Eyes closed, EAR:', avgEAR);
                    }
                } else {
                    // Eyes are open
                    if (this.lastEyeState === 'closed') {
                        // Blink just ended
                        const blinkDuration = now - this.lastBlink;
                        
                        if (blinkDuration < this.BLINK_THRESHOLD) {
                            console.log('Short blink detected:', blinkDuration, 'ms');
                            this.onGesture?.('BLINK_SHORT');
                        } else {
                            console.log('Long blink detected:', blinkDuration, 'ms');
                            this.onGesture?.('BLINK_LONG');
                        }
                        
                        this.lastEyeState = 'open';
                        console.log('Eyes opened, EAR:', avgEAR);
                    }
                }
            } catch (error) {
                console.error('Error processing landmarks:', error);
            }
        }

        getEyeAspectRatio(landmarks, eye) {
            try {
                const indices = eye === 'left' ? {
                    vertical1: [159, 145],   // Upper & lower eye points
                    vertical2: [158, 153],   // Upper & lower eye points
                    horizontal: [133, 33]    // Inner & outer eye corners
                } : {
                    vertical1: [386, 374],   // Upper & lower eye points
                    vertical2: [385, 380],   // Upper & lower eye points
                    horizontal: [362, 263]   // Inner & outer eye corners
                };

                // Safety checks
                for (const points of Object.values(indices)) {
                    for (const idx of points) {
                        if (!landmarks[idx] || typeof landmarks[idx].x === 'undefined') {
                            console.log('Missing landmark:', idx);
                            return 1.0; // Return default "open" value
                        }
                    }
                }

                const v1 = this.getDistance(landmarks[indices.vertical1[0]], landmarks[indices.vertical1[1]]);
                const v2 = this.getDistance(landmarks[indices.vertical2[0]], landmarks[indices.vertical2[1]]);
                const h = this.getDistance(landmarks[indices.horizontal[0]], landmarks[indices.horizontal[1]]);

                if (h === 0) return 1.0; // Avoid division by zero
                return (v1 + v2) / (2.0 * h);
            } catch (error) {
                console.error('Error calculating EAR:', error);
                return 1.0; // Return default "open" value
            }
        }

        getDistance(p1, p2) {
            if (!p1 || !p2 || typeof p1.x === 'undefined' || typeof p2.x === 'undefined') {
                return 0;
            }
            return Math.sqrt(
                Math.pow(p2.x - p1.x, 2) + 
                Math.pow(p2.y - p1.y, 2)
            );
        }

        async start(videoStream) {
            console.log('Starting face detection...');
            if (!this.isInitialized) {
                await this.initialize();
            }

            try {
                this.video = document.createElement('video');
                this.video.srcObject = videoStream;
                this.video.autoplay = true;
                
                const camera = new window.BrainRot.Camera(this.video, {
                    onFrame: async () => {
                        if (this.faceMesh) {
                            await this.faceMesh.send({image: this.video});
                        }
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

        stop() {
            if (this.faceMesh) {
                this.faceMesh.close();
            }
            if (this.video) {
                this.video.srcObject = null;
            }
        }
    }
    window.FaceDetector = FaceDetector;
}