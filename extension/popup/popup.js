document.addEventListener('DOMContentLoaded', async () => {
    const startButton = document.getElementById('startGestures');
    const webcamStatus = document.getElementById('webcamStatus');
    const detectionStatus = document.getElementById('detectionStatus');
    const errorMessage = document.getElementById('errorMessage');
    const themeToggle = document.getElementById('themeToggle');
    const speedSlider = document.getElementById('speedSlider');
    const currentSpeedDisplay = document.getElementById('currentSpeed');

    let isActive = false;

    // Keep your existing theme toggle logic
    themeToggle.addEventListener('click', () => {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
    });

    // Add speed slider handler
    speedSlider.addEventListener('input', async (e) => {
        const speed = parseInt(e.target.value);
        updateSpeedDisplay(speed);
        
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.tabs.sendMessage(tabs[0].id, { 
            command: 'setSpeed', 
            speed: speed 
        });
    });

    function updateSpeedDisplay(speed) {
        const seconds = (speed / 1000).toFixed(1);
        currentSpeedDisplay.textContent = `Current: ${seconds} seconds`;
    }

    // Initialize speed from saved state
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tabs[0].id, { command: 'getState' });
        if (response && response.speed) {
            speedSlider.value = response.speed;
            updateSpeedDisplay(response.speed);
        }
    } catch (error) {
        console.error('Error getting initial state:', error);
    }

    // Keep your existing navigation handlers
    document.getElementById('goToReels').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://www.instagram.com/reels/' });
    });

    document.getElementById('goToShorts').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://www.youtube.com/shorts' });
    });

    // Keep your existing start/stop handler but update it to maintain speed setting
    startButton.addEventListener('click', async () => {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tabs[0].id, {
                command: 'startDetection'
            });

            if (response.success) {
                isActive = !isActive;
                updateUI();
            }
        } catch (error) {
            showError('Failed to communicate with the page. Please refresh and try again.');
        }
    });

    // Keep your existing helper functions
    function updateUI() {
        startButton.textContent = isActive ? 'Stop Gesture Control' : 'Start Gesture Control';
        startButton.classList.toggle('active', isActive);
        webcamStatus.textContent = `Webcam: ${isActive ? 'On' : 'Off'}`;
        detectionStatus.textContent = `Detection: ${isActive ? 'On' : 'Off'}`;
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    // Initial state check
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        try {
            const response = await chrome.tabs.sendMessage(tabs[0].id, { command: 'ping' });
            if (response.success) {
                const state = await chrome.tabs.sendMessage(tabs[0].id, { command: 'getState' });
                isActive = state.isScrolling;
                if (state.speed) {
                    speedSlider.value = state.speed;
                    updateSpeedDisplay(state.speed);
                }
                updateUI();
            }
        } catch (error) {
            showError('Please refresh the page to use gesture controls.');
        }
    });
});