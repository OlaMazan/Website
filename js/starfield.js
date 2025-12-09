// Starfield animation
function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const stars = [];
    const starCount = 150;
    
    // Create stars
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,  // diagonal motion (slow)
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 1.5
        });
    }
    
    function drawStars() {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffffff';
        stars.forEach(star => {
            star.x += star.vx;
            star.y += star.vy;
            
            // wrap around edges
            if (star.x < 0) star.x = canvas.width;
            if (star.x > canvas.width) star.x = 0;
            if (star.y < 0) star.y = canvas.height;
            if (star.y > canvas.height) star.y = 0;
            
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        requestAnimationFrame(drawStars);
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    
    drawStars();
}

document.addEventListener('DOMContentLoaded', () => {
    initStarfield();
});
