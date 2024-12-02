// Define global namespace
window.BrainRot = window.BrainRot || {};

// Define FaceMesh class
window.BrainRot.FaceMesh = class FaceMesh {
    constructor(options = {}) {
        console.log('Creating new FaceMesh instance');
        this.options = options;
        this.onResultsCallback = null;
        this.isRunning = true;
        this.frameCount = 0;
    }

    setOptions(options) {
        console.log('Setting FaceMesh options:', options);
        this.options = { ...this.options, ...options };
        return Promise.resolve();
    }

    onResults(callback) {
        console.log('Setting results callback');
        this.onResultsCallback = callback;
    }

    send({ image }) {
        if (!this.isRunning || !this.onResultsCallback) return;
        
        // Simulate face landmarks for testing blink detection
        const landmarks = new Array(468).fill(null);
        
        // Left eye landmarks
        landmarks[33] = { x: 0.3, y: 0.4, z: 0 };
        landmarks[160] = { x: 0.35, y: 0.4, z: 0 };
        landmarks[158] = { x: 0.4, y: 0.4, z: 0 };
        landmarks[133] = { x: 0.3, y: 0.45, z: 0 };
        landmarks[153] = { x: 0.35, y: 0.45, z: 0 };
        landmarks[144] = { x: 0.4, y: 0.45, z: 0 };

        // Right eye landmarks
        landmarks[362] = { x: 0.6, y: 0.4, z: 0 };
        landmarks[385] = { x: 0.65, y: 0.4, z: 0 };
        landmarks[386] = { x: 0.7, y: 0.4, z: 0 };
        landmarks[263] = { x: 0.6, y: 0.45, z: 0 };
        landmarks[373] = { x: 0.65, y: 0.45, z: 0 };
        landmarks[374] = { x: 0.7, y: 0.45, z: 0 };

        // Simulate blinking every 60 frames
        this.frameCount++;
        if (this.frameCount % 60 < 5) {
            // Eyes closed
            landmarks.forEach(landmark => {
                if (landmark) landmark.y += 0.02;
            });
        }

        this.onResultsCallback({
            multiFaceLandmarks: [landmarks]
        });

        return Promise.resolve();
    }

    close() {
        console.log('Closing FaceMesh');
        this.isRunning = false;
    }
};

// Define Camera class
window.BrainRot.Camera = class Camera {
    constructor(videoElement, options = {}) {
        console.log('Creating new Camera instance');
        this.video = videoElement;
        this.options = options;
        this.isRunning = false;
    }

    start() {
        console.log('Starting camera processing');
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
        console.log('Stopping camera processing');
        this.isRunning = false;
    }
};

// Make classes globally available
window.FaceMesh = window.BrainRot.FaceMesh;
window.Camera = window.BrainRot.Camera;

console.log('MediaPipe bundle loaded successfully'); 