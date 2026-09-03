import { useRef, useCallback } from "react";

/**
 * Custom hook for smooth 3D mouse parallax tilt effect on UI cards
 * @param {Object} options Configuration options
 */
export function use3DTilt(options = {}) {
    const {
        maxTilt = 12,
        scale = 1.02,
        speed = 400,
        glare = true
    } = options;

    const cardRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        const card = cardRef.current;
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // Calculate mouse position relative to center of element (-1 to 1)
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const centerX = width / 2;
        const centerY = height / 2;

        const percentX = (mouseX - centerX) / centerX;
        const percentY = (mouseY - centerY) / centerY;

        const tiltX = -percentY * maxTilt;
        const tiltY = percentX * maxTilt;

        card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`;

        if (glare) {
            const glareAngle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
            const glareOpacity = (Math.hypot(percentX, percentY) / Math.SQRT2) * 0.25;
            card.style.setProperty("--glare-angle", `${glareAngle}deg`);
            card.style.setProperty("--glare-opacity", `${glareOpacity}`);
        }
    }, [maxTilt, scale, glare]);

    const handleMouseLeave = useCallback(() => {
        const card = cardRef.current;
        if (!card) return;
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        card.style.transition = `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`;
        if (glare) {
            card.style.setProperty("--glare-opacity", "0");
        }
    }, [speed, glare]);

    const handleMouseEnter = useCallback(() => {
        const card = cardRef.current;
        if (!card) return;
        card.style.transition = `transform 100ms ease-out`;
    }, []);

    return {
        ref: cardRef,
        onMouseMove: handleMouseMove,
        onMouseLeave: handleMouseLeave,
        onMouseEnter: handleMouseEnter
    };
}
