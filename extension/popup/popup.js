document.addEventListener('DOMContentLoaded', function() {
    // Get UI elements
    const startButton = document.getElementById('startGestures');
    const webcamStatus = document.getElementById('webcamStatus');
    const detectionStatus = document.getElementById('detectionStatus');
    const errorMessage = document.getElementById('errorMessage');
    let isActive = false;

    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    // Load saved theme
    chrome.storage.local.get('theme', function(data) {
        if (data.theme) {
            html.setAttribute('data-theme', data.theme);
        }
    });

    // Check if we're on Instagram
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const url = tabs[0].url;
        if (!url.includes('instagram.com') && !url.includes('youtube.com/shorts')) {
            disableControls('Please open Instagram Reels or YouTube Shorts');
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
                // Send start command to content script
                const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
                const response = await chrome.tabs.sendMessage(tab.id, {
                    command: "startDetection"
                });
                
                if (response && response.success) {
                    updateUI(true);
                } else {
                    throw new Error(response.error || 'Failed to start detection');
                }
            } catch (error) {
                console.error('Error:', error);
                showError(error.message);
                updateUI(false);
            }
        } else {
            // Send stop command to content script
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            try {
                await chrome.tabs.sendMessage(tab.id, {command: "stopDetection"});
                updateUI(false);
            } catch (error) {
                console.error('Error stopping detection:', error);
            }
        }
    });

    function updateUI(active) {
        isActive = active;
        startButton.textContent = active ? 'Stop Gesture Control' : 'Start Gesture Control';
        startButton.className = active ? 'active' : '';
        webcamStatus.textContent = `Webcam: ${active ? 'Active' : 'Off'}`;
        detectionStatus.textContent = `Detection: ${active ? 'Active' : 'Off'}`;
        webcamStatus.style.color = active ? 'var(--active-color)' : 'var(--status-text)';
        detectionStatus.style.color = active ? 'var(--active-color)' : 'var(--status-text)';
        errorMessage.style.display = 'none';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        startButton.disabled = false;
    }

    function disableControls(message) {
        startButton.disabled = true;
        startButton.textContent = message;
        webcamStatus.style.display = 'none';
        detectionStatus.style.display = 'none';
    }

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        chrome.storage.local.set({ theme: newTheme });
    });

    // Quick Navigation Buttons
    const goToReels = document.getElementById('goToReels');
    const goToShorts = document.getElementById('goToShorts');

    goToReels.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://www.instagram.com/reels/' });
    });

    goToShorts.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://www.youtube.com/shorts' });
    });

    // Check current URL to highlight active platform
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const url = tabs[0].url;
        if (url.includes('instagram.com')) {
            goToReels.style.background = 'var(--active-color)';
        } else if (url.includes('youtube.com/shorts')) {
            goToShorts.style.background = 'var(--active-color)';
        }
    });

    // Add platform detection for error message
    function getPlatformName(url) {
        if (url.includes('instagram.com')) return 'Instagram Reels';
        if (url.includes('youtube.com/shorts')) return 'YouTube Shorts';
        return 'a supported platform';
    }

    function disableControls(url) {
        const platform = getPlatformName(url);
        startButton.disabled = true;
        startButton.textContent = `Please open ${platform} to use gesture controls`;
        webcamStatus.style.display = 'none';
        detectionStatus.style.display = 'none';
    }
});