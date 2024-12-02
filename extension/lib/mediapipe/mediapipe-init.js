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
        
        // Create simulated landmarks for testing
        const landmarks = new Array(468).fill().map(() => ({
            x: 0.5,
            y: 0.5,
            z: 0
        }));
        
        // Simulate eye landmarks
        // Left eye
        landmarks[33] = { x: 0.3, y: 0.4, z: 0 };
        landmarks[133] = { x: 0.35, y: 0.4, z: 0 };
        landmarks[159] = { x: 0.3, y: 0.4, z: 0 };
        landmarks[145] = { x: 0.35, y: 0.4, z: 0 };
        landmarks[144] = { x: 0.4, y: 0.4, z: 0 };
        landmarks[163] = { x: 0.45, y: 0.4, z: 0 };
        landmarks[7] = { x: 0.3, y: 0.45, z: 0 };

        // Right eye
        landmarks[362] = { x: 0.6, y: 0.4, z: 0 };
        landmarks[263] = { x: 0.65, y: 0.4, z: 0 };
        landmarks[386] = { x: 0.6, y: 0.4, z: 0 };
        landmarks[374] = { x: 0.65, y: 0.4, z: 0 };
        landmarks[373] = { x: 0.7, y: 0.4, z: 0 };
        landmarks[390] = { x: 0.75, y: 0.4, z: 0 };
        landmarks[249] = { x: 0.6, y: 0.45, z: 0 };

        // Simulate blinking every 60 frames
        if (this.frameCount % 60 < 3) {
            // Eyes closed
            [33, 133, 159, 145, 144, 163, 7, 362, 263, 386, 374, 373, 390, 249].forEach(index => {
                landmarks[index].y += 0.1;  // Move eye points closer together
            });
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