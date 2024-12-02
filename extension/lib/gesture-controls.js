class ScrollController {
    constructor() {
        this.isScrolling = false;
        this.scrollInterval = null;
        this.scrollDelay = 1000; // 1 second between scrolls
    }

    startScrolling() {
        if (this.isScrolling) return;
        
        console.log('Starting auto-scroll');
        this.isScrolling = true;
        
        this.scrollInterval = setInterval(() => {
            // Find YouTube's Shorts container
            const shortsContainer = document.querySelector('#shorts-container');
            const reelItems = document.querySelectorAll('ytd-reel-video-renderer');
            
            if (shortsContainer && reelItems.length > 0) {
                // Get the height of a single Short
                const shortHeight = reelItems[0].offsetHeight;
                
                // Scroll the container
                shortsContainer.scrollBy({
                    top: shortHeight,
                    behavior: 'instant'
                });
                
                console.log('Scrolled Shorts container by:', shortHeight);
            } else {
                // Fallback: try to find the active Short and scroll to the next one
                const activeShort = document.querySelector('ytd-reel-video-renderer[is-active]');
                if (activeShort && activeShort.nextElementSibling) {
                    activeShort.nextElementSibling.scrollIntoView({
                        behavior: 'instant',
                        block: 'center'
                    });
                    console.log('Scrolled to next Short using scrollIntoView');
                } else {
                    console.log('No Shorts container or active Short found');
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
}

// Export to global scope
window.ScrollController = ScrollController;