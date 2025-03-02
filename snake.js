document.addEventListener('DOMContentLoaded', () => {
    // Canvas setup
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highScore');
    const levelElement = document.getElementById('level');
    
    // Game constants
    const gridSize = 20;
    const tileCount = canvas.width / gridSize;
    
    // Snake skins
    const snakeSkins = {
        classic: {
            head: '#388E3C',
            body: ['#4CAF50', '#81C784'],
            eye: '#FFF',
            tongue: '#FF5252'
        },
        fire: {
            head: '#F57C00',
            body: ['#FF9800', '#FFB74D'],
            eye: '#FFF',
            tongue: '#FF5252'
        },
        ice: {
            head: '#1976D2',
            body: ['#2196F3', '#64B5F6'],
            eye: '#FFF',
            tongue: '#FF5252'
        },
        neon: {
            head: '#7B1FA2',
            body: ['#9C27B0', '#BA68C8'],
            eye: '#FFF',
            tongue: '#FF5252'
        },
        lava: {
            head: '#D32F2F',
            body: ['#F44336', '#E57373'],
            eye: '#FFF',
            tongue: '#FF5252'
        }
    };
    
    // Current snake skin
    let currentSkin = localStorage.getItem('snakeSkin') || 'classic';
    document.querySelector(`[data-skin="${currentSkin}"]`).classList.add('selected');
    
    // Snake head rotation and animation
    let headRotation = 0;
    let targetRotation = 0;
    const rotationSpeed = 0.3;
    
    // Snake movement interpolation
    let lastUpdateTime = 0;
    const movementSmoothing = 0.15;
    
    // Level definitions
    const levels = [
        { // Level 1
            obstacles: [],
            requiredScore: 10,
            speed: 7
        },
        { // Level 2
            obstacles: [
                {x: 5, y: 5}, {x: 6, y: 5}, {x: 7, y: 5},
                {x: 14, y: 14}, {x: 15, y: 14}, {x: 16, y: 14}
            ],
            requiredScore: 20,
            speed: 8
        },
        { // Level 3
            obstacles: [
                {x: 5, y: 5}, {x: 5, y: 6}, {x: 5, y: 7},
                {x: 15, y: 5}, {x: 15, y: 6}, {x: 15, y: 7},
                {x: 10, y: 10}
            ],
            requiredScore: 30,
            speed: 9
        },
        { // Level 4
            obstacles: [
                {x: 0, y: 10}, {x: 1, y: 10}, {x: 2, y: 10},
                {x: 17, y: 10}, {x: 18, y: 10}, {x: 19, y: 10},
                {x: 10, y: 0}, {x: 10, y: 1}, {x: 10, y: 2},
                {x: 10, y: 17}, {x: 10, y: 18}, {x: 10, y: 19}
            ],
            requiredScore: 40,
            speed: 10
        },
        { // Level 5
            obstacles: [
                {x: 5, y: 5}, {x: 6, y: 5}, {x: 7, y: 5},
                {x: 12, y: 5}, {x: 13, y: 5}, {x: 14, y: 5},
                {x: 5, y: 14}, {x: 6, y: 14}, {x: 7, y: 14},
                {x: 12, y: 14}, {x: 13, y: 14}, {x: 14, y: 14},
                {x: 9, y: 9}, {x: 10, y: 10}, {x: 11, y: 11}
            ],
            requiredScore: 50,
            speed: 11
        }
    ];
    
    // Game state
    let score = 0;
    let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
    let currentLevel = parseInt(localStorage.getItem('snakeLevel')) || 0;
    let speed = levels[currentLevel].speed;
    let isPaused = false;
    let gameOver = false;
    let gameStarted = false;
    
    // Background color
    let backgroundColor = '#FFFFFF';
    const backgroundColors = [
        '#F0F8FF', // AliceBlue
        '#FAEBD7', // AntiqueWhite
        '#E0FFFF', // LightCyan
        '#FAFAD2', // LightGoldenrodYellow
        '#E6E6FA', // Lavender
        '#FFF0F5', // LavenderBlush
        '#F5FFFA', // MintCream
        '#F0FFF0', // Honeydew
        '#F0FFFF', // Azure
        '#FFF5EE', // SeaShell
        '#F5F5DC', // Beige
        '#FFFAF0', // FloralWhite
        '#F8F8FF', // GhostWhite
        '#F0F0F0'  // WhiteSmoke
    ];
    
    // Snake initial position and velocity
    let snake = [
        { x: 10, y: 10 }
    ];
    let velocityX = 0;
    let velocityY = 0;
    
    // Power-up states
    let activeSpeedBoost = false;
    let activeImmunity = false;
    let activePowerUpTime = 0;
    const POWER_UP_DURATION = 5000; // 5 seconds
    
    // Food types and their properties
    const FoodType = {
        NORMAL: 'normal',
        BONUS: 'bonus',
        SPEED: 'speed',
        IMMUNITY: 'immunity',
        SHRINK: 'shrink'
    };
    
    const FoodProperties = {
        [FoodType.NORMAL]: {
            emoji: '🍎',
            points: 1,
            duration: null,
            color: '#FF5252'
        },
        [FoodType.BONUS]: {
            emoji: '🍕',
            points: 3,
            duration: 5000,
            color: '#FFD700'
        },
        [FoodType.SPEED]: {
            emoji: '⚡',
            points: 1,
            duration: 5000,
            color: '#2196F3'
        },
        [FoodType.IMMUNITY]: {
            emoji: '🛡️',
            points: 1,
            duration: 5000,
            color: '#4CAF50'
        },
        [FoodType.SHRINK]: {
            emoji: '✂️',
            points: 2,
            duration: null,
            color: '#9C27B0'
        }
    };
    
    // Food state
    let food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount),
        type: FoodType.NORMAL,
        spawnTime: Date.now(),
        duration: null
    };
    
    // Explosion particles
    let particles = [];
    
    // Colors
    const snakeColor = '#4CAF50';
    const snakeHeadColor = '#388E3C';
    const gridColor = '#EEEEEE';
    
    // Game loop and animation frame ID
    let animationFrameId;
    
    // Update displays
    highScoreElement.textContent = highScore;
    levelElement.textContent = currentLevel + 1;
    
    // Check for obstacle collision
    function checkObstacleCollision(x, y) {
        return levels[currentLevel].obstacles.some(obstacle => 
            obstacle.x === x && obstacle.y === y
        );
    }
    
    // Update game state
    function updateGame() {
        if (!gameStarted && velocityX === 0 && velocityY === 0) {
            return;
        }
        
        if (food.duration && Date.now() - food.spawnTime > food.duration) {
            generateFood();
            return;
        }
        
        if (activePowerUpTime > 0) {
            activePowerUpTime -= 1000 / speed;
            if (activePowerUpTime <= 0) {
                activeSpeedBoost = false;
                activeImmunity = false;
                speed = levels[currentLevel].speed;
            }
        }
        
        const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };
        
        // Check for wall collision
        if (!activeImmunity && (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount)) {
            gameOver = true;
            return;
        } else if (activeImmunity) {
            head.x = (head.x + tileCount) % tileCount;
            head.y = (head.y + tileCount) % tileCount;
        }
        
        // Check for obstacle collision when not immune
        if (!activeImmunity && checkObstacleCollision(head.x, head.y)) {
            gameOver = true;
            return;
        }
        
        // Check for self collision
        if (!activeImmunity) {
            for (let i = 1; i < snake.length; i++) {
                if (snake[i].x === head.x && snake[i].y === head.y) {
                    gameOver = true;
                    return;
                }
            }
        }
        
        snake.unshift(head);
        
        if (head.x === food.x && head.y === food.y) {
            score += FoodProperties[food.type].points;
            scoreElement.textContent = score;
            
            // Check for level up
            if (score >= levels[currentLevel].requiredScore && currentLevel < levels.length - 1) {
                currentLevel++;
                levelElement.textContent = currentLevel + 1;
                speed = levels[currentLevel].speed;
                localStorage.setItem('snakeLevel', currentLevel);
                
                // Level up effect
                createExplosion(canvas.width/2, canvas.height/2, '#2196F3');
            }
            
            // Update high score if needed
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            createExplosion(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, FoodProperties[food.type].color);
            
            applyPowerUpEffects(food.type);
            changeBackgroundColor();
            
            generateFood();
        } else {
            snake.pop();
        }
        
        // Update head rotation
        updateHeadRotation();
    }
    
    // Apply power-up effects
    function applyPowerUpEffects(foodType) {
        switch (foodType) {
            case FoodType.SPEED:
                activeSpeedBoost = true;
                speed += 3;
                activePowerUpTime = POWER_UP_DURATION;
                break;
            case FoodType.IMMUNITY:
                activeImmunity = true;
                activePowerUpTime = POWER_UP_DURATION;
                break;
            case FoodType.SHRINK:
                // Effect handled in updateGame
                break;
        }
    }
    
    // Create explosion particles with food-specific colors
    function createExplosion(x, y, baseColor) {
        const particleCount = 30;
        const colors = [baseColor, '#FFFFFF', '#FFD700', '#FFA500'];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            const size = 2 + Math.random() * 3;
            const life = 30 + Math.random() * 20;
            
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: life,
                maxLife: life
            });
        }
    }
    
    // Update particles
    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }
    
    // Draw particles
    function drawParticles() {
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const alpha = p.life / p.maxLife;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    // Change background color randomly
    function changeBackgroundColor() {
        let newColorIndex;
        do {
            newColorIndex = Math.floor(Math.random() * backgroundColors.length);
        } while (backgroundColors[newColorIndex] === backgroundColor);
        
        backgroundColor = backgroundColors[newColorIndex];
    }
    
    // Generate new food
    function generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount),
                type: FoodType.NORMAL,
                spawnTime: Date.now(),
                duration: null
            };
        } while (
            snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
            checkObstacleCollision(newFood.x, newFood.y)
        );
        
        // Increase chance of special food types in higher levels
        const specialFoodChance = 0.1 + (currentLevel * 0.05);
        if (Math.random() < specialFoodChance) {
            const types = [FoodType.BONUS, FoodType.SPEED, FoodType.IMMUNITY, FoodType.SHRINK];
            newFood.type = types[Math.floor(Math.random() * types.length)];
            if (newFood.type !== FoodType.SHRINK) {
                newFood.duration = 5000;
            }
        }
        
        food = newFood;
    }
    
    // Handle skin selection
    document.querySelectorAll('.skin-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelector('.skin-option.selected').classList.remove('selected');
            option.classList.add('selected');
            currentSkin = option.dataset.skin;
            localStorage.setItem('snakeSkin', currentSkin);
        });
    });
    
    // Calculate head rotation based on velocity
    function updateHeadRotation() {
        if (velocityX === 1) targetRotation = 0;
        else if (velocityX === -1) targetRotation = Math.PI;
        else if (velocityY === -1) targetRotation = -Math.PI/2;
        else if (velocityY === 1) targetRotation = Math.PI/2;
        
        // Smoothly interpolate rotation
        const rotationDiff = targetRotation - headRotation;
        if (Math.abs(rotationDiff) > Math.PI) {
            headRotation += rotationDiff > 0 ? -rotationSpeed : rotationSpeed;
        } else {
            headRotation += rotationDiff * rotationSpeed;
        }
        
        // Normalize rotation
        headRotation = headRotation % (Math.PI * 2);
    }
    
    // Draw snake head
    function drawSnakeHead(x, y) {
        const skin = snakeSkins[currentSkin];
        ctx.save();
        
        // Translate to head center for rotation
        ctx.translate(x + gridSize/2, y + gridSize/2);
        ctx.rotate(headRotation);
        
        // Draw head
        ctx.fillStyle = skin.head;
        ctx.beginPath();
        ctx.ellipse(0, 0, gridSize/2, gridSize/2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = skin.eye;
        ctx.beginPath();
        ctx.ellipse(-gridSize/4, -gridSize/4, gridSize/8, gridSize/8, 0, 0, Math.PI * 2);
        ctx.ellipse(-gridSize/4, gridSize/4, gridSize/8, gridSize/8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw tongue
        ctx.fillStyle = skin.tongue;
        ctx.beginPath();
        ctx.moveTo(gridSize/2, 0);
        ctx.lineTo(gridSize/2 + gridSize/4, -gridSize/8);
        ctx.lineTo(gridSize/2 + gridSize/4, gridSize/8);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    // Draw snake body segment with gradient
    function drawSnakeSegment(x, y, index) {
        const skin = snakeSkins[currentSkin];
        const gradient = ctx.createLinearGradient(x, y, x + gridSize, y + gridSize);
        gradient.addColorStop(0, skin.body[0]);
        gradient.addColorStop(1, skin.body[1]);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, gridSize - 2, gridSize - 2, 5);
        ctx.fill();
    }
    
    // Draw game elements
    function drawGame() {
        // Clear canvas
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        drawGrid();
        
        // Draw obstacles
        ctx.fillStyle = '#FF5252';
        levels[currentLevel].obstacles.forEach(obstacle => {
            ctx.fillRect(obstacle.x * gridSize, obstacle.y * gridSize, gridSize - 2, gridSize - 2);
        });
        
        // Draw snake body
        for (let i = snake.length - 1; i > 0; i--) {
            drawSnakeSegment(
                snake[i].x * gridSize,
                snake[i].y * gridSize,
                i
            );
        }
        
        // Draw snake head
        drawSnakeHead(snake[0].x * gridSize, snake[0].y * gridSize);
        
        // Draw food with appropriate emoji and visual effects
        const foodProps = FoodProperties[food.type];
        ctx.font = `${gridSize * 0.9}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add glow effect to food
        ctx.shadowColor = foodProps.color;
        ctx.shadowBlur = 10;
        ctx.fillText(
            foodProps.emoji,
            food.x * gridSize + gridSize/2,
            food.y * gridSize + gridSize/2
        );
        ctx.shadowBlur = 0;
        
        // Draw particles
        drawParticles();
        
        // Draw power-up timer if active
        if (activePowerUpTime > 0) {
            const powerUpText = [];
            if (activeSpeedBoost) powerUpText.push('Speed Boost');
            if (activeImmunity) powerUpText.push('Immunity');
            
            if (powerUpText.length > 0) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, canvas.width, 30);
                
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(
                    `${powerUpText.join(' + ')} (${Math.ceil(activePowerUpTime / 1000)}s)`,
                    canvas.width / 2,
                    20
                );
            }
        }
        
        // Draw start message if game hasn't started
        if (!gameStarted && velocityX === 0 && velocityY === 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Press an Arrow Key to Start', canvas.width / 2, canvas.height / 2);
        }
        
        // Draw pause indicator
        if (isPaused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
        }
    }
    
    // Draw grid
    function drawGrid() {
        ctx.strokeStyle = gridColor;
        
        // Vertical lines
        for (let i = 0; i <= tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let i = 0; i <= tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.width, i * gridSize);
            ctx.stroke();
        }
    }
    
    // Draw game over screen
    function drawGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width/2, canvas.height/2 - 50);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${score}`, canvas.width/2, canvas.height/2);
        
        if (score === highScore) {
            ctx.fillStyle = '#4CAF50';
            ctx.fillText('New High Score!', canvas.width/2, canvas.height/2 + 40);
        }
        
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText('Press Enter to play again', canvas.width/2, canvas.height/2 + 80);
    }
    
    // Handle keyboard input
    document.addEventListener('keydown', function handleKeyDown(event) {
        // Prevent arrow keys from scrolling the page
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(event.key)) {
            event.preventDefault();
        }
        
        console.log('Key pressed:', event.key, 'Game over:', gameOver);
        
        // Restart game with Enter key
        if (event.key === 'Enter' && gameOver) {
            console.log('Restarting game...');
            resetGame();
            return;
        }
        
        // Game controls
        if (!gameOver) {
            // Movement controls
            if (event.key === 'ArrowUp' && velocityY !== 1) {
                velocityX = 0;
                velocityY = -1;
                gameStarted = true;
            } else if (event.key === 'ArrowDown' && velocityY !== -1) {
                velocityX = 0;
                velocityY = 1;
                gameStarted = true;
            } else if (event.key === 'ArrowLeft' && velocityX !== 1) {
                velocityX = -1;
                velocityY = 0;
                gameStarted = true;
            } else if (event.key === 'ArrowRight' && velocityX !== -1) {
                velocityX = 1;
                velocityY = 0;
                gameStarted = true;
            }
            
            // Pause/resume game
            if (event.key === ' ') {
                isPaused = !isPaused;
            }
        }
    });
    
    // Reset game to initial state
    function resetGame() {
        // Clear the previous game loop
        if (animationFrameId) {
            clearTimeout(animationFrameId);
        }
        
        score = 0;
        scoreElement.textContent = score;
        currentLevel = 0;
        levelElement.textContent = currentLevel + 1;
        speed = levels[currentLevel].speed;
        snake = [{ x: 10, y: 10 }];
        velocityX = 0;
        velocityY = 0;
        gameOver = false;
        gameStarted = false;
        isPaused = false;
        activeSpeedBoost = false;
        activeImmunity = false;
        activePowerUpTime = 0;
        particles = [];
        generateFood();
        backgroundColor = '#FFFFFF';
        document.body.style.backgroundColor = backgroundColor;
        
        // Restart game loop
        gameLoop();
    }
    
    // Game loop
    function gameLoop() {
        if (gameOver) {
            drawGameOver();
            return;
        }
        
        if (!isPaused) {
            updateGame();
            updateParticles();
        }
        
        drawGame();
        animationFrameId = setTimeout(gameLoop, 1000 / speed);
    }
    
    // Start the game
    gameLoop();
});
