// Initialize MediaPipe namespace
window.BrainRot = {};

// Create FaceMesh class
class FaceMesh {
    constructor() {
        console.log('Creating FaceMesh instance');
        this.onResultsCallback = null;
        this.isRunning = true;
        this.frameCount = 0;
    }

    async setOptions(options) {
        console.log('Setting FaceMesh options:', options);
        return Promise.resolve();
    }

    onResults(callback) {
        console.log('Setting results callback');
        this.onResultsCallback = callback;
    }

    async send(input) {
        if (!this.isRunning || !this.onResultsCallback) return;
        
        this.frameCount++;
        console.log('Processing frame:', this.frameCount);
        
        // Create simulated landmarks
        const landmarks = new Array(468).fill().map(() => ({
            x: 0.5,
            y: 0.5,
            z: 0
        }));
        
        // Set up eye landmarks with realistic proportions
        const normalEyeHeight = 0.01;  // Normal eye opening (1% of face height)
        const blinkEyeHeight = 0.001;  // Almost closed during blink
        const eyeWidth = 0.03;        // Eye width (3% of face width)
        
        // Determine if blinking
        const isBlinking = this.frameCount % 30 < 3;
        const eyeHeight = isBlinking ? blinkEyeHeight : normalEyeHeight;
        
        // Left eye landmarks (all coordinates are relative to face size)
        const leftEyeCenter = { x: 0.35, y: 0.4 };
        landmarks[33] = { x: leftEyeCenter.x - eyeWidth/2, y: leftEyeCenter.y, z: 0 };        // Outer corner
        landmarks[133] = { x: leftEyeCenter.x, y: leftEyeCenter.y - eyeHeight, z: 0 };        // Top
        landmarks[159] = { x: leftEyeCenter.x, y: leftEyeCenter.y - eyeHeight, z: 0 };        // Top
        landmarks[145] = { x: leftEyeCenter.x, y: leftEyeCenter.y + eyeHeight, z: 0 };        // Bottom
        landmarks[144] = { x: leftEyeCenter.x, y: leftEyeCenter.y + eyeHeight, z: 0 };        // Bottom
        landmarks[163] = { x: leftEyeCenter.x + eyeWidth/2, y: leftEyeCenter.y, z: 0 };       // Inner corner

        // Right eye landmarks (mirrored)
        const rightEyeCenter = { x: 0.65, y: 0.4 };
        landmarks[362] = { x: rightEyeCenter.x - eyeWidth/2, y: rightEyeCenter.y, z: 0 };     // Inner corner
        landmarks[263] = { x: rightEyeCenter.x, y: rightEyeCenter.y - eyeHeight, z: 0 };      // Top
        landmarks[386] = { x: rightEyeCenter.x, y: rightEyeCenter.y - eyeHeight, z: 0 };      // Top
        landmarks[374] = { x: rightEyeCenter.x, y: rightEyeCenter.y + eyeHeight, z: 0 };      // Bottom
        landmarks[373] = { x: rightEyeCenter.x, y: rightEyeCenter.y + eyeHeight, z: 0 };      // Bottom
        landmarks[390] = { x: rightEyeCenter.x + eyeWidth/2, y: rightEyeCenter.y, z: 0 };     // Outer corner

        if (isBlinking) {
            console.log('Simulating blink at frame:', this.frameCount);
        }

        this.onResultsCallback({
            multiFaceLandmarks: [landmarks]
        });
    }

    close() {
        console.log('Closing FaceMesh');
        this.isRunning = false;
    }
}

// Create Camera class
class Camera {
    constructor(videoElement, options = {}) {
        console.log('Creating Camera instance');
        this.video = videoElement;
        this.options = options;
        this.isRunning = false;
    }

    async start() {
        console.log('Starting camera');
        this.isRunning = true;
        
        const processFrame = async () => {
            if (!this.isRunning) return;
            
            if (this.options.onFrame) {
                await this.options.onFrame();
            }
            
            if (this.isRunning) {
                requestAnimationFrame(processFrame);
            }
        };

        processFrame();
        return Promise.resolve();
    }

    stop() {
        console.log('Stopping camera');
        this.isRunning = false;
    }
}

// Export to BrainRot namespace
window.BrainRot.createFaceMesh = () => {
    console.log('Creating new FaceMesh');
    return new FaceMesh();
};

window.BrainRot.createCamera = (video, options) => {
    console.log('Creating new Camera');
    return new Camera(video, options);
};

console.log('MediaPipe initialized'); 