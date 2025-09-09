// Unity-style Comprehensive Input System
class InputSystem {
    constructor() {
        this.keyboard = new Map();
        this.mouse = {
            position: new THREE.Vector2(),
            delta: new THREE.Vector2(),
            buttons: new Map(),
            wheel: 0
        };
        this.gamepad = {
            connected: false,
            index: -1,
            buttons: new Map(),
            axes: new Map(),
            vibration: { left: 0, right: 0 }
        };
        this.touch = {
            touches: new Map(),
            gestures: new Map()
        };
        this.inputActions = new Map();
        this.setupInput();
    }

    setupInput() {
        this.setupKeyboard();
        this.setupMouse();
        this.setupGamepad();
        this.setupTouch();
        this.setupInputActions();
    }

    setupKeyboard() {
        document.addEventListener('keydown', (event) => {
            this.keyboard.set(event.code, {
                pressed: true,
                held: true,
                released: false,
                timestamp: Date.now()
            });
        });

        document.addEventListener('keyup', (event) => {
            const keyState = this.keyboard.get(event.code);
            if (keyState) {
                keyState.pressed = false;
                keyState.held = false;
                keyState.released = true;
                keyState.timestamp = Date.now();
            }
        });
    }

    setupMouse() {
        document.addEventListener('mousemove', (event) => {
            const newPosition = new THREE.Vector2(event.clientX, event.clientY);
            this.mouse.delta.subVectors(newPosition, this.mouse.position);
            this.mouse.position.copy(newPosition);
        });

        document.addEventListener('mousedown', (event) => {
            this.mouse.buttons.set(event.button, {
                pressed: true,
                held: true,
                released: false,
                timestamp: Date.now()
            });
        });

        document.addEventListener('mouseup', (event) => {
            const buttonState = this.mouse.buttons.get(event.button);
            if (buttonState) {
                buttonState.pressed = false;
                buttonState.held = false;
                buttonState.released = true;
                buttonState.timestamp = Date.now();
            }
        });

        document.addEventListener('wheel', (event) => {
            this.mouse.wheel = event.deltaY;
        });
    }

    setupGamepad() {
        window.addEventListener('gamepadconnected', (event) => {
            this.gamepad.connected = true;
            this.gamepad.index = event.gamepad.index;
            console.log('Gamepad connected:', event.gamepad.id);
        });

        window.addEventListener('gamepaddisconnected', (event) => {
            this.gamepad.connected = false;
            this.gamepad.index = -1;
            console.log('Gamepad disconnected');
        });
    }

    setupTouch() {
        document.addEventListener('touchstart', (event) => {
            event.preventDefault();
            for (let i = 0; i < event.touches.length; i++) {
                const touch = event.touches[i];
                this.touch.touches.set(touch.identifier, {
                    position: new THREE.Vector2(touch.clientX, touch.clientY),
                    pressed: true,
                    held: true,
                    released: false,
                    timestamp: Date.now()
                });
            }
        });

        document.addEventListener('touchmove', (event) => {
            event.preventDefault();
            for (let i = 0; i < event.touches.length; i++) {
                const touch = event.touches[i];
                const touchState = this.touch.touches.get(touch.identifier);
                if (touchState) {
                    touchState.position.set(touch.clientX, touch.clientY);
                }
            }
        });

        document.addEventListener('touchend', (event) => {
            event.preventDefault();
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touch = event.changedTouches[i];
                const touchState = this.touch.touches.get(touch.identifier);
                if (touchState) {
                    touchState.pressed = false;
                    touchState.held = false;
                    touchState.released = true;
                    touchState.timestamp = Date.now();
                }
            }
        });
    }

    setupInputActions() {
        // Define input actions
        this.inputActions.set('move_forward', ['KeyW', 'ArrowUp']);
        this.inputActions.set('move_backward', ['KeyS', 'ArrowDown']);
        this.inputActions.set('move_left', ['KeyA', 'ArrowLeft']);
        this.inputActions.set('move_right', ['KeyD', 'ArrowRight']);
        this.inputActions.set('jump', ['Space']);
        this.inputActions.set('interact', ['KeyE', 'Enter']);
        this.inputActions.set('pause', ['Escape']);
        this.inputActions.set('camera_up', ['KeyQ']);
        this.inputActions.set('camera_down', ['KeyZ']);
    }

    // Input query methods
    getKey(keyCode) {
        const keyState = this.keyboard.get(keyCode);
        return keyState ? keyState.held : false;
    }

    getKeyDown(keyCode) {
        const keyState = this.keyboard.get(keyCode);
        return keyState ? keyState.pressed : false;
    }

    getKeyUp(keyCode) {
        const keyState = this.keyboard.get(keyCode);
        return keyState ? keyState.released : false;
    }

    getMouseButton(button) {
        const buttonState = this.mouse.buttons.get(button);
        return buttonState ? buttonState.held : false;
    }

    getMouseButtonDown(button) {
        const buttonState = this.mouse.buttons.get(button);
        return buttonState ? buttonState.pressed : false;
    }

    getMouseButtonUp(button) {
        const buttonState = this.mouse.buttons.get(button);
        return buttonState ? buttonState.released : false;
    }

    getMousePosition() {
        return this.mouse.position.clone();
    }

    getMouseDelta() {
        return this.mouse.delta.clone();
    }

    getMouseWheel() {
        return this.mouse.wheel;
    }

    // Gamepad methods
    updateGamepad() {
        if (!this.gamepad.connected) return;

        const gamepad = navigator.getGamepads()[this.gamepad.index];
        if (!gamepad) return;

        // Update buttons
        for (let i = 0; i < gamepad.buttons.length; i++) {
            const button = gamepad.buttons[i];
            const buttonState = this.gamepad.buttons.get(i);
            
            if (buttonState) {
                buttonState.pressed = button.pressed && !buttonState.held;
                buttonState.held = button.pressed;
                buttonState.released = !button.pressed && buttonState.held;
            } else {
                this.gamepad.buttons.set(i, {
                    pressed: button.pressed,
                    held: button.pressed,
                    released: false,
                    timestamp: Date.now()
                });
            }
        }

        // Update axes
        for (let i = 0; i < gamepad.axes.length; i++) {
            this.gamepad.axes.set(i, gamepad.axes[i]);
        }
    }

    getGamepadButton(buttonIndex) {
        const buttonState = this.gamepad.buttons.get(buttonIndex);
        return buttonState ? buttonState.held : false;
    }

    getGamepadButtonDown(buttonIndex) {
        const buttonState = this.gamepad.buttons.get(buttonIndex);
        return buttonState ? buttonState.pressed : false;
    }

    getGamepadButtonUp(buttonIndex) {
        const buttonState = this.gamepad.buttons.get(buttonIndex);
        return buttonState ? buttonState.released : false;
    }

    getGamepadAxis(axisIndex) {
        return this.gamepad.axes.get(axisIndex) || 0;
    }

    setGamepadVibration(leftMotor, rightMotor) {
        if (!this.gamepad.connected) return;

        const gamepad = navigator.getGamepads()[this.gamepad.index];
        if (gamepad && gamepad.vibrationActuator) {
            gamepad.vibrationActuator.playEffect('dual-rumble', {
                duration: 1000,
                strongMagnitude: leftMotor,
                weakMagnitude: rightMotor
            });
        }
    }

    // Touch methods
    getTouch(touchId) {
        const touchState = this.touch.touches.get(touchId);
        return touchState ? touchState.held : false;
    }

    getTouchDown(touchId) {
        const touchState = this.touch.touches.get(touchId);
        return touchState ? touchState.pressed : false;
    }

    getTouchUp(touchId) {
        const touchState = this.touch.touches.get(touchId);
        return touchState ? touchState.released : false;
    }

    getTouchPosition(touchId) {
        const touchState = this.touch.touches.get(touchId);
        return touchState ? touchState.position.clone() : new THREE.Vector2();
    }

    // Input action methods
    getInputAction(actionName) {
        const keys = this.inputActions.get(actionName);
        if (!keys) return false;

        return keys.some(key => this.getKey(key));
    }

    getInputActionDown(actionName) {
        const keys = this.inputActions.get(actionName);
        if (!keys) return false;

        return keys.some(key => this.getKeyDown(key));
    }

    getInputActionUp(actionName) {
        const keys = this.inputActions.get(actionName);
        if (!keys) return false;

        return keys.some(key => this.getKeyUp(key));
    }

    // Movement input
    getMovementInput() {
        const movement = new THREE.Vector2();

        if (this.getInputAction('move_forward')) movement.y += 1;
        if (this.getInputAction('move_backward')) movement.y -= 1;
        if (this.getInputAction('move_left')) movement.x -= 1;
        if (this.getInputAction('move_right')) movement.x += 1;

        // Gamepad support
        if (this.gamepad.connected) {
            const leftStickX = this.getGamepadAxis(0);
            const leftStickY = this.getGamepadAxis(1);
            
            movement.x += leftStickX;
            movement.y -= leftStickY;
        }

        return movement.normalize();
    }

    getCameraInput() {
        const cameraInput = new THREE.Vector2();

        // Mouse input
        cameraInput.add(this.getMouseDelta());

        // Gamepad support
        if (this.gamepad.connected) {
            const rightStickX = this.getGamepadAxis(2);
            const rightStickY = this.getGamepadAxis(3);
            
            cameraInput.x += rightStickX * 10;
            cameraInput.y += rightStickY * 10;
        }

        return cameraInput;
    }

    // Update method
    update() {
        this.updateGamepad();
        this.clearReleasedStates();
    }

    clearReleasedStates() {
        // Clear released states for next frame
        this.keyboard.forEach(keyState => {
            keyState.pressed = false;
            keyState.released = false;
        });

        this.mouse.buttons.forEach(buttonState => {
            buttonState.pressed = false;
            buttonState.released = false;
        });

        this.touch.touches.forEach(touchState => {
            touchState.pressed = false;
            touchState.released = false;
        });

        this.mouse.delta.set(0, 0);
        this.mouse.wheel = 0;
    }

    // Settings
    setInputAction(actionName, keys) {
        this.inputActions.set(actionName, keys);
    }

    remapInputAction(actionName, newKeys) {
        const existingKeys = this.inputActions.get(actionName);
        if (existingKeys) {
            this.inputActions.set(actionName, newKeys);
        }
    }

    // Debug
    getInputDebugInfo() {
        return {
            keyboard: Object.fromEntries(this.keyboard),
            mouse: {
                position: this.mouse.position,
                delta: this.mouse.delta,
                buttons: Object.fromEntries(this.mouse.buttons),
                wheel: this.mouse.wheel
            },
            gamepad: {
                connected: this.gamepad.connected,
                buttons: Object.fromEntries(this.gamepad.buttons),
                axes: Object.fromEntries(this.gamepad.axes)
            },
            touch: Object.fromEntries(this.touch.touches)
        };
    }
}

// Export for use in main game
window.InputSystem = InputSystem;