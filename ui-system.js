// Unity-style UI System
class UISystem {
    constructor(renderer, camera) {
        this.renderer = renderer;
        this.camera = camera;
        this.canvas = null;
        this.context = null;
        this.elements = new Map();
        this.animations = new Map();
        this.setupCanvas();
    }

    setupCanvas() {
        // Create off-screen canvas for UI
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1600;
        this.canvas.height = 720;
        this.context = this.canvas.getContext('2d');
        
        // Create texture from canvas
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.needsUpdate = true;
        
        // Create UI plane
        const geometry = new THREE.PlaneGeometry(16, 9);
        const material = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            alphaTest: 0.1
        });
        
        this.uiPlane = new THREE.Mesh(geometry, material);
        this.uiPlane.position.set(0, 0, 5);
        this.uiPlane.renderOrder = 1000;
    }

    createPanel(id, options = {}) {
        const panel = {
            id: id,
            x: options.x || 0,
            y: options.y || 0,
            width: options.width || 200,
            height: options.height || 100,
            backgroundColor: options.backgroundColor || 'rgba(0, 0, 0, 0.8)',
            borderColor: options.borderColor || '#4ecdc4',
            borderWidth: options.borderWidth || 2,
            borderRadius: options.borderRadius || 10,
            visible: options.visible !== false,
            children: [],
            animations: []
        };
        
        this.elements.set(id, panel);
        return panel;
    }

    createButton(id, options = {}) {
        const button = {
            id: id,
            type: 'button',
            x: options.x || 0,
            y: options.y || 0,
            width: options.width || 100,
            height: options.height || 40,
            text: options.text || 'Button',
            fontSize: options.fontSize || 16,
            fontColor: options.fontColor || '#ffffff',
            backgroundColor: options.backgroundColor || '#4ecdc4',
            hoverColor: options.hoverColor || '#45b7d1',
            activeColor: options.activeColor || '#3a9bc1',
            borderColor: options.borderColor || '#4ecdc4',
            borderWidth: options.borderWidth || 2,
            borderRadius: options.borderRadius || 20,
            visible: options.visible !== false,
            enabled: options.enabled !== false,
            hovered: false,
            pressed: false,
            onClick: options.onClick || null,
            animations: []
        };
        
        this.elements.set(id, button);
        return button;
    }

    createSlider(id, options = {}) {
        const slider = {
            id: id,
            type: 'slider',
            x: options.x || 0,
            y: options.y || 0,
            width: options.width || 200,
            height: options.height || 20,
            min: options.min || 0,
            max: options.max || 100,
            value: options.value || 50,
            step: options.step || 1,
            backgroundColor: options.backgroundColor || 'rgba(255, 255, 255, 0.2)',
            fillColor: options.fillColor || '#4ecdc4',
            handleColor: options.handleColor || '#ffffff',
            borderColor: options.borderColor || '#4ecdc4',
            borderWidth: options.borderWidth || 1,
            borderRadius: options.borderRadius || 10,
            visible: options.visible !== false,
            enabled: options.enabled !== false,
            dragging: false,
            onChange: options.onChange || null,
            animations: []
        };
        
        this.elements.set(id, slider);
        return slider;
    }

    createProgressBar(id, options = {}) {
        const progressBar = {
            id: id,
            type: 'progressBar',
            x: options.x || 0,
            y: options.y || 0,
            width: options.width || 200,
            height: options.height || 20,
            value: options.value || 0,
            maxValue: options.maxValue || 100,
            backgroundColor: options.backgroundColor || 'rgba(255, 255, 255, 0.2)',
            fillColor: options.fillColor || '#4ecdc4',
            borderColor: options.borderColor || '#4ecdc4',
            borderWidth: options.borderWidth || 1,
            borderRadius: options.borderRadius || 10,
            visible: options.visible !== false,
            animations: []
        };
        
        this.elements.set(id, progressBar);
        return progressBar;
    }

    createText(id, options = {}) {
        const text = {
            id: id,
            type: 'text',
            x: options.x || 0,
            y: options.y || 0,
            text: options.text || 'Text',
            fontSize: options.fontSize || 16,
            fontColor: options.fontColor || '#ffffff',
            fontFamily: options.fontFamily || 'Arial',
            fontWeight: options.fontWeight || 'normal',
            textAlign: options.textAlign || 'left',
            visible: options.visible !== false,
            animations: []
        };
        
        this.elements.set(id, text);
        return text;
    }

    createImage(id, options = {}) {
        const image = {
            id: id,
            type: 'image',
            x: options.x || 0,
            y: options.y || 0,
            width: options.width || 100,
            height: options.height || 100,
            src: options.src || '',
            visible: options.visible !== false,
            animations: []
        };
        
        this.elements.set(id, image);
        return image;
    }

    render() {
        // Clear canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render all elements
        this.elements.forEach(element => {
            if (element.visible) {
                this.renderElement(element);
            }
        });
        
        // Update texture
        this.texture.needsUpdate = true;
    }

    renderElement(element) {
        switch (element.type) {
            case 'button':
                this.renderButton(element);
                break;
            case 'slider':
                this.renderSlider(element);
                break;
            case 'progressBar':
                this.renderProgressBar(element);
                break;
            case 'text':
                this.renderText(element);
                break;
            case 'image':
                this.renderImage(element);
                break;
            default:
                this.renderPanel(element);
        }
    }

    renderButton(button) {
        const ctx = this.context;
        const x = button.x;
        const y = button.y;
        const width = button.width;
        const height = button.height;
        
        // Determine colors based on state
        let bgColor = button.backgroundColor;
        if (button.pressed) {
            bgColor = button.activeColor;
        } else if (button.hovered) {
            bgColor = button.hoverColor;
        }
        
        // Draw background
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, width, height);
        
        // Draw border
        ctx.strokeStyle = button.borderColor;
        ctx.lineWidth = button.borderWidth;
        ctx.strokeRect(x, y, width, height);
        
        // Draw text
        ctx.fillStyle = button.fontColor;
        ctx.font = `${button.fontSize}px ${button.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(button.text, x + width / 2, y + height / 2);
    }

    renderSlider(slider) {
        const ctx = this.context;
        const x = slider.x;
        const y = slider.y;
        const width = slider.width;
        const height = slider.height;
        
        // Draw background
        ctx.fillStyle = slider.backgroundColor;
        ctx.fillRect(x, y, width, height);
        
        // Draw border
        ctx.strokeStyle = slider.borderColor;
        ctx.lineWidth = slider.borderWidth;
        ctx.strokeRect(x, y, width, height);
        
        // Draw fill
        const fillWidth = (slider.value - slider.min) / (slider.max - slider.min) * width;
        ctx.fillStyle = slider.fillColor;
        ctx.fillRect(x, y, fillWidth, height);
        
        // Draw handle
        const handleX = x + fillWidth - height / 2;
        ctx.fillStyle = slider.handleColor;
        ctx.beginPath();
        ctx.arc(handleX, y + height / 2, height / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    renderProgressBar(progressBar) {
        const ctx = this.context;
        const x = progressBar.x;
        const y = progressBar.y;
        const width = progressBar.width;
        const height = progressBar.height;
        
        // Draw background
        ctx.fillStyle = progressBar.backgroundColor;
        ctx.fillRect(x, y, width, height);
        
        // Draw border
        ctx.strokeStyle = progressBar.borderColor;
        ctx.lineWidth = progressBar.borderWidth;
        ctx.strokeRect(x, y, width, height);
        
        // Draw fill
        const fillWidth = (progressBar.value / progressBar.maxValue) * width;
        ctx.fillStyle = progressBar.fillColor;
        ctx.fillRect(x, y, fillWidth, height);
    }

    renderText(text) {
        const ctx = this.context;
        const x = text.x;
        const y = text.y;
        
        ctx.fillStyle = text.fontColor;
        ctx.font = `${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`;
        ctx.textAlign = text.textAlign;
        ctx.textBaseline = 'top';
        ctx.fillText(text.text, x, y);
    }

    renderImage(image) {
        // For now, just draw a placeholder
        const ctx = this.context;
        const x = image.x;
        const y = image.y;
        const width = image.width;
        const height = image.height;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(x, y, width, height);
        
        ctx.strokeStyle = '#4ecdc4';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }

    renderPanel(panel) {
        const ctx = this.context;
        const x = panel.x;
        const y = panel.y;
        const width = panel.width;
        const height = panel.height;
        
        // Draw background
        ctx.fillStyle = panel.backgroundColor;
        ctx.fillRect(x, y, width, height);
        
        // Draw border
        ctx.strokeStyle = panel.borderColor;
        ctx.lineWidth = panel.borderWidth;
        ctx.strokeRect(x, y, width, height);
    }

    // Event handling
    handleMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouseX = ((event.clientX - rect.left) / rect.width) * 1600;
        const mouseY = ((event.clientY - rect.top) / rect.height) * 720;
        
        this.elements.forEach(element => {
            if (element.type === 'button') {
                const wasHovered = element.hovered;
                element.hovered = this.isPointInElement(mouseX, mouseY, element);
                
                if (element.hovered !== wasHovered) {
                    this.animateElement(element, 'hover', element.hovered);
                }
            }
        });
    }

    handleMouseDown(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouseX = ((event.clientX - rect.left) / rect.width) * 1600;
        const mouseY = ((event.clientY - rect.top) / rect.height) * 720;
        
        this.elements.forEach(element => {
            if (this.isPointInElement(mouseX, mouseY, element)) {
                if (element.type === 'button') {
                    element.pressed = true;
                    this.animateElement(element, 'press', true);
                } else if (element.type === 'slider') {
                    element.dragging = true;
                    this.updateSliderValue(element, mouseX);
                }
            }
        });
    }

    handleMouseUp(event) {
        this.elements.forEach(element => {
            if (element.type === 'button' && element.pressed) {
                element.pressed = false;
                this.animateElement(element, 'press', false);
                
                if (element.onClick) {
                    element.onClick();
                }
            } else if (element.type === 'slider' && element.dragging) {
                element.dragging = false;
            }
        });
    }

    isPointInElement(x, y, element) {
        return x >= element.x && x <= element.x + element.width &&
               y >= element.y && y <= element.y + element.height;
    }

    updateSliderValue(slider, mouseX) {
        const relativeX = mouseX - slider.x;
        const percentage = Math.max(0, Math.min(1, relativeX / slider.width));
        const newValue = slider.min + (slider.max - slider.min) * percentage;
        
        if (Math.abs(newValue - slider.value) >= slider.step) {
            slider.value = Math.round(newValue / slider.step) * slider.step;
            
            if (slider.onChange) {
                slider.onChange(slider.value);
            }
        }
    }

    // Animation system
    animateElement(element, animationType, value) {
        const animation = {
            element: element,
            type: animationType,
            startTime: Date.now(),
            duration: 200,
            startValue: this.getAnimationStartValue(element, animationType),
            endValue: value,
            easing: 'easeOut'
        };
        
        this.animations.set(`${element.id}_${animationType}`, animation);
    }

    getAnimationStartValue(element, animationType) {
        switch (animationType) {
            case 'hover':
                return element.hovered ? 1 : 0;
            case 'press':
                return element.pressed ? 1 : 0;
            default:
                return 0;
        }
    }

    updateAnimations() {
        const currentTime = Date.now();
        
        this.animations.forEach((animation, key) => {
            const elapsed = currentTime - animation.startTime;
            const progress = Math.min(elapsed / animation.duration, 1);
            
            // Apply easing
            let easedProgress = progress;
            if (animation.easing === 'easeOut') {
                easedProgress = 1 - Math.pow(1 - progress, 3);
            }
            
            // Update element based on animation type
            this.applyAnimation(animation, easedProgress);
            
            if (progress >= 1) {
                this.animations.delete(key);
            }
        });
    }

    applyAnimation(animation, progress) {
        const element = animation.element;
        
        switch (animation.type) {
            case 'hover':
                // Scale effect
                const scale = 1 + (progress * 0.1);
                element.scale = scale;
                break;
            case 'press':
                // Press effect
                const pressScale = 1 - (progress * 0.05);
                element.pressScale = pressScale;
                break;
        }
    }

    // Utility methods
    setElementVisible(id, visible) {
        const element = this.elements.get(id);
        if (element) {
            element.visible = visible;
        }
    }

    setElementEnabled(id, enabled) {
        const element = this.elements.get(id);
        if (element) {
            element.enabled = enabled;
        }
    }

    setElementText(id, text) {
        const element = this.elements.get(id);
        if (element && element.type === 'text') {
            element.text = text;
        }
    }

    setElementValue(id, value) {
        const element = this.elements.get(id);
        if (element && (element.type === 'slider' || element.type === 'progressBar')) {
            element.value = value;
        }
    }

    getElementValue(id) {
        const element = this.elements.get(id);
        if (element && (element.type === 'slider' || element.type === 'progressBar')) {
            return element.value;
        }
        return null;
    }
}

// Export for use in main game
window.UISystem = UISystem;