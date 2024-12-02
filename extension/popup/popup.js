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

    async function checkContentScriptLoaded(tabId) {
        try {
            const response = await chrome.tabs.sendMessage(tabId, { command: "ping" });
            return response && response.status === "ok";
        } catch (error) {
            console.log("Content script not loaded:", error);
            return false;
        }
    }

    async function injectContentScript(tabId) {
        try {
            // Check if scripts are already loaded
            const response = await chrome.tabs.sendMessage(tabId, { command: "ping" });
            if (response && response.status === "ok") {
                console.log("Content scripts already loaded");
                return true;
            }
        } catch (error) {
            // Error means scripts aren't loaded, which is expected
            console.log("Content scripts not loaded, injecting...");
        }

        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: [
                    '/lib/camera-utils.js',
                    '/lib/face-mesh.js',
                    '/lib/face-detection.js',
                    '/lib/gesture-controls.js',
                    '/content/content.js'
                ]
            });
            console.log("Content scripts injected successfully");
            return true;
        } catch (error) {
            console.error("Failed to inject content scripts:", error);
            showError("Failed to load required libraries. Please refresh and try again.");
            return false;
        }
    }

    // Check if we're on Instagram or YouTube Shorts
    chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
        const url = tabs[0].url;
        const isValidPlatform = url.includes('instagram.com') || url.includes('youtube.com/shorts');
        
        if (!isValidPlatform) {
            disableControls('Please open Instagram Reels or YouTube Shorts');
            return;
        }
        
        try {
            // Check if content script is loaded
            const isLoaded = await checkContentScriptLoaded(tabs[0].id);
            if (!isLoaded) {
                console.log("Content script not loaded, attempting to inject...");
                const injected = await injectContentScript(tabs[0].id);
                if (!injected) {
                    throw new Error("Failed to inject content scripts");
                }
            }

            // Check current state
            const response = await chrome.tabs.sendMessage(tabs[0].id, {command: "getState"});
            if (response && response.isActive) {
                updateUI(true);
            }
        } catch (error) {
            console.error("Initialization error:", error);
            showError("Failed to initialize gesture controls. Please refresh the page and try again.");
        }
    });

    // Handle start/stop button click
    startButton.addEventListener('click', async () => {
        console.log('Start button clicked');
        if (!isActive) {
            try {
                startButton.disabled = true;
                
                // Get current tab
                const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
                console.log('Current tab:', tab.id);
                
                // Ensure content scripts are loaded
                const scriptsLoaded = await injectContentScript(tab.id);
                console.log('Scripts loaded:', scriptsLoaded);
                
                if (!scriptsLoaded) {
                    throw new Error('Failed to load required scripts');
                }

                // Send start command
                console.log('Sending startDetection command...');
                const response = await chrome.tabs.sendMessage(tab.id, {
                    command: "startDetection"
                });
                
                console.log('Received response:', response);
                
                if (response && response.success) {
                    updateUI(true);
                } else {
                    throw new Error(response?.error || 'Failed to start detection');
                }
            } catch (error) {
                console.error('Error starting detection:', error);
                showError(error.message);
                updateUI(false);
            } finally {
                startButton.disabled = false;
            }
        } else {
            try {
                const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
                console.log('Sending stopDetection command...');
                
                const response = await chrome.tabs.sendMessage(tab.id, {
                    command: "stopDetection"
                });
                
                console.log('Stop response:', response);
                
                if (response && response.success) {
                    updateUI(false);
                } else {
                    throw new Error('Failed to stop detection');
                }
            } catch (error) {
                console.error('Error stopping detection:', error);
                showError('Failed to stop gesture controls. Please refresh the page.');
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
        errorMessage.style.color = 'var(--error-color)';
        startButton.disabled = false;
        webcamStatus.textContent = 'Webcam: Error';
        webcamStatus.style.color = 'var(--error-color)';
        detectionStatus.textContent = 'Detection: Error';
        detectionStatus.style.color = 'var(--error-color)';
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