class ScrollController {
    constructor() {
        this.isScrolling = false;
        this.scrollInterval = null;
        this.scrollDelay = 1000; // Default: 1 second
        this.minDelay = 200;    // Minimum: 0.2 seconds
        this.maxDelay = 5000;   // Maximum: 5 seconds
    }

    setSpeed(delayInMs) {
        // Validate and set new delay
        this.scrollDelay = Math.min(Math.max(delayInMs, this.minDelay), this.maxDelay);
        console.log('Scroll speed set to:', this.scrollDelay, 'ms');

        // Restart scrolling if already active
        if (this.isScrolling) {
            this.stopScrolling();
            this.startScrolling();
        }
    }

    startScrolling() {
        if (this.isScrolling) return;
        
        console.log('Starting auto-scroll with delay:', this.scrollDelay);
        this.isScrolling = true;
        
        this.scrollInterval = setInterval(() => {
            // Find YouTube's Shorts container
            const shortsContainer = document.querySelector('#shorts-container');
            const reelItems = document.querySelectorAll('ytd-reel-video-renderer');
            
            if (shortsContainer && reelItems.length > 0) {
                const shortHeight = reelItems[0].offsetHeight;
                shortsContainer.scrollBy({
                    top: shortHeight,
                    behavior: 'instant'
                });
                console.log('Scrolled Shorts container by:', shortHeight);
            } else {
                const activeShort = document.querySelector('ytd-reel-video-renderer[is-active]');
                if (activeShort && activeShort.nextElementSibling) {
                    activeShort.nextElementSibling.scrollIntoView({
                        behavior: 'instant',
                        block: 'center'
                    });
                    console.log('Scrolled to next Short');
                }
            }
        }, this.scrollDelay);
    }

    stopScrolling() {
        if (!this.isScrolling) return;
        
        console.log('Stopping auto-scroll');
        this.isScrolling = false;
        
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
            this.scrollInterval = null;
        }
    }

    toggleScrolling() {
        if (this.isScrolling) {
            this.stopScrolling();
        } else {
            this.startScrolling();
        }
        return this.isScrolling;
    }

    getCurrentSpeed() {
        return this.scrollDelay;
    }
}

// Export to global scope
window.ScrollController = ScrollController;