document.addEventListener('DOMContentLoaded', async () => {
    const startButton = document.getElementById('startGestures');
    const webcamStatus = document.getElementById('webcamStatus');
    const detectionStatus = document.getElementById('detectionStatus');
    const errorMessage = document.getElementById('errorMessage');
    const themeToggle = document.getElementById('themeToggle');
    const speedSlider = document.getElementById('speedSlider');
    const currentSpeedDisplay = document.getElementById('currentSpeed');
    const speedControl = document.querySelector('.speed-control');
    const modeInputs = document.querySelectorAll('input[name="controlMode"]');

    let isActive = false;
    let currentMode = 'gesture';

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
    });

    // Mode switching
    modeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            currentMode = e.target.value;
            speedControl.classList.toggle('visible', currentMode === 'auto');
            updateButtonText();
            if (isActive) {
                // Stop current mode before switching
                toggleControl(false);
            }
        });
    });

    // Speed control
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

    // Start/Stop button
    startButton.addEventListener('click', async () => {
        try {
            isActive = !isActive;
            await toggleControl(isActive);
            updateUI();
        } catch (error) {
            showError('Failed to communicate with the page. Please refresh and try again.');
        }
    });

    async function toggleControl(shouldStart) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const command = currentMode === 'gesture' ? 'toggleGestureControl' : 'toggleAutoScroll';
        
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
            command: command,
            state: shouldStart
        });

        if (!response.success) {
            throw new Error('Failed to toggle control');
        }
    }

    function updateButtonText() {
        const action = isActive ? 'Stop' : 'Start';
        const mode = currentMode === 'gesture' ? 'Gesture Control' : 'Auto-Scroll';
        startButton.textContent = `${action} ${mode}`;
    }

    function updateUI() {
        updateButtonText();
        startButton.classList.toggle('active', isActive);
        
        if (currentMode === 'gesture') {
            webcamStatus.textContent = `Webcam: ${isActive ? 'On' : 'Off'}`;
            detectionStatus.textContent = `Detection: ${isActive ? 'On' : 'Off'}`;
            webcamStatus.style.display = 'block';
            detectionStatus.style.display = 'block';
        } else {
            webcamStatus.style.display = 'none';
            detectionStatus.style.display = 'none';
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    // Navigation
    document.getElementById('goToReels').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://www.instagram.com/reels/' });
    });

    document.getElementById('goToShorts').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://www.youtube.com/shorts' });
    });

    // Initial state check
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        try {
            const response = await chrome.tabs.sendMessage(tabs[0].id, { command: 'getState' });
            if (response) {
                isActive = response.isActive;
                currentMode = response.mode || 'gesture';
                
                // Set initial mode
                document.querySelector(`input[value="${currentMode}"]`).checked = true;
                speedControl.classList.toggle('visible', currentMode === 'auto');
                
                // Set initial speed if available
                if (response.speed) {
                    speedSlider.value = response.speed;
                    updateSpeedDisplay(response.speed);
                }
                
                updateUI();
            }
        } catch (error) {
            showError('Please refresh the page to use controls.');
        }
    });
});