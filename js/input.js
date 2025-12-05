export const keys = {
    right: false,
    left: false,
    up: false,
    enter: false
};

export function setupInput() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
        if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') keys.up = true;
        if (e.key === 'Enter') keys.enter = true;
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
        if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') keys.up = false;
        if (e.key === 'Enter') keys.enter = false;
    });
}