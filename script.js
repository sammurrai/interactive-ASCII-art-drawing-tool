class ASCIIArtTool {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.asciiOverlay = document.getElementById('asciiOverlay');
        this.patternBtn = document.getElementById('patternBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.patternInfo = document.getElementById('patternInfo');
        
        this.isDrawing = false;
        this.currentPatternIndex = 0;
        this.audioContext = null;
        this.lastDrawTime = 0;
        this.drawThrottle = 100; // milliseconds
        
        // Pattern sets with characters and corresponding musical scales
        this.patterns = [
            {
                name: 'Stars',
                chars: ['★', '✦', '✧', '✩', '✪'],
                notes: [261.63, 293.66, 329.63, 349.23, 392.00], // C4, D4, E4, F4, G4
                colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#9370DB']
            },
            {
                name: 'Nature',
                chars: ['❀', '✿', '❁', '❃', '❄'],
                notes: [392.00, 440.00, 493.88, 523.25, 587.33], // G4, A4, B4, C5, D5
                colors: ['#228B22', '#32CD32', '#90EE90', '#98FB98', '#00FF7F']
            },
            {
                name: 'Hearts',
                chars: ['♥', '♡', '❤', '💖', '💕'],
                notes: [329.63, 369.99, 415.30, 466.16, 523.25], // E4, F#4, G#4, A#4, C5
                colors: ['#FF69B4', '#FF1493', '#DC143C', '#B22222', '#8B0000']
            },
            {
                name: 'Arrows',
                chars: ['↑', '↗', '→', '↘', '↓'],
                notes: [261.63, 311.13, 369.99, 440.00, 523.25], // C4, D#4, F#4, A4, C5
                colors: ['#4169E1', '#6495ED', '#87CEEB', '#87CEFA', '#B0E0E6']
            },
            {
                name: 'Music',
                chars: ['♪', '♫', '♬', '♭', '♯'],
                notes: [220.00, 246.94, 277.18, 311.13, 349.23], // A3, B3, C#4, D#4, F4
                colors: ['#800080', '#9932CC', '#BA55D3', '#DA70D6', '#DDA0DD']
            }
        ];
        
        this.drawnCharacters = [];
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.initAudio();
        this.updatePatternDisplay();
    }
    
    setupCanvas() {
        // Set canvas size
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Set initial canvas style
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopDrawing();
        });
        
        // Button events
        this.patternBtn.addEventListener('click', () => this.switchPattern());
        this.clearBtn.addEventListener('click', () => this.clearCanvas());
    }
    
    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume audio context on user interaction (required by browsers)
            const resumeAudio = async () => {
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
                document.removeEventListener('click', resumeAudio);
                document.removeEventListener('touchstart', resumeAudio);
            };
            
            document.addEventListener('click', resumeAudio);
            document.addEventListener('touchstart', resumeAudio);
        } catch (error) {
            console.warn('Audio not supported:', error);
        }
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const overlayRect = this.asciiOverlay.getBoundingClientRect();
        
        return {
            x: e.clientX - overlayRect.left,
            y: e.clientY - overlayRect.top
        };
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        this.draw(e);
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const now = Date.now();
        if (now - this.lastDrawTime < this.drawThrottle) return;
        this.lastDrawTime = now;
        
        const pos = this.getMousePos(e);
        const pattern = this.patterns[this.currentPatternIndex];
        const charIndex = Math.floor(Math.random() * pattern.chars.length);
        const char = pattern.chars[charIndex];
        const color = pattern.colors[charIndex];
        const note = pattern.notes[charIndex];
        
        this.placeCharacter(pos.x, pos.y, char, color);
        this.playNote(note);
    }
    
    stopDrawing() {
        this.isDrawing = false;
    }
    
    placeCharacter(x, y, char, color) {
        // Create character element
        const charElement = document.createElement('span');
        charElement.textContent = char;
        charElement.style.position = 'absolute';
        charElement.style.left = x + 'px';
        charElement.style.top = y + 'px';
        charElement.style.color = color;
        charElement.style.fontSize = '20px';
        charElement.style.fontWeight = 'bold';
        charElement.style.textShadow = '1px 1px 2px rgba(0,0,0,0.3)';
        charElement.style.transform = 'translate(-50%, -50%)';
        charElement.style.userSelect = 'none';
        charElement.style.pointerEvents = 'none';
        
        // Add animation
        charElement.style.animation = 'charAppear 0.3s ease-out';
        
        this.asciiOverlay.appendChild(charElement);
        
        // Store character data
        this.drawnCharacters.push({
            element: charElement,
            x: x,
            y: y,
            char: char,
            color: color
        });
    }
    
    playNote(frequency, duration = 0.2) {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            // Create envelope for smooth sound
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.warn('Error playing note:', error);
        }
    }
    
    switchPattern() {
        this.currentPatternIndex = (this.currentPatternIndex + 1) % this.patterns.length;
        this.updatePatternDisplay();
    }
    
    updatePatternDisplay() {
        const pattern = this.patterns[this.currentPatternIndex];
        this.patternBtn.textContent = `Pattern: ${pattern.name}`;
        this.patternInfo.textContent = pattern.chars.join(' ');
    }
    
    clearCanvas() {
        // Clear canvas
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Clear ASCII overlay
        this.asciiOverlay.innerHTML = '';
        
        // Clear stored characters
        this.drawnCharacters = [];
        
        // Play a clearing sound
        if (this.audioContext) {
            this.playNote(130.81, 0.5); // C3 for clear sound
        }
    }
}

// Add CSS animation for character appearance
const style = document.createElement('style');
style.textContent = `
    @keyframes charAppear {
        0% {
            transform: translate(-50%, -50%) scale(0) rotate(180deg);
            opacity: 0;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.2) rotate(90deg);
            opacity: 0.8;
        }
        100% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ASCIIArtTool();
});