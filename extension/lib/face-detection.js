class FaceDetector {
    constructor() {
        this.faceMesh = null;
        this.camera = null;
        this.onGestureCallback = null;
        this.isActive = false;
        this.lastBlinkTime = 0;
        this.blinkCooldown = 500; // 500ms cooldown for blinks
    }

    async initialize() {
        // Load MediaPipe FaceMesh
        this.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        // Configure FaceMesh
        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        // Set up result handling
        this.faceMesh.onResults((results) => this.processResults(results));
    }

    async start(videoStream) {
        if (this.isActive) return;

        // Initialize camera with the provided stream
        this.camera = new Camera(videoStream, {
            onFrame: async () => {
                if (this.isActive) {
                    await this.faceMesh.send({image: this.camera.video});
                }
            },
            width: 640,
            height: 480
        });

        this.isActive = true;
        await this.camera.start();
    }

    stop() {
        this.isActive = false;
        if (this.camera) {
            this.camera.stop();
            this.camera = null;
        }
    }

    onGesture(callback) {
        this.onGestureCallback = callback;
    }

    processResults(results) {
        if (!results.multiFaceLandmarks || !results.multiFaceLandmarks[0]) return;

        const landmarks = results.multiFaceLandmarks[0];
        
        // Check for blink
        const leftEye = this.getEyeAspectRatio(landmarks, 'left');
        const rightEye = this.getEyeAspectRatio(landmarks, 'right');
        const avgEAR = (leftEye + rightEye) / 2;

        // Check head tilt
        const headTilt = this.getHeadTilt(landmarks);

        // Detect gestures
        this.detectGestures(avgEAR, headTilt);
    }

    getEyeAspectRatio(landmarks, eye) {
        // Eye landmark indices for MediaPipe FaceMesh
        const eyeIndices = eye === 'left' ? 
            [[33, 160], [158, 133], [153, 144]] : // Left eye
            [[362, 385], [387, 373], [380, 374]]; // Right eye

        const points = eyeIndices.map(([p1, p2]) => ({
            distance: this.euclideanDistance(
                landmarks[p1],
                landmarks[p2]
            )
        }));

        // Calculate EAR
        return (points[0].distance + points[1].distance) / (2 * points[2].distance);
    }

    getHeadTilt(landmarks) {
        // Use eye landmarks to determine head tilt
        const leftEye = landmarks[33];
        const rightEye = landmarks[362];
        
        return Math.atan2(
            rightEye.y - leftEye.y,
            rightEye.x - leftEye.x
        ) * (180 / Math.PI);
    }

    detectGestures(eyeAspectRatio, headTilt) {
        const now = Date.now();

        // Blink detection
        if (eyeAspectRatio < 0.2 && (now - this.lastBlinkTime) > this.blinkCooldown) {
            this.lastBlinkTime = now;
            this.onGestureCallback?.('BLINK');
        }

        // Head tilt detection
        if (headTilt > 15) {
            this.onGestureCallback?.('HEAD_TILT_RIGHT');
        } else if (headTilt < -15) {
            this.onGestureCallback?.('HEAD_TILT_LEFT');
        }
    }

    euclideanDistance(point1, point2) {
        return Math.sqrt(
            Math.pow(point2.x - point1.x, 2) +
            Math.pow(point2.y - point1.y, 2)
        );
    }
}