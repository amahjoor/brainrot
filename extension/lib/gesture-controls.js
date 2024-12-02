class GestureController {
    constructor() {
        this.detector = null;
        this.isActive = false;
        this.gestureHandlers = new Map();
        this.lastGestureTime = 0;
        this.gestureCooldown = 1000; // 1 second cooldown between gestures
        this.isLiked = false;
    }

    async initialize() {
        this.detector = new FaceDetector();
        await this.detector.initialize();

        // Set up default gesture handlers
        this.setupDefaultGestures();
        
        // Set up gesture detection callback
        this.detector.onGesture((gesture) => this.handleGesture(gesture));
    }

    setupDefaultGestures() {
        // Default gesture mappings matching Python implementation
        this.gestureHandlers.set('BLINK_SHORT', {
            description: 'Scroll down',
            cooldown: 500,
            handler: () => this.emit('scrollDown')
        });

        this.gestureHandlers.set('BLINK_LONG', {
            description: 'Scroll up',
            cooldown: 500,
            handler: () => this.emit('scrollUp')
        });

        this.gestureHandlers.set('THUMBS_UP', {
            description: 'Like/Unlike reel',
            cooldown: 1000, // 1 second cooldown as in Python
            handler: () => {
                this.isLiked = !this.isLiked;
                this.emit('toggleLike', this.isLiked);
            }
        });
    }

    async start(videoStream) {
        if (this.isActive) return;
        
        try {
            await this.detector.start(videoStream);
            this.isActive = true;
            this.emit('stateChange', true);
        } catch (error) {
            console.error('Failed to start gesture detection:', error);
            this.emit('error', error);
        }
    }

    stop() {
        if (!this.isActive) return;
        
        this.detector.stop();
        this.isActive = false;
        this.emit('stateChange', false);
    }

    handleGesture(gesture) {
        const now = Date.now();
        const handler = this.gestureHandlers.get(gesture);

        if (!handler) return;

        // Check cooldown
        if (now - this.lastGestureTime < handler.cooldown) {
            return;
        }

        // Execute gesture handler
        handler.handler();
        this.lastGestureTime = now;

        // Emit gesture event for logging/debugging
        this.emit('gestureDetected', gesture);
    }

    // Add custom gesture handler
    addGestureHandler(gesture, handler, cooldown = 1000) {
        this.gestureHandlers.set(gesture, {
            handler,
            cooldown,
            description: 'Custom gesture handler'
        });
    }

    // Event emission helper
    emit(event, data) {
        // You can implement custom event handling here
        console.log(`Event: ${event}`, data);
    }

    // Get list of available gestures and their descriptions
    getAvailableGestures() {
        const gestures = {};
        this.gestureHandlers.forEach((value, key) => {
            gestures[key] = value.description;
        });
        return gestures;
    }
}