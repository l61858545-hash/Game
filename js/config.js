export const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    GRAVITY: 60,
    JUMP_STRENGTH: -1200,
    AIR_RESISTANCE: 0.1, 
    COYOTE_TIME: 0.2,
    JUMP_BUFFER_TIME: 0.15,
    DISAPPEAR_TIME: 0.2,
    
    PLAYER_STRETCH_INTENSITY: 0.2,

    SHAKE: {
        GROUND_STRENGTH: 20,
        GROUND_DURATION: 0.4,
        FALL_MAX_STRENGTH: 25,
    },

    PLAYER: {
        width: 50,
        height: 50,
        color: 'red',
        speed: 600,        // Das ist jetzt die Maximalgeschwindigkeit
        acceleration: 8000, // NEU: Wie schnell er auf 600 kommt
        friction: 15000      // NEU: Wie schnell er stehen bleibt
    },
    CAMERA_THRESHOLD_FACTOR: 0.5,
    VERSION: "1.2"
};