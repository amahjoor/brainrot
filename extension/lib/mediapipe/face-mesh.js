// Load MediaPipe Face Mesh from CDN
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js';
document.head.appendChild(script);

script.onload = () => {
    console.log('MediaPipe Face Mesh loaded');
};

window.BrainRot = {
    createFaceMesh: async () => {
        // Wait for MediaPipe to load
        while (!window.FaceMesh) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return new window.FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
            }
        });
    }
}; 