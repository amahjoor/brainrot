document.addEventListener('DOMContentLoaded', function() {
    // Get UI elements
    const startButton = document.getElementById('startGestures');
    const webcamStatus = document.getElementById('webcamStatus');
    const detectionStatus = document.getElementById('detectionStatus');
    let isActive = false;

    // Check if we're on Instagram
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const url = tabs[0].url;
        if (!url.includes('instagram.com')) {
            disableControls('Please open Instagram to use gesture controls');
            return;
        }
        
        // Check current state
        chrome.tabs.sendMessage(tabs[0].id, {command: "getState"}, function(response) {
            if (response && response.isActive) {
                updateUI(true);
            }
        });
    });

    // Handle start/stop button click
    startButton.addEventListener('click', async () => {
        if (!isActive) {
            try {
                // Request webcam permission
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: 640,
                        height: 480,
                        frameRate: { ideal: 30, max: 60 }
                    } 
                });
                
                // Send start command to content script
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {command: "startDetection"})
                        .then(response => {
                            if (response && response.success) {
                                updateUI(true);
                            } else {
                                throw new Error('Failed to start detection');
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            updateUI(false);
                            showError('Failed to start detection');
                        });
                });
                
            } catch (error) {
                console.error('Error:', error);
                showError(error.message || 'Failed to access webcam');
            }
        } else {
            // Send stop command to content script
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {command: "stopDetection"})
                    .then(() => updateUI(false))
                    .catch(error => console.error('Error stopping detection:', error));
            });
        }
    });

    function updateUI(active) {
        isActive = active;
        startButton.textContent = active ? 'Stop Gesture Control' : 'Start Gesture Control';
        startButton.className = active ? 'active' : '';
        webcamStatus.textContent = `Webcam: ${active ? 'Active' : 'Off'}`;
        detectionStatus.textContent = `Detection: ${active ? 'Active' : 'Off'}`;
        webcamStatus.style.color = active ? '#4CAF50' : '#666';
        detectionStatus.style.color = active ? '#4CAF50' : '#666';
    }

    function showError(message) {
        webcamStatus.textContent = 'Error: ' + message;
        webcamStatus.style.color = '#dc3545';
        startButton.disabled = false;
    }

    function disableControls(message) {
        startButton.disabled = true;
        startButton.textContent = message;
        webcamStatus.style.display = 'none';
        detectionStatus.style.display = 'none';
    }

    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    // Load saved theme
    chrome.storage.local.get('theme', function(data) {
        if (data.theme) {
            html.setAttribute('data-theme', data.theme);
        }
    });

    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        chrome.storage.local.set({ theme: newTheme });
    });
});