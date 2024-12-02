// Initialize BrainRot namespace
window.BrainRot = {};

// Load MediaPipe scripts
const loadScript = async (src) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

// Wait for MediaPipe dependencies to load
const waitForMediaPipe = async () => {
    try {
        // Load MediaPipe Face Mesh
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
        
        // Load Camera Utils
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        
        console.log('MediaPipe scripts loaded');
        
        // Wait for classes to be available
        let attempts = 0;
        while ((!window.FaceMesh || !window.Camera) && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            console.log('Waiting for MediaPipe...', attempts);
        }

        if (!window.FaceMesh || !window.Camera) {
            throw new Error('MediaPipe classes not available after loading');
        }

        console.log('MediaPipe loaded successfully');
        return true;
    } catch (error) {
        console.error('Failed to load MediaPipe:', error);
        throw error;
    }
};

// Initialize BrainRot API
const initializeBrainRot = async () => {
    console.log('Initializing BrainRot...');
    
    try {
        await waitForMediaPipe();

        // Define FaceMesh creation
        window.BrainRot.createFaceMesh = async () => {
            console.log('Creating new FaceMesh instance');
            const faceMesh = new window.FaceMesh({
                locateFile: (file) => {
                    console.log('Loading MediaPipe file:', file);
                    return chrome.runtime.getURL(`lib/mediapipe/${file}`);
                }
            });
            return faceMesh;
        };

        // Define Camera creation
        window.BrainRot.createCamera = (videoElement, options) => {
            console.log('Creating new Camera instance');
            return new window.Camera(videoElement, {
                ...options,
                locateFile: (file) => {
                    console.log('Loading Camera file:', file);
                    return chrome.runtime.getURL(`lib/mediapipe/${file}`);
                }
            });
        };

        console.log('BrainRot API initialized successfully');
    } catch (error) {
        console.error('Failed to initialize BrainRot:', error);
        throw error;
    }
};

// Initialize immediately
console.log('Starting BrainRot initialization...');
initializeBrainRot().catch(error => {
    console.error('BrainRot initialization failed:', error);
}); 