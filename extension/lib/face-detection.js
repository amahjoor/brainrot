if (typeof FaceDetector === 'undefined') {
    class FaceDetector {
        constructor() {
            console.log('FaceDetector constructor called');
            this.isInitialized = false;
            this.onGesture = null;
            
            // Blink detection parameters
            this.lastBlink = 0;
            this.blinkDuration = 0;
            this.BLINK_THRESHOLD = 200;  // ms
            this.EAR_THRESHOLD = 0.2;    // Eye Aspect Ratio threshold
            this.lastEyeState = 'open';
            this.consecutiveFrames = 0;
            this.CONSECUTIVE_FRAMES = 3;  // Number of frames to confirm blink

            // MediaPipe face mesh landmarks for eyes
            this.LEFT_EYE_INDICES = {
                upper: [386, 374, 373, 390, 388, 387, 386],
                lower: [373, 374, 380, 379, 378, 377, 376, 375, 374]
            };
            this.RIGHT_EYE_INDICES = {
                upper: [159, 145, 144, 163, 161, 160, 159],
                lower: [145, 144, 153, 152, 151, 150, 149, 148, 147]
            };
        }

        async initialize() {
            console.log('Initializing FaceDetector...');
            try {
                this.faceMesh = await window.BrainRot.createFaceMesh();
                console.log('Face Mesh created');

                await this.faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });
                console.log('Face Mesh configured');

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
            // Calculate EAR for both eyes
            const leftEAR = this.getEyeAspectRatio(landmarks, 'left');
            const rightEAR = this.getEyeAspectRatio(landmarks, 'right');
            const avgEAR = (leftEAR + rightEAR) / 2;

            const now = Date.now();
            
            // Detect blink
            if (avgEAR < this.EAR_THRESHOLD) {
                this.consecutiveFrames++;
                
                if (this.consecutiveFrames >= this.CONSECUTIVE_FRAMES && this.lastEyeState === 'open') {
                    // Blink started
                    this.lastBlink = now;
                    this.lastEyeState = 'closed';
                    console.log('Eyes closed, EAR:', avgEAR);
                }
            } else {
                if (this.lastEyeState === 'closed' && this.consecutiveFrames >= this.CONSECUTIVE_FRAMES) {
                    // Blink ended
                    const blinkDuration = now - this.lastBlink;
                    
                    if (blinkDuration < this.BLINK_THRESHOLD) {
                        console.log('Short blink detected:', blinkDuration, 'ms');
                        this.onGesture?.('BLINK_SHORT');
                    } else {
                        console.log('Long blink detected:', blinkDuration, 'ms');
                        this.onGesture?.('BLINK_LONG');
                    }
                    
                    this.lastEyeState = 'open';
                }
                this.consecutiveFrames = 0;
            }
        }

        getEyeAspectRatio(landmarks, eye) {
            const indices = eye === 'left' ? this.LEFT_EYE_INDICES : this.RIGHT_EYE_INDICES;
            
            // Calculate vertical distances (height)
            let upperSum = 0;
            let lowerSum = 0;
            
            // Sum up distances between upper eye points
            for (let i = 1; i < indices.upper.length; i++) {
                upperSum += this.getDistance(
                    landmarks[indices.upper[i-1]],
                    landmarks[indices.upper[i]]
                );
            }
            
            // Sum up distances between lower eye points
            for (let i = 1; i < indices.lower.length; i++) {
                lowerSum += this.getDistance(
                    landmarks[indices.lower[i-1]],
                    landmarks[indices.lower[i]]
                );
            }

            // Calculate horizontal distance (width)
            const horizontal = this.getDistance(
                landmarks[indices.upper[0]],
                landmarks[indices.upper[3]]
            );

            // Calculate EAR: (upper + lower) / (2 * horizontal)
            if (horizontal === 0) return 1.0;
            return (upperSum + lowerSum) / (2.0 * horizontal);
        }

        getDistance(p1, p2) {
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

                this.camera = window.BrainRot.createCamera(this.video, {
                    onFrame: async () => {
                        if (this.faceMesh) {
                            await this.faceMesh.send({image: this.video});
                        }
                    },
                    width: 640,
                    height: 480
                });

                await this.camera.start();
                console.log('Face detection started');
            } catch (error) {
                console.error('Failed to start face detection:', error);
                throw error;
            }
        }

        stop() {
            if (this.camera) {
                this.camera.stop();
            }
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