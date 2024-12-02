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
            this.EAR_THRESHOLD = 0.25;   // Typical threshold for blink detection
            this.lastEyeState = 'open';
            this.consecutiveFrames = 0;
            this.CONSECUTIVE_FRAMES = 2;  // Number of frames to confirm blink

            // MediaPipe face mesh landmarks for eyes
            this.LEFT_EYE_INDICES = [33, 133, 159, 145, 144, 163];  // Simplified indices
            this.RIGHT_EYE_INDICES = [362, 263, 386, 374, 373, 390];  // Simplified indices
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
            const leftEAR = this.getEyeAspectRatio(landmarks, this.LEFT_EYE_INDICES);
            const rightEAR = this.getEyeAspectRatio(landmarks, this.RIGHT_EYE_INDICES);
            const avgEAR = (leftEAR + rightEAR) / 2;

            console.log('Current EAR:', avgEAR);

            const now = Date.now();
            
            // Detect blink
            if (avgEAR < this.EAR_THRESHOLD) {
                this.consecutiveFrames++;
                console.log('Eyes closing, consecutive frames:', this.consecutiveFrames);
                
                if (this.consecutiveFrames >= this.CONSECUTIVE_FRAMES && this.lastEyeState === 'open') {
                    // Blink started
                    this.lastBlink = now;
                    this.lastEyeState = 'closed';
                    console.log('Blink started, EAR:', avgEAR);
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

        getEyeAspectRatio(landmarks, indices) {
            // Get vertical distances
            const height1 = this.getDistance(
                landmarks[indices[1]],  // top
                landmarks[indices[5]]   // bottom
            );
            const height2 = this.getDistance(
                landmarks[indices[2]],  // top
                landmarks[indices[4]]   // bottom
            );
            
            // Get horizontal distance
            const width = this.getDistance(
                landmarks[indices[0]],  // outer
                landmarks[indices[3]]   // inner
            );
            
            // Calculate EAR
            if (width === 0) return 0;
            return ((height1 + height2) / (2.0 * width));
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