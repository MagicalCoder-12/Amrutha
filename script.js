// Game state
const gameState = {
    playerName: "Amrutha",
    currentRound: 1,
    embarrassingVideoPlayed: false, // Track if embarrassing video has been played
    round1: {
        tiles: [],
        emptyIndex: 8,
        timeLeft: 180, // 3 minutes
        timer: null,
        solved: false,
        tileImages: [], // Store sliced tile images
        moves: 0 // Track moves for round 1
    },
    round2: {
        words: ["Manasvi", "Mariyamma", "Thoshini", "Alekhya"],
        clues: [
            "Best friend",
            "Friend who invited you to her house",
            "Friend whose name starts with T and ends with i",
            "Friend who has the same starting letter and ending letter in your name"
        ],
        crosswordGrid: [],
        userInput: Array(4).fill(""),
        currentIndex: 0,
        attempts: [3, 3, 3, 3],
        solved: [false, false, false, false],
        timeLeft: 120, // 2 minutes
        timer: null,
        selectedLetters: [] // Track selected letters in the wheel
    },
    round3: {
        sequence: [],
        userSequence: [],
        showingSequence: false,
        playingNote: null
    }
};

// DOM Elements
let screens = {};
let audios = {};
let videos = {};

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    screens = {
        welcome: document.getElementById('welcomeScreen'),
        round1: document.getElementById('round1Screen'),
        round2: document.getElementById('round2Screen'),
        round3: document.getElementById('round3Screen'),
        bonus: document.getElementById('bonusScreen'),
        final: document.getElementById('finalScreen')
    };

    // Audio elements
    audios = {
        cant: document.getElementById('cantAudio'),
        note1: document.getElementById('note1Audio'),
        note2: document.getElementById('note2Audio'),
        note3: document.getElementById('note3Audio'),
        note4: document.getElementById('note4Audio')
    };

    // Video elements
    videos = {
        embarrassing: document.getElementById('embarrassingVideo'),
        final: document.getElementById('finalVideo')
    };

    // Set full volume for "you_cant" audio
    if (audios.cant) {
        audios.cant.volume = 1.0;
    }

    // Event listeners
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('autoCompleteButton').addEventListener('click', autoCompleteRound1);
    document.getElementById('submitWord').addEventListener('click', submitWord);
    document.getElementById('bonusContinue').addEventListener('click', () => {
        // Stop the embarrassing video if it's playing
        if (videos.embarrassing) {
            videos.embarrassing.pause();
            videos.embarrassing.currentTime = 0;
        }
        
        showFinalStage();
    });
    document.getElementById('hidePreview').addEventListener('click', hideRound1Preview);
    
    // Word input enter key
    document.getElementById('wordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitWord();
    });
    
    // Color buttons for round 3
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!gameState.round3.showingSequence) {
                handleColorClick(parseInt(btn.dataset.color));
            }
        });
    });
    
    // Video event listeners
    if (videos.embarrassing) {
        videos.embarrassing.addEventListener('ended', () => {
            // Only proceed to final stage if video has been played at least once
            if (gameState.embarrassingVideoPlayed) {
                showFinalStage();
            }
        });
    }
    
    // Final video event listeners
    if (videos.final) {
        videos.final.addEventListener('ended', () => {
            // Video ended, but we want it to loop so this might not be needed
            console.log('Final video ended');
        });
    }
    
    // Play again button event listener
    const playAgainBtn = document.getElementById('playAgainBtn');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            // Reset game state and go back to welcome screen
            resetGameState();
            showScreen('welcome');
        });
    }
    
    // Developer shortcut
    document.addEventListener('keydown', handleDeveloperShortcut);
});

// Developer shortcut handler
function handleDeveloperShortcut(event) {
    // Check if just 'N' is pressed (without Ctrl)
    if (event.key === 'Shift' && event.key === 'n') {
        event.preventDefault(); // Prevent default browser behavior
        
        // Instantly expire the timer based on current round
        switch (gameState.currentRound) {
            case 1:
                if (gameState.round1.timer) {
                    clearInterval(gameState.round1.timer);
                    gameState.round1.timeLeft = 0;
                    updateTimerDisplay('timer1', 0);
                    timeUpRound1();
                }
                break;
            case 2:
                if (gameState.round2.timer) {
                    clearInterval(gameState.round2.timer);
                    gameState.round2.timeLeft = 0;
                    updateTimerDisplay('timer2', 0);
                    timeUpRound2();
                }
                break;
        }
    }
    // Check if Ctrl+S is pressed for skipping rounds
    else if (event.ctrlKey && event.key === 'q') {
        event.preventDefault(); // Prevent default browser behavior (save dialog)
        
        // Skip to next round based on current round
        switch (gameState.currentRound) {
            case 1:
                // Skip round 1 - solve puzzle automatically
                if (gameState.round1.timer) {
                    clearInterval(gameState.round1.timer);
                }
                gameState.round1.tiles = [0, 1, 2, 3, 4, 5, 6, 7, null];
                gameState.round1.emptyIndex = 8;
                gameState.round1.solved = true;
                gameState.round1.timeLeft = 0;
                updateTimerDisplay('timer1', 0);
                renderPuzzle();
                document.getElementById('puzzleSolved').classList.remove('hidden');
                document.getElementById('autoCompleteButton').classList.add('hidden');
                
                // Move to next round after delay
                setTimeout(() => {
                    showScreen('round2');
                    initializeRound2();
                }, 1000);
                break;
            case 2:
                // Skip round 2 - solve all words
                if (gameState.round2.timer) {
                    clearInterval(gameState.round2.timer);
                }
                gameState.round2.solved = [true, true, true, true];
                gameState.round2.timeLeft = 0;
                updateTimerDisplay('timer2', 0);
                document.getElementById('wordResult').innerHTML = 
                    '<span style="color: #51cf66;">Round skipped! 🎉</span>';
                
                // Move to next round after delay
                setTimeout(() => {
                    showScreen('round3');
                    initializeRound3();
                }, 1000);
                break;
            case 3:
                // Skip round 3 - show bonus screen
                showScreen('bonus');
                break;
        }
    }
}

// Start the game
function startGame() {
    gameState.playerName = document.getElementById('playerName').value || "Amrutha";
    document.getElementById('birthdayGreeting').textContent = `Happy Birthday ${gameState.playerName}! 🎂`;
    
    showScreen('round1');
    initializeRound1();
}

// Reset game state
function resetGameState() {
    // Reset all game state variables
    gameState.currentRound = 1;
    gameState.embarrassingVideoPlayed = false;
    
    // Reset round 1
    gameState.round1.tiles = [];
    for (let i = 0; i < 9; i++) {
        gameState.round1.tiles.push(i === 8 ? null : i);
    }
    gameState.round1.emptyIndex = 8;
    gameState.round1.solved = false;
    gameState.round1.moves = 0;
    gameState.round1.selectedTile = null;
    gameState.round1.timeLeft = 60;
    if (gameState.round1.timer) {
        clearInterval(gameState.round1.timer);
        gameState.round1.timer = null;
    }
    
    // Reset round 2
    gameState.round2.currentIndex = 0;
    gameState.round2.userInput = Array(4).fill("");
    gameState.round2.attempts = [3, 3, 3, 3];
    gameState.round2.solved = [false, false, false, false];
    gameState.round2.timeLeft = 120;
    gameState.round2.selectedLetters = [];
    if (gameState.round2.timer) {
        clearInterval(gameState.round2.timer);
        gameState.round2.timer = null;
    }
    
    // Reset round 3
    gameState.round3.sequence = [0, 1, 2, 2, 3, 0];
    gameState.round3.userSequence = [];
    gameState.round3.showingSequence = false;
    gameState.round3.wrongAttempts = 0;
    
    // Reset UI elements
    document.getElementById('puzzleSolved').classList.add('hidden');
    document.getElementById('autoCompleteButton').classList.add('hidden');
    document.getElementById('wordResult').textContent = '';
    
    // Reset input fields
    document.getElementById('playerName').value = gameState.playerName;
    document.getElementById('wordInput').value = '';
    
    // Hide preview if visible
    hideRound1Preview();
}

// Show a specific screen
function showScreen(screenName) {
    // Hide all screens
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show the requested screen
    screens[screenName].classList.add('active');
    
    // Special handling for final screen to ensure video plays with audio
    if (screenName === 'final' && videos.final) {
        // Try to play the video with audio
        setTimeout(() => {
            videos.final.muted = false;
            videos.final.play().catch(e => {
                console.log('Failed to play final video with audio:', e);
                // If autoplay with audio fails, play muted
                videos.final.muted = true;
                videos.final.play().catch(e => console.log('Even muted video failed:', e));
            });
        }, 500);
    }
}

// Round 1 functions
function initializeRound1() {
    gameState.currentRound = 1;
    
    // Create solved puzzle
    gameState.round1.tiles = [];
    for (let i = 0; i < 9; i++) {
        gameState.round1.tiles.push(i === 8 ? null : i);
    }
    gameState.round1.emptyIndex = 8;
    gameState.round1.solved = false;
    gameState.round1.moves = 0;
    gameState.round1.selectedTile = null;
    
    // Load the default image with better quality handling
    loadRound1Image().then(() => {
        // Render the puzzle
        renderPuzzle();
        
        // Shuffle the tiles automatically when the game starts
        setTimeout(() => {
            shuffleRound1Tiles();
        }, 500);
        
        // Start the timer
        startRound1Timer();
        
        // Show preview by default at the start of round 1
        showRound1Preview();
    }).catch(() => {
        // Fallback if canvas fails - still render
        console.log('Image loading failed, using fallback');
        renderPuzzle();
        // Shuffle the tiles automatically when the game starts
        setTimeout(() => {
            shuffleRound1Tiles();
        }, 500);
        startRound1Timer();
        showRound1Preview();
    });
}

function loadRound1Image() {
    return new Promise((resolve, reject) => {
        // For local files, we need to use a different approach to avoid CORS issues and maintain quality
        fetch('public/child_photo.jpg')
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        createHighQualityTiles(img);
                        resolve();
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(blob);
            })
            .catch(() => {
                // Fallback to direct image loading
                const img = new Image();
                img.onload = () => {
                    createHighQualityTiles(img);
                    resolve();
                };
                img.onerror = () => {
                    console.log('Image failed to load');
                    reject();
                };
                img.src = 'public/child_photo.jpg';
            });
    });
}

function createHighQualityTiles(image) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Use a larger maxSize for better quality
    const maxSize = 600;
    let width = image.width;
    let height = image.height;
    
    if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width *= ratio;
        height *= ratio;
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    
    gameState.round1.tileWidth = width / 3;
    gameState.round1.tileHeight = height / 3;
    
    // Create individual tile images with higher quality
    gameState.round1.tileImages = [];
    
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const tileCanvas = document.createElement('canvas');
            const tileCtx = tileCanvas.getContext('2d');
            if (!tileCtx) continue;
            
            tileCanvas.width = gameState.round1.tileWidth;
            tileCanvas.height = gameState.round1.tileHeight;
            
            tileCtx.drawImage(
                ctx.canvas,
                col * gameState.round1.tileWidth, row * gameState.round1.tileHeight,
                gameState.round1.tileWidth, gameState.round1.tileHeight,
                0, 0,
                gameState.round1.tileWidth, gameState.round1.tileHeight
            );
            
            gameState.round1.tileImages.push(tileCanvas.toDataURL());
        }
    }
    
    console.log('High quality image tiles created successfully');
}

function createImageTiles() {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            console.log('Image loaded successfully');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.log('Canvas context not available');
                reject();
                return;
            }
            
            // Set canvas size to maintain aspect ratio
            const maxSize = 300;
            const aspectRatio = img.width / img.height;
            
            let canvasWidth, canvasHeight;
            if (aspectRatio > 1) {
                canvasWidth = maxSize;
                canvasHeight = maxSize / aspectRatio;
            } else {
                canvasHeight = maxSize;
                canvasWidth = maxSize * aspectRatio;
            }
            
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            
            // Draw the image scaled to fit the canvas
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
            
            // Create individual tile images
            gameState.round1.tileImages = [];
            const tileSizeX = canvasWidth / 3;
            const tileSizeY = canvasHeight / 3;
            
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    const tileCanvas = document.createElement('canvas');
                    const tileCtx = tileCanvas.getContext('2d');
                    if (!tileCtx) continue;
                    
                    tileCanvas.width = tileSizeX;
                    tileCanvas.height = tileSizeY;
                    
                    tileCtx.drawImage(
                        canvas,
                        col * tileSizeX, row * tileSizeY, tileSizeX, tileSizeY,
                        0, 0, tileSizeX, tileSizeY
                    );
                    
                    gameState.round1.tileImages.push(tileCanvas.toDataURL());
                }
            }
            
            console.log('Image tiles created successfully');
            resolve();
        };
        img.onerror = () => {
            console.log('Image failed to load');
            reject();
        };
        img.src = 'public/child_photo.jpg';
    });
}

function renderPuzzle() {
    console.log('Rendering puzzle');
    const container = document.getElementById('puzzleContainer');
    container.innerHTML = '';
    
    // Add instruction text
    const instruction = document.createElement('p');
    instruction.textContent = 'Drag and drop the tiles to solve the puzzle!';
    instruction.style.textAlign = 'center';
    instruction.style.width = '100%';
    instruction.style.gridColumn = '1 / -1';
    instruction.style.margin = '10px 0';
    instruction.style.color = '#ff6b6b';
    instruction.style.fontWeight = 'bold';
    instruction.style.fontSize = '1.1rem';
    container.appendChild(instruction);
    
    // Add shuffle and auto solve buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.width = '100%';
    buttonContainer.style.gridColumn = '1 / -1';
    buttonContainer.style.margin = '10px 0';
    buttonContainer.style.flexWrap = 'wrap';
    
    const shuffleBtn = document.createElement('button');
    shuffleBtn.textContent = 'Shuffle';
    shuffleBtn.className = 'preview-btn';
    shuffleBtn.addEventListener('click', shuffleRound1Tiles);
    
    const solveBtn = document.createElement('button');
    solveBtn.textContent = 'Auto Solve';
    solveBtn.className = 'preview-btn';
    solveBtn.addEventListener('click', autoCompleteRound1);
    
    const previewBtn = document.createElement('button');
    previewBtn.textContent = 'Preview';
    previewBtn.className = 'preview-btn';
    previewBtn.addEventListener('click', toggleRound1Preview);
    
    buttonContainer.appendChild(shuffleBtn);
    buttonContainer.appendChild(solveBtn);
    buttonContainer.appendChild(previewBtn);
    container.appendChild(buttonContainer);
    
    // Create puzzle grid with proper sizing
    const gridSize = 3;
    if (gameState.round1.tileWidth && gameState.round1.tileHeight) {
        container.style.gridTemplateColumns = `repeat(${gridSize}, ${gameState.round1.tileWidth}px)`;
        container.style.gridTemplateRows = `repeat(${gridSize}, ${gameState.round1.tileHeight}px)`;
    } else {
        container.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    }
    
    // Create tile elements with drag and drop functionality
    gameState.round1.tileElements = [];
    
    gameState.round1.tiles.forEach((tile, index) => {
        const tileElement = document.createElement('div');
        tileElement.className = `puzzle-tile ${tile === null ? 'empty' : ''}`;
        tileElement.dataset.index = index;
        
        // Set proper sizing
        if (gameState.round1.tileWidth && gameState.round1.tileHeight) {
            tileElement.style.width = `${gameState.round1.tileWidth}px`;
            tileElement.style.height = `${gameState.round1.tileHeight}px`;
        }
        
        if (tile !== null && gameState.round1.tileImages[tile]) {
            // Use actual sliced image
            tileElement.style.backgroundImage = `url(${gameState.round1.tileImages[tile]})`;
            tileElement.style.backgroundSize = 'cover';
            tileElement.style.backgroundPosition = 'center';
        } else if (tile !== null) {
            // Fallback to CSS background positioning
            const row = Math.floor(tile / 3);
            const col = tile % 3;
            tileElement.style.backgroundImage = 'url(public/child_photo.jpg)';
            tileElement.style.backgroundPosition = `-${col * 33.33}% -${row * 33.33}%`;
            tileElement.style.backgroundSize = '300% 300%';
        }
        
        // Add click and drag functionality
        tileElement.addEventListener('click', () => handleRound1TileClick(index));
        
        // Add drag and drop functionality
        if (tile !== null) { // Only non-empty tiles can be dragged
            tileElement.draggable = true;
            tileElement.addEventListener('dragstart', (e) => handleDragStart(e, index));
        }
        
        // All tiles can be drop targets
        tileElement.addEventListener('dragover', handleDragOver);
        tileElement.addEventListener('drop', (e) => handleDrop(e, index));
        
        // Store reference for drag and drop
        gameState.round1.tileElements.push(tileElement);
        container.appendChild(tileElement);
    });
    console.log('Puzzle rendered');
}

function handleRound1TileClick(index) {
    if (gameState.round1.solved) return;
    
    const clickedTile = gameState.round1.tiles[index];
    if (clickedTile === null) return;
    
    // Check if there's already a selected tile
    if (gameState.round1.selectedTile === null) {
        // Select this tile
        gameState.round1.selectedTile = index;
        if (gameState.round1.tileElements && gameState.round1.tileElements[index]) {
            gameState.round1.tileElements[index].classList.add('selected');
        }
    } else if (gameState.round1.selectedTile === index) {
        // Deselect the same tile
        if (gameState.round1.tileElements && gameState.round1.tileElements[index]) {
            gameState.round1.tileElements[index].classList.remove('selected');
        }
        gameState.round1.selectedTile = null;
    } else {
        // Swap the selected tile with this tile
        swapRound1Tiles(gameState.round1.selectedTile, index);
        
        // Deselect the previously selected tile
        if (gameState.round1.tileElements && gameState.round1.tileElements[gameState.round1.selectedTile]) {
            gameState.round1.tileElements[gameState.round1.selectedTile].classList.remove('selected');
        }
        gameState.round1.selectedTile = null;
    }
}

function swapRound1Tiles(index1, index2) {
    // Swap the tile positions in the game state
    [gameState.round1.tiles[index1], gameState.round1.tiles[index2]] = 
    [gameState.round1.tiles[index2], gameState.round1.tiles[index1]];
    
    // Update empty index if needed
    if (gameState.round1.tiles[index1] === null) {
        gameState.round1.emptyIndex = index1;
    } else if (gameState.round1.tiles[index2] === null) {
        gameState.round1.emptyIndex = index2;
    }
    
    // Update moves counter
    gameState.round1.moves++;
    
    // Re-render the puzzle to update positions
    renderPuzzle();
    
    // Check if puzzle is solved
    if (checkPuzzleSolved()) {
        solvePuzzle();
    }
}

// Drag and drop handlers for round 1
function handleDragStart(e, tileIndex) {
    e.dataTransfer.setData('text/plain', tileIndex);
    // Add visual feedback
    e.target.style.opacity = '0.75';
}

function handleDragOver(e) {
    e.preventDefault(); // Allow drop
}

function handleDrop(e, targetIndex) {
    e.preventDefault();
    
    if (gameState.round1.solved) return;
    
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    // Reset opacity
    e.target.style.opacity = '1';
    
    // Check if target is the empty tile
    if (gameState.round1.tiles[targetIndex] === null) {
        // Check if source tile is adjacent to empty tile
        const sourceRow = Math.floor(sourceIndex / 3);
        const sourceCol = sourceIndex % 3;
        const targetRow = Math.floor(targetIndex / 3);
        const targetCol = targetIndex % 3;
        
        const isAdjacent = 
            (sourceRow === targetRow && Math.abs(sourceCol - targetCol) === 1) ||
            (sourceCol === targetCol && Math.abs(sourceRow - targetRow) === 1);
        
        if (isAdjacent) {
            swapRound1Tiles(sourceIndex, targetIndex);
        }
    }
}

function handlePuzzleClick(index) {
    if (gameState.round1.solved) return;
    
    const clickedTile = gameState.round1.tiles[index];
    if (clickedTile === null) return;
    
    // Check if clicked tile is adjacent to empty space
    const emptyIndex = gameState.round1.emptyIndex;
    const clickedRow = Math.floor(index / 3);
    const clickedCol = index % 3;
    const emptyRow = Math.floor(emptyIndex / 3);
    const emptyCol = emptyIndex % 3;
    
    const isAdjacent = 
        (clickedRow === emptyRow && Math.abs(clickedCol - emptyCol) === 1) ||
        (clickedCol === emptyCol && Math.abs(clickedRow - emptyRow) === 1);
    
    if (isAdjacent) {
        // Swap tiles
        [gameState.round1.tiles[index], gameState.round1.tiles[emptyIndex]] = 
        [gameState.round1.tiles[emptyIndex], gameState.round1.tiles[index]];
        
        gameState.round1.emptyIndex = index;
        renderPuzzle();
        
        // Check if puzzle is solved
        if (checkPuzzleSolved()) {
            solvePuzzle();
        }
    }
}

function checkPuzzleSolved() {
    for (let i = 0; i < 8; i++) {
        if (gameState.round1.tiles[i] !== i) return false;
    }
    return gameState.round1.tiles[8] === null;
}

function solvePuzzle() {
    gameState.round1.solved = true;
    document.getElementById('puzzleSolved').classList.remove('hidden');
    document.getElementById('autoCompleteButton').classList.add('hidden');
    
    // Stop the timer
    if (gameState.round1.timer) {
        clearInterval(gameState.round1.timer);
    }
    
    // Move to next round after delay
    setTimeout(() => {
        showScreen('round2');
        initializeRound2();
    }, 2000);
}

function startRound1Timer() {
    console.log('Starting round 1 timer');
    gameState.round1.timeLeft = 180; // Reset to 3 minutes
    updateTimerDisplay('timer1', gameState.round1.timeLeft);
    
    if (gameState.round1.timer) {
        clearInterval(gameState.round1.timer);
    }
    
    gameState.round1.timer = setInterval(() => {
        gameState.round1.timeLeft--;
        updateTimerDisplay('timer1', gameState.round1.timeLeft);
        
        if (gameState.round1.timeLeft <= 0) {
            clearInterval(gameState.round1.timer);
            timeUpRound1();
        }
    }, 1000);
}

function updateTimerDisplay(elementId, timeLeft) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timerElement = document.getElementById(elementId);
    
    if (timerElement) {
        timerElement.textContent = `Time Left: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 30) {
            timerElement.classList.add('warning');
        } else {
            timerElement.classList.remove('warning');
        }
    }
}

function timeUpRound1() {
    // Play "you_cant" audio with full volume
    if (audios.cant) {
        audios.cant.volume = 1.0;
        audios.cant.play().catch(e => console.log('Audio play failed:', e));
    }
    
    // Show auto-complete button
    document.getElementById('autoCompleteButton').classList.remove('hidden');
    document.getElementById('puzzleSolved').classList.add('hidden');
}

function shuffleRound1Tiles() {
    if (gameState.round1.solved) return;
    
    // Fisher-Yates shuffle algorithm
    for (let i = gameState.round1.tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.round1.tiles[i], gameState.round1.tiles[j]] = 
        [gameState.round1.tiles[j], gameState.round1.tiles[i]];
    }
    
    gameState.round1.emptyIndex = gameState.round1.tiles.indexOf(null);
    gameState.round1.moves++;
    
    // Clear any selected tile
    gameState.round1.selectedTile = null;
    
    renderPuzzle();
}

function showRound1Preview() {
    const previewContainer = document.getElementById('previewImage');
    previewContainer.style.display = 'flex';
    // Add show class after a brief delay to trigger transition
    setTimeout(() => {
        previewContainer.classList.add('show');
    }, 10);
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
        hideRound1Preview();
    }, 8000);
}

function hideRound1Preview() {
    const previewContainer = document.getElementById('previewImage');
    previewContainer.classList.remove('show');
    
    // After transition ends, set display to none
    setTimeout(() => {
        previewContainer.style.display = 'none';
    }, 500); // Match CSS transition duration
}

function toggleRound1Preview() {
    const previewContainer = document.getElementById('previewImage');
    
    if (previewContainer.style.display === 'none' || !previewContainer.style.display) {
        showRound1Preview();
    } else {
        hideRound1Preview();
    }
}

function autoCompleteRound1() {
    // Solve the puzzle automatically
    gameState.round1.tiles = [0, 1, 2, 3, 4, 5, 6, 7, null];
    gameState.round1.emptyIndex = 8;
    gameState.round1.solved = true;
    
    renderPuzzle();
    document.getElementById('puzzleSolved').classList.remove('hidden');
    document.getElementById('autoCompleteButton').classList.add('hidden');
    
    // Stop the timer
    if (gameState.round1.timer) {
        clearInterval(gameState.round1.timer);
    }
    
    // Move to next round after delay
    setTimeout(() => {
        showScreen('round2');
        // Clear any selected letters from round 1 if needed
        if (gameState.round2) {
            gameState.round2.selectedLetters = [];
        }
        initializeRound2();
    }, 2000);
}

// Round 2 functions (Word Wheel Puzzle)
function initializeRound2() {
    gameState.currentRound = 2;
    
    gameState.round2.currentIndex = 0;
    gameState.round2.userInput = Array(4).fill("");
    gameState.round2.attempts = [3, 3, 3, 3];
    gameState.round2.solved = [false, false, false, false];
    gameState.round2.timeLeft = 120; // 2 minutes
    gameState.round2.crosswordGrid = Array(4).fill(null).map(() => Array(10).fill('')); // 4 rows, 10 columns
    
    // Initially show only the crossword-word elements
    renderCrosswordDisplay();
    updateAttemptsDisplay();
    updateWordProgress();
    
    document.getElementById('wordInput').value = '';
    document.getElementById('wordResult').textContent = '';
    
    // Start the timer
    startRound2Timer();
}

function renderCrosswordGrid() {
    const gridContainer = document.getElementById('crosswordGrid');
    gridContainer.innerHTML = '';
    
    // Check if all words are solved
    const allSolved = gameState.round2.solved.every(solved => solved);
    
    if (!allSolved) {
        // Hide the grid until all words are solved
        gridContainer.style.display = 'none';
        return;
    }
    
    // Show the grid when all words are solved
    gridContainer.style.display = 'grid';
    
    // Create a 4x10 grid for the crossword
    gridContainer.style.gridTemplateColumns = 'repeat(10, 1fr)';
    gridContainer.style.gridTemplateRows = 'repeat(4, 1fr)';
    
    // Define letters for each row (based on the words to guess)
    // Words: Manasvi, Mariyamma, Thoshini, Alekhya
    const wordLetters = [
        ['M', 'A', 'N', 'A', 'S', 'V', 'I', '', '', ''],
        ['M', 'A', 'R', 'I', 'Y', 'A', 'M', 'M', 'A', ''],
        ['T', 'H', 'O', 'S', 'H', 'I', 'N', 'I', '', ''],
        ['A', 'L', 'E', 'K', 'H', 'Y', 'A', '', '', '']
    ];
    
    // Create grid cells
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 10; col++) {
            const cell = document.createElement('div');
            cell.className = 'crossword-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // If there's a letter for this position, show it as a hint
            if (wordLetters[row][col]) {
                cell.textContent = wordLetters[row][col];
                // Add a class to indicate this is a hint cell
                cell.classList.add('hint');
            }
            
            gridContainer.appendChild(cell);
        }
    }
    
    // Fill in the solved words
    for (let i = 0; i < gameState.round2.words.length; i++) {
        if (gameState.round2.solved[i]) {
            placeWordInGrid(i, gameState.round2.words[i]);
        }
    }
}

function handleCrosswordCellClick(cellElement, row, col) {
    // Get the current word to solve
    const currentWord = gameState.round2.words[gameState.round2.currentIndex];
    
    // If this cell is part of the current word, allow input
    // For simplicity, we'll just focus the input field when a cell is clicked
    document.getElementById('wordInput').focus();
}

function renderCrosswordDisplay() {
    const crosswordContainer = document.getElementById('crosswordDisplay');
    crosswordContainer.innerHTML = '';
    
    // Get the current word to solve
    const currentWord = gameState.round2.words[gameState.round2.currentIndex];
    
    // Create display for the current word
    const wordDisplay = document.createElement('div');
    wordDisplay.className = 'crossword-word';
    
    for (let i = 0; i < currentWord.length; i++) {
        const letterElement = document.createElement('div');
        letterElement.className = 'crossword-letter';
        letterElement.dataset.position = i;
        
        // If the letter has been guessed correctly, show it
        if (gameState.round2.solved[gameState.round2.currentIndex]) {
            letterElement.textContent = currentWord[i];
            letterElement.classList.add('filled');
        }
        
        wordDisplay.appendChild(letterElement);
    }
    
    crosswordContainer.appendChild(wordDisplay);
    
    // Add event listener to crossword grid cells
    const cells = document.querySelectorAll('.crossword-cell');
    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            handleCrosswordCellClick(cell, row, col);
        });
    });
}

function updateWordClues() {
    const cluesContainer = document.getElementById('wordClues');
    cluesContainer.innerHTML = '<h3>Current Clue:</h3><ul>';
    
    // Show only the current clue
    const currentClue = gameState.round2.clues[gameState.round2.currentIndex];
    cluesContainer.innerHTML += `<li>${gameState.round2.currentIndex + 1}. ${currentClue}</li>`;
    cluesContainer.innerHTML += '</ul>';
}

function renderCrossword() {
    // This function is now replaced by renderCrosswordGrid and renderCrosswordDisplay
    renderCrosswordGrid();
    renderCrosswordDisplay();
    updateWordClues();
}

function placeWordInGrid(rowIndex, word) {
    // Update the crossword grid with the solved word
    const cells = document.querySelectorAll('.crossword-cell');
    
    // Find cells in the specified row
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // If this cell is in the row we're updating and within the word length
        if (row === rowIndex && col < word.length) {
            cell.textContent = word[col];
            cell.classList.add('filled');
            // Remove hint class if it was a hint cell
            cell.classList.remove('hint');
        }
    });
}

function updateAttemptsDisplay() {
    document.getElementById('attemptsDisplay').textContent = 
        `Attempts: ${gameState.round2.attempts[gameState.round2.currentIndex]}`;
}

function updateWordProgress() {
    const dots = document.querySelectorAll('#wordProgress .progress-dot');
    dots.forEach((dot, index) => {
        dot.className = 'progress-dot';
        if (index < gameState.round2.currentIndex) {
            dot.classList.add('completed');
        } else if (index === gameState.round2.currentIndex) {
            dot.classList.add('current');
        }
    });
    
    // Reset the word wheel for the new word
    resetWordWheel();
    
    // Update the crossword display and clues for the current word
    renderCrosswordDisplay();
    updateWordClues();
}

function resetWordWheel() {
    // Clear selected letters
    gameState.round2.selectedLetters = [];
    
    // Remove selection from all letters
    const selectedLetters = document.querySelectorAll('.wheel-letter.selected');
    selectedLetters.forEach(letter => letter.classList.remove('selected'));
    
    // Update the input field
    document.getElementById('wordInput').value = '';
}

function submitWord() {
    const userInput = document.getElementById('wordInput').value.trim();
    const currentIndex = gameState.round2.currentIndex;
    const correctWord = gameState.round2.words[currentIndex];
    
    if (userInput.toLowerCase() === correctWord.toLowerCase()) {
        // Correct answer
        gameState.round2.solved[currentIndex] = true;
        document.getElementById('wordResult').innerHTML = 
            '<span style="color: #51cf66;">Correct! 🎉</span>';
        
        // Place the correct word in the crossword grid
        placeWordInGrid(currentIndex, correctWord);
        
        // Update the crossword display to show the filled word
        renderCrosswordDisplay();
        
        if (currentIndex < 3) {
            // Move to next word
            setTimeout(() => {
                gameState.round2.currentIndex++;
                updateWordProgress();
                updateAttemptsDisplay();
                document.getElementById('wordInput').value = '';
                document.getElementById('wordResult').textContent = '';
            }, 1000);
        } else {
            // All words solved
            // Show the complete crossword grid
            setTimeout(() => {
                renderCrosswordGrid();
                renderCrosswordDisplay();
            }, 1000);
            
            // Stop the timer
            if (gameState.round2.timer) {
                clearInterval(gameState.round2.timer);
            }
            
            setTimeout(() => {
                showScreen('round3');
                initializeRound3();
            }, 2500);
        }
    } else {
        // Incorrect answer
        gameState.round2.attempts[currentIndex]--;
        updateAttemptsDisplay();
        
        if (gameState.round2.attempts[currentIndex] > 0) {
            document.getElementById('wordResult').innerHTML = 
                '<span style="color: #ff6b6b;">Try again! ❌</span>';
        } else {
            // No more attempts
            if (audios.cant) {
                audios.cant.volume = 1.0;
                audios.cant.play().catch(e => console.log('Audio play failed:', e));
            }
            document.getElementById('wordResult').innerHTML = 
                '<span style="color: #ff6b6b;">Oh no! You couldn\'t solve all the names!</span>';
            
            // Reset the round after a delay
            setTimeout(() => {
                initializeRound2();
            }, 2000);
        }
    }
}

function startRound2Timer() {
    gameState.round2.timeLeft = 120; // Reset to 2 minutes
    updateTimerDisplay('timer2', gameState.round2.timeLeft);
    
    if (gameState.round2.timer) {
        clearInterval(gameState.round2.timer);
    }
    
    gameState.round2.timer = setInterval(() => {
        gameState.round2.timeLeft--;
        updateTimerDisplay('timer2', gameState.round2.timeLeft);
        
        if (gameState.round2.timeLeft <= 0) {
            clearInterval(gameState.round2.timer);
            timeUpRound2();
        }
    }, 1000);
}

function timeUpRound2() {
    // Play "you_cant" audio with full volume
    if (audios.cant) {
        audios.cant.volume = 1.0;
        audios.cant.play().catch(e => console.log('Audio play failed:', e));
    }
    
    // Reset the round
    gameState.round2.selectedLetters = [];
    initializeRound2();
}

// Round 3 functions
function initializeRound3() {
    gameState.currentRound = 3;
    
    // Set the specific sequence: blue, red, green, green, yellow, blue
    // Corresponds to colors: 0, 1, 2, 2, 3, 0
    gameState.round3.sequence = [0, 1, 2, 2, 3, 0];
    gameState.round3.userSequence = [];
    gameState.round3.showingSequence = false;
    gameState.round3.wrongAttempts = 0; // Track wrong attempts
    
    // Render sequence display
    renderSequenceDisplay();
    
    // Show the sequence after a short delay
    setTimeout(() => {
        showSequence();
    }, 1000);
}

function renderSequenceDisplay() {
    const container = document.getElementById('sequenceDisplay');
    container.innerHTML = '';
    
    // Create dots equal to the sequence length
    for (let i = 0; i < gameState.round3.sequence.length; i++) {
        const dot = document.createElement('div');
        dot.className = 'sequence-dot';
        container.appendChild(dot);
    }
}

function showSequence() {
    gameState.round3.showingSequence = true;
    document.getElementById('round3Instructions').textContent = 'Listen to the sequence...';
    
    // Reset wrong attempts when showing sequence
    gameState.round3.wrongAttempts = 0;
    
    let i = 0;
    const showNext = () => {
        if (i < gameState.round3.sequence.length) {
            playNote(gameState.round3.sequence[i]);
            
            // Highlight the dot
            const dots = document.querySelectorAll('.sequence-dot');
            if (dots[i]) {
                dots[i].classList.add('active');
            }
            
            i++;
            setTimeout(() => {
                // Remove highlight
                const dots = document.querySelectorAll('.sequence-dot');
                if (i > 0 && dots[i-1]) {
                    dots[i-1].classList.remove('active');
                }
                setTimeout(showNext, 500); // Slower pace for easier recognition
            }, 700);
        } else {
            // Finished showing sequence
            setTimeout(() => {
                gameState.round3.showingSequence = false;
                document.getElementById('round3Instructions').textContent = 'Repeat the sequence!';
            }, 500);
        }
    };
    
    showNext();
}

function playNote(noteIndex) {
    gameState.round3.playingNote = noteIndex;
    
    // Play the audio
    const audio = audios[`note${noteIndex + 1}`];
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
    
    // Visual feedback
    const buttons = document.querySelectorAll('.color-btn');
    if (buttons[noteIndex]) {
        buttons[noteIndex].style.transform = 'translateY(-12px) scale(1.1)';
        setTimeout(() => {
            buttons[noteIndex].style.transform = 'translateY(-8px)';
        }, 300);
    }
    
    setTimeout(() => {
        gameState.round3.playingNote = null;
    }, 300);
}

function handleColorClick(colorIndex) {
    if (gameState.round3.showingSequence || gameState.round3.sequence.length === 0) return;
    
    playNote(colorIndex);
    
    gameState.round3.userSequence.push(colorIndex);
    const currentIndex = gameState.round3.userSequence.length - 1;
    
    // Check if the clicked note matches the sequence
    if (gameState.round3.userSequence[currentIndex] !== gameState.round3.sequence[currentIndex]) {
        // Wrong note - play "you_cant" audio and show video
        gameState.round3.wrongAttempts = (gameState.round3.wrongAttempts || 0) + 1;
        
        if (audios.cant) {
            audios.cant.volume = 1.0;
            audios.cant.play().catch(e => console.log('Audio play failed:', e));
        }
        
        // Show the embarrassing video after a short delay
        setTimeout(() => {
            showFinalStage();
        }, 2000);
        
        return;
    }
    
    // Check if sequence is complete
    if (gameState.round3.userSequence.length === gameState.round3.sequence.length) {
        // Correct sequence
        document.getElementById('round3Instructions').innerHTML = 
            '<span style="color: #51cf66;">Perfect! 🎵</span>';
        
        setTimeout(() => {
            showScreen('bonus');
        }, 2000);
    }
}

// Bonus and Final stages
function showFinalStage() {
    // Check if the embarrassing video has played at least once
    if (!gameState.embarrassingVideoPlayed) {
        // Mark that the video has been played
        gameState.embarrassingVideoPlayed = true;
        
        // Play the embarrassing video
        if (videos.embarrassing) {
            videos.embarrassing.play().catch(e => console.log('Video play failed:', e));
            return;
        }
    }
    
    // If video has already played, show the final screen
    showScreen('final');
    createConfetti();
    
    // Play the final video
    if (videos.final) {
        // Ensure the video is unmuted and plays with audio
        videos.final.muted = false;
        videos.final.play().catch(e => {
            console.log('Video play failed:', e);
            // Try again with muted if autoplay failed
            videos.final.muted = true;
            videos.final.play().catch(e => console.log('Muted video play also failed:', e));
        });
    }
}

function createConfetti() {
    const colors = ['#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b', '#ff8e8e', '#a1c4fd'];
    
    for (let i = 0; i < 200; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 15 + 5 + 'px';
        confetti.style.height = confetti.style.width;
        confetti.style.animationDuration = Math.random() * 4 + 3 + 's';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        
        document.body.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
        }, 7000);
    }
    
    // Try to unmute and play the final video with audio
    if (videos.final) {
        videos.final.muted = false;
        videos.final.play().catch(e => {
            console.log('Could not play final video with audio:', e);
        });
    }
}