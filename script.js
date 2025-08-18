document.addEventListener('DOMContentLoaded', () => {
    // Canvas setup
    const canvas = document.getElementById('tetris');
    const ctx = canvas.getContext('2d');
    const nextCanvas = document.getElementById('next');
    const nextCtx = nextCanvas.getContext('2d');
    
    // Scale the canvas
    ctx.scale(30, 30);
    nextCtx.scale(20, 20);
    
    // Game variables
    let score = 0;
    let level = 1;
    let lines = 0;
    let gameOver = false;
    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    let gameStarted = false;
    
    // Audio
    const music = document.getElementById('tetris-music');
    music.volume = 0.3;
    
    // Start button
    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', () => {
        if (!gameStarted) {
            resetGame();
            gameStarted = true;
            startBtn.textContent = 'Recommencer';
            music.play();
            update();
        } else {
            resetGame();
            music.currentTime = 0;
            music.play();
        }
    });
    
    // Game board (10x20)
    const board = Array(20).fill().map(() => Array(10).fill(0));
    
    // Pieces
    const pieces = [
        // I
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        // J
        [
            [2, 0, 0],
            [2, 2, 2],
            [0, 0, 0]
        ],
        // L
        [
            [0, 0, 3],
            [3, 3, 3],
            [0, 0, 0]
        ],
        // O
        [
            [0, 4, 4],
            [0, 4, 4],
            [0, 0, 0]
        ],
        // S
        [
            [0, 5, 5],
            [5, 5, 0],
            [0, 0, 0]
        ],
        // T
        [
            [0, 6, 0],
            [6, 6, 6],
            [0, 0, 0]
        ],
        // Z
        [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0]
        ]
    ];
    
    // Colors
    const colors = [
        null,
        '#00FFFF', // I - cyan
        '#0000FF', // J - blue
        '#FF7F00', // L - orange
        '#FFFF00', // O - yellow
        '#00FF00', // S - green
        '#800080', // T - purple
        '#FF0000'  // Z - red
    ];
    
    // Current piece
    let player = {
        pos: {x: 0, y: 0},
        matrix: null,
        next: null
    };
    
    // Initialize the game
    function resetGame() {
        board.forEach(row => row.fill(0));
        score = 0;
        level = 1;
        lines = 0;
        gameOver = false;
        dropInterval = 1000;
        updateScore();
        
        // Create first pieces
        player.next = createPiece();
        resetPlayer();
    }
    
    // Create a random piece
    function createPiece() {
        const piece = pieces[Math.floor(Math.random() * pieces.length)];
        return piece;
    }
    
    // Reset player position and get next piece
    function resetPlayer() {
        player.matrix = player.next;
        player.next = createPiece();
        drawNext();
        player.pos.y = 0;
        player.pos.x = Math.floor(board[0].length / 2) - Math.floor(player.matrix[0].length / 2);
        
        // Game over if collision immediately
        if (collide()) {
            gameOver = true;
            music.pause();
            alert('Game Over! Score: ' + score);
        }
    }
    
    // Draw the next piece
    function drawNext() {
        nextCtx.fillStyle = '#111';
        nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
        
        if (player.next) {
            player.next.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        nextCtx.fillStyle = colors[value];
                        nextCtx.fillRect(x + 0.1, y + 0.1, 0.8, 0.8);
                    }
                });
            });
        }
    }
    
    // Draw the game
    function draw() {
        // Clear the board
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the board
        drawMatrix(board, {x: 0, y: 0});
        
        // Draw the current piece
        drawMatrix(player.matrix, player.pos);
    }
    
    // Draw a matrix
    function drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillStyle = colors[value];
                    ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                    
                    // Add some styling to the blocks
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 0.05;
                    ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
                    
                    // Add highlight effect
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.fillRect(x + offset.x + 0.1, y + offset.y + 0.1, 0.8, 0.1);
                }
            });
        });
    }
    
    // Merge the player piece with the board
    function merge() {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    board[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }
    
    // Check for collisions
    function collide() {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (board[y + o.y] === undefined ||
                     board[y + o.y][x + o.x] === undefined ||
                     board[y + o.y][x + o.x] !== 0)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Rotate the player piece
    function rotate() {
        const matrix = player.matrix;
        const N = matrix.length;
        
        // Transpose the matrix
        for (let y = 0; y < N; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        
        // Reverse each row
        matrix.forEach(row => row.reverse());
        
        // If rotation causes collision, undo it
        if (collide()) {
            // Reverse each row again
            matrix.forEach(row => row.reverse());
            
            // Transpose again
            for (let y = 0; y < N; ++y) {
                for (let x = 0; x < y; ++x) {
                    [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
                }
            }
        }
    }
    
    // Move the player piece
    function playerMove(dir) {
        player.pos.x += dir;
        if (collide()) {
            player.pos.x -= dir;
        }
    }
    
    // Drop the player piece
    function playerDrop() {
        player.pos.y++;
        if (collide()) {
            player.pos.y--;
            merge();
            resetPlayer();
            arenaSweep();
            updateScore();
        }
        dropCounter = 0;
    }
    
    // Hard drop
    function playerHardDrop() {
        while (!collide()) {
            player.pos.y++;
        }
        player.pos.y--;
        merge();
        resetPlayer();
        arenaSweep();
        updateScore();
        dropCounter = 0;
    }
    
    // Check for completed lines
    function arenaSweep() {
        let linesCleared = 0;
        
        outer: for (let y = board.length - 1; y >= 0; --y) {
            for (let x = 0; x < board[y].length; ++x) {
                if (board[y][x] === 0) {
                    continue outer;
                }
            }
            
            // Remove the line
            const row = board.splice(y, 1)[0].fill(0);
            board.unshift(row);
            ++y;
            
            linesCleared++;
        }
        
        if (linesCleared > 0) {
            // Update score based on lines cleared
            switch (linesCleared) {
                case 1:
                    score += 100 * level;
                    break;
                case 2:
                    score += 300 * level;
                    break;
                case 3:
                    score += 500 * level;
                    break;
                case 4:
                    score += 800 * level;
                    break;
            }
            
            lines += linesCleared;
            
            // Level up every 10 lines
            level = Math.floor(lines / 10) + 1;
            
            // Increase speed with level (capped at level 15)
            dropInterval = Math.max(100, 1000 - (level - 1) * 50);
        }
    }
    
    // Update score display
    function updateScore() {
        document.getElementById('score').textContent = score;
        document.getElementById('level').textContent = level;
    }
    
    // Game loop
    function update(time = 0) {
        if (gameOver) return;
        
        const deltaTime = time - lastTime;
        lastTime = time;
        
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
        
        draw();
        requestAnimationFrame(update);
    }
    
    // Keyboard controls
    document.addEventListener('keydown', event => {
        if (!gameStarted || gameOver) return;
        
        switch (event.keyCode) {
            case 37: // Left arrow
                playerMove(-1);
                break;
            case 39: // Right arrow
                playerMove(1);
                break;
            case 40: // Down arrow
                playerDrop();
                break;
            case 38: // Up arrow
                rotate();
                break;
            case 32: // Space
                playerHardDrop();
                break;
        }
    });
    
    // Touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        if (!gameStarted || gameOver) return;
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, false);
    
    canvas.addEventListener('touchmove', (e) => {
        if (!gameStarted || gameOver) return;
        e.preventDefault();
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        // Horizontal swipe
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0) {
                playerMove(1); // Right
            } else {
                playerMove(-1); // Left
            }
        } 
        // Vertical swipe down
        else if (diffY > 0) {
            playerDrop(); // Down
        }
        // Vertical swipe up
        else {
            rotate(); // Rotate
        }
        
        touchStartX = touchEndX;
        touchStartY = touchEndY;
    }, false);
    
    // Double tap for hard drop
    let lastTap = 0;
    canvas.addEventListener('touchend', (e) => {
        if (!gameStarted || gameOver) return;
        e.preventDefault();
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            playerHardDrop(); // Hard drop
        }
        lastTap = currentTime;
    }, false);
    
    // Initialize next piece display
    drawNext();
});