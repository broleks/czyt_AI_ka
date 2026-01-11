(() => {
    "use strict";

    // Key bindings for keyboard control.
    const DIRECTION_KEYS = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        W: "up",
        s: "down",
        S: "down",
        a: "left",
        A: "left",
        d: "right",
        D: "right"
    };

    // Animation timing constants (in milliseconds).
    const RESIZE_DEBOUNCE_MS = 140;
    const POP_ANIMATION_MS = 240;

    // Canvas sizing constants (in pixels).
    const MIN_CANVAS_SIZE = 200;
    const DEFAULT_CANVAS_WIDTH = 800;
    const DEFAULT_CANVAS_HEIGHT = 600;

    // Storage key for the high score.
    const HIGH_SCORE_STORAGE_KEY = "snakeGameHighScore";

    // Audio feedback constants.
    const EAT_SOUND_FREQUENCY = 660;
    const EAT_SOUND_DURATION = 0.12;
    const EAT_SOUND_VOLUME = 0.08;
    const EAT_SOUND_FLOOR = 0.001;

    // Background decoration constants.
    const BACKGROUND_DOT_COUNT = 45;

    // Grid configuration for the snake board.
    const GRID_CONFIG = {
        default: { columns: 20, rows: 14 },
        kid: { columns: 14, rows: 10 }
    };

    // Difficulty settings expressed as moves per second.
    const DIFFICULTY_SETTINGS = {
        Easy: { speed: 4, label: "Wolno" },
        Medium: { speed: 6, label: "Normalnie" },
        Hard: { speed: 8, label: "Szybko" }
    };

    const GAME_STATES = {
        Start: "start",
        Running: "running",
        Paused: "paused",
        GameOver: "gameover"
    };

    const COLORS = {
        backgroundTop: "#f7fbff",
        backgroundBottom: "#e1f2ff",
        dot: "rgba(255, 255, 255, 0.6)",
        snakeHead: "#4caf50",
        snakeBody: "#7ad46b",
        snakeShadow: "rgba(0, 0, 0, 0.15)",
        foodStroke: "#ff8a65",
        overlay: "rgba(14, 28, 48, 0.55)",
        overlayText: "#ffffff"
    };

    const FOOD_STYLES = [
        { type: "apple", fill: "#ff5c5c" },
        { type: "banana", fill: "#ffd54f" },
        { type: "strawberry", fill: "#ff6fb2" },
        { type: "grape", fill: "#8e7dff" }
    ];

    // Font stack for canvas overlays (system fonts, no external CDN dependency).
    const OVERLAY_FONT = "system-ui, 'Segoe UI', Arial, sans-serif";

    // Gameplay tuning constants.
    const SPEED_INCREASE_EVERY = 5;
    const SPEED_BONUS_STEP = 0.4;
    const INITIAL_SNAKE_LENGTH = 3;
    const KID_SPEED_MULTIPLIER = 0.8;

    // Drawing ratios for snake.
    const SNAKE_RADIUS_RATIO = 0.35;
    const SNAKE_SHADOW_BLUR_RATIO = 0.15;
    const EYE_RADIUS_RATIO = 0.1;
    const PUPIL_RATIO = 0.5;
    const EYE_OFFSET_X_RATIO = 0.25;
    const EYE_OFFSET_Y_RATIO = 0.3;

    // Drawing ratios for food.
    const FOOD_INNER_RATIO = 0.68;
    const FOOD_STROKE_RATIO = 0.1;
    const FOOD_POP_BASE = 0.85;
    const FOOD_POP_RANGE = 0.15;
    const BANANA_STROKE_RATIO = 0.2;
    const BANANA_ARC_RADIUS_RATIO = 0.45;
    const BANANA_ARC_START = Math.PI * 1.1;
    const BANANA_ARC_END = Math.PI * 1.9;
    const GRAPE_RADIUS_RATIO = 0.22;
    const APPLE_STEM_STROKE_RATIO = 0.08;
    const APPLE_STEM_TOP_RATIO = 0.2;
    const APPLE_STEM_OVERHANG_RATIO = 0.1;
    const BANANA_CENTER_X_RATIO = 0.4;
    const BANANA_CENTER_Y_RATIO = 0.55;
    const STRAWBERRY_TOP_RATIO = 0.1;
    const STRAWBERRY_SIDE_RATIO = 0.85;
    const STRAWBERRY_RIGHT_RATIO = 0.9;
    const STRAWBERRY_BOTTOM_RATIO = 0.8;
    const STRAWBERRY_EDGE_RATIO = 0.15;
    const STRAWBERRY_CENTER_RATIO = 0.5;
    const GRAPE_CLUSTER_POSITIONS = [
        { x: 0.5, y: 0.2 },
        { x: 0.3, y: 0.45 },
        { x: 0.7, y: 0.45 },
        { x: 0.5, y: 0.7 }
    ];

    // Background dot size ratios.
    const DOT_SIZE_MIN = 0.5;
    const DOT_SIZE_RANGE = 2;

    // Overlay typography and layout constants (in pixels).
    const OVERLAY_TITLE_SIZE = 22;
    const OVERLAY_TEXT_SIZE = 16;
    const OVERLAY_TITLE_OFFSET = 24;
    const OVERLAY_TEXT_OFFSET = 6;
    const OVERLAY_TEXT_GAP = 30;
    const OVERLAY_PAUSE_OFFSET = 10;
    const OVERLAY_PAUSE_TEXT_OFFSET = 20;
    const OVERLAY_GAMEOVER_OFFSET = 20;
    const OVERLAY_GAMEOVER_TEXT_OFFSET = 8;

    class SnakeGameController {
        constructor(canvas, options, dotNetRef) {
            this.canvas = canvas;
            this.ctx = canvas.getContext("2d");
            this.dotNetRef = dotNetRef;

            this.options = {
                kidMode: options?.kidMode ?? false,
                difficulty: options?.difficulty ?? "Easy",
                soundEnabled: options?.soundEnabled ?? true
            };

            this.state = GAME_STATES.Start;
            this.score = 0;
            this.highScore = this.getHighScore();
            this.lastTickTime = 0;
            this.accumulator = 0;
            this.animationId = null;
            this.resizeTimeout = null;
            this.foodPopStart = 0;
            this.speedBonus = 0;
            this.currentInterval = this.getMoveInterval();

            this.direction = "right";
            this.pendingDirection = "right";

            this.grid = {
                columns: GRID_CONFIG.default.columns,
                rows: GRID_CONFIG.default.rows,
                cellSize: 24,
                offsetX: 0,
                offsetY: 0
            };

            this.snake = [];
            this.previousSnake = [];
            this.food = null;
            this.foodStyle = FOOD_STYLES[0];

            this.backgroundDots = this.createBackgroundDots(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT);

            this.audioContext = null;

            this.boundHandleKeyDown = this.handleKeyDown.bind(this);
            this.boundHandleResize = this.handleResize.bind(this);

            window.addEventListener("keydown", this.boundHandleKeyDown);
            window.addEventListener("resize", this.boundHandleResize);

            this.resizeObserver = null;
            if (typeof ResizeObserver !== "undefined") {
                this.resizeObserver = new ResizeObserver(() => {
                    this.handleResize();
                });
                this.resizeObserver.observe(this.canvas.parentElement ?? this.canvas);
            }

            this.reset();
            this.startRenderLoop();
        }

        start() {
            if (this.state === GAME_STATES.GameOver) {
                this.reset();
            }
            if (this.state !== GAME_STATES.Running) {
                this.accumulator = 0;
                this.lastTickTime = performance.now();
                this.state = GAME_STATES.Running;
                this.emitStateChange();
            }
        }

        pause() {
            if (this.state === GAME_STATES.Running) {
                this.state = GAME_STATES.Paused;
                this.emitStateChange();
            }
        }

        reset() {
            this.applyGridSettings();
            this.score = 0;
            this.speedBonus = 0;
            this.direction = "right";
            this.pendingDirection = "right";
            this.accumulator = 0;
            this.lastTickTime = performance.now();
            this.currentInterval = this.getMoveInterval();
            this.snake = this.createInitialSnake();
            this.previousSnake = this.cloneSnake(this.snake);
            this.spawnFood();
            this.state = GAME_STATES.Start;
            this.emitScoreChange();
            this.emitStateChange();
        }

        setDifficulty(level) {
            if (DIFFICULTY_SETTINGS[level]) {
                this.options.difficulty = level;
                this.emitScoreChange();
            }
        }

        setKidMode(enabled) {
            this.options.kidMode = Boolean(enabled);
            this.reset();
        }

        setSoundEnabled(enabled) {
            this.options.soundEnabled = Boolean(enabled);
        }

        setDirection(direction) {
            if (!direction) {
                return;
            }

            const isOpposite =
                (direction === "up" && this.direction === "down") ||
                (direction === "down" && this.direction === "up") ||
                (direction === "left" && this.direction === "right") ||
                (direction === "right" && this.direction === "left");

            if (!isOpposite && direction !== this.pendingDirection) {
                this.pendingDirection = direction;
            }
        }

        dispose() {
            window.removeEventListener("keydown", this.boundHandleKeyDown);
            window.removeEventListener("resize", this.boundHandleResize);

            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }

            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }

            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = null;
            }
        }

        handleKeyDown(event) {
            if (this.state === GAME_STATES.Paused && event.key === " ") {
                event.preventDefault();
                this.start();
                return;
            }

            const direction = DIRECTION_KEYS[event.key];
            if (!direction) {
                return;
            }

            event.preventDefault();
            this.setDirection(direction);

            if (this.state === GAME_STATES.Start) {
                this.start();
            }
        }

        handleResize() {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }

            this.resizeTimeout = setTimeout(() => {
                this.applyGridSettings();
            }, RESIZE_DEBOUNCE_MS);
        }

        startRenderLoop() {
            let lastFrameTime = performance.now();

            const render = (now) => {
                const delta = now - lastFrameTime;
                lastFrameTime = now;
                this.update(delta);
                this.draw();
                this.animationId = requestAnimationFrame(render);
            };

            this.animationId = requestAnimationFrame(render);
        }

        update(delta) {
            if (this.state !== GAME_STATES.Running) {
                return;
            }

            this.accumulator += delta;

            const baseSpeed = DIFFICULTY_SETTINGS[this.options.difficulty].speed;
            const speedMultiplier = this.options.kidMode ? KID_SPEED_MULTIPLIER : 1;
            const speed = baseSpeed + this.speedBonus;
            const interval = 1000 / (speed * speedMultiplier);
            this.currentInterval = interval;

            while (this.accumulator >= interval) {
                this.tick();
                this.accumulator -= interval;
            }
        }

        tick() {
            this.lastTickTime = performance.now();
            this.previousSnake = this.cloneSnake(this.snake);
            this.direction = this.pendingDirection;

            const head = this.snake[0];
            let nextX = head.x;
            let nextY = head.y;

            switch (this.direction) {
                case "up":
                    nextY -= 1;
                    break;
                case "down":
                    nextY += 1;
                    break;
                case "left":
                    nextX -= 1;
                    break;
                case "right":
                    nextX += 1;
                    break;
                default:
                    break;
            }

            if (this.options.kidMode) {
                nextX = (nextX + this.grid.columns) % this.grid.columns;
                nextY = (nextY + this.grid.rows) % this.grid.rows;
            } else {
                if (nextX < 0 || nextX >= this.grid.columns || nextY < 0 || nextY >= this.grid.rows) {
                    this.gameOver();
                    return;
                }
            }

            if (this.snake.some((segment) => segment.x === nextX && segment.y === nextY)) {
                this.gameOver();
                return;
            }

            this.snake.unshift({ x: nextX, y: nextY });

            if (this.food && this.food.x === nextX && this.food.y === nextY) {
                this.score += 1;
                this.speedBonus = Math.floor(this.score / SPEED_INCREASE_EVERY) * SPEED_BONUS_STEP;
                this.foodPopStart = performance.now();
                this.playEatSound();
                this.spawnFood();
                this.emitScoreChange();
            } else {
                this.snake.pop();
            }
        }

        draw() {
            const ctx = this.ctx;
            const { width, height } = this.canvas;
            ctx.clearRect(0, 0, width, height);

            this.drawBackground(ctx, width, height);
            this.drawFood(ctx);
            this.drawSnake(ctx);

            if (this.state !== GAME_STATES.Running) {
                this.drawOverlay(ctx, width, height);
            }
        }

        drawBackground(ctx, width, height) {
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, COLORS.backgroundTop);
            gradient.addColorStop(1, COLORS.backgroundBottom);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = COLORS.dot;
            for (const dot of this.backgroundDots) {
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        drawSnake(ctx) {
            const now = performance.now();
            const interpolation = Math.min((now - this.lastTickTime) / this.currentInterval, 1);

            for (let i = this.snake.length - 1; i >= 0; i--) {
                const current = this.snake[i];
                const previous = this.previousSnake[i] ?? current;

                const x = this.lerp(previous.x, current.x, interpolation);
                const y = this.lerp(previous.y, current.y, interpolation);

                const pixel = this.gridToPixel(x, y);
                const size = this.grid.cellSize;
                const radius = size * SNAKE_RADIUS_RATIO;

                ctx.save();
                ctx.shadowColor = COLORS.snakeShadow;
                ctx.shadowBlur = size * SNAKE_SHADOW_BLUR_RATIO;
                ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snakeBody;
                this.roundRect(ctx, pixel.x, pixel.y, size, size, radius);
                ctx.fill();
                ctx.restore();

                if (i === 0) {
                    this.drawSnakeEyes(ctx, pixel.x, pixel.y, size);
                }
            }
        }

        drawSnakeEyes(ctx, x, y, size) {
            const eyeRadius = size * EYE_RADIUS_RATIO;
            const pupilRadius = eyeRadius * PUPIL_RATIO;
            const offsetX = size * EYE_OFFSET_X_RATIO;
            const offsetY = size * EYE_OFFSET_Y_RATIO;

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, eyeRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + size - offsetX, y + offsetY, eyeRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#2f2f2f";
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, pupilRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + size - offsetX, y + offsetY, pupilRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        drawFood(ctx) {
            if (!this.food) {
                return;
            }

            const now = performance.now();
            const popElapsed = now - this.foodPopStart;
            const popProgress = Math.min(popElapsed / POP_ANIMATION_MS, 1);
            const scale = FOOD_POP_BASE + FOOD_POP_RANGE * this.easeOutBack(popProgress);

            const pixel = this.gridToPixel(this.food.x, this.food.y);
            const size = this.grid.cellSize;
            const centerX = pixel.x + size / 2;
            const centerY = pixel.y + size / 2;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.scale(scale, scale);
            ctx.translate(-centerX, -centerY);

            ctx.fillStyle = this.foodStyle.fill;
            ctx.strokeStyle = COLORS.foodStroke;
            ctx.lineWidth = size * FOOD_STROKE_RATIO;

            const innerSize = size * FOOD_INNER_RATIO;
            const offset = (size - innerSize) / 2;

            if (this.foodStyle.type === "banana") {
                this.drawBanana(ctx, pixel.x + offset, pixel.y + offset, innerSize);
            } else if (this.foodStyle.type === "strawberry") {
                this.drawStrawberry(ctx, pixel.x + offset, pixel.y + offset, innerSize);
            } else if (this.foodStyle.type === "grape") {
                this.drawGrape(ctx, pixel.x + offset, pixel.y + offset, innerSize);
            } else {
                this.drawApple(ctx, pixel.x + offset, pixel.y + offset, innerSize);
            }

            ctx.restore();
        }

        drawApple(ctx, x, y, size) {
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = "#6d4c41";
            ctx.lineWidth = size * APPLE_STEM_STROKE_RATIO;
            ctx.beginPath();
            ctx.moveTo(x + size / 2, y + size * APPLE_STEM_TOP_RATIO);
            ctx.lineTo(x + size / 2, y - size * APPLE_STEM_OVERHANG_RATIO);
            ctx.stroke();
        }

        drawBanana(ctx, x, y, size) {
            ctx.lineWidth = size * BANANA_STROKE_RATIO;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.arc(
                x + size * BANANA_CENTER_X_RATIO,
                y + size * BANANA_CENTER_Y_RATIO,
                size * BANANA_ARC_RADIUS_RATIO,
                BANANA_ARC_START,
                BANANA_ARC_END
            );
            ctx.stroke();
        }

        drawStrawberry(ctx, x, y, size) {
            ctx.beginPath();
            ctx.moveTo(x + size / 2, y + size * STRAWBERRY_TOP_RATIO);
            ctx.bezierCurveTo(
                x + size * STRAWBERRY_SIDE_RATIO,
                y + size * APPLE_STEM_TOP_RATIO,
                x + size * STRAWBERRY_RIGHT_RATIO,
                y + size * STRAWBERRY_BOTTOM_RATIO,
                x + size * STRAWBERRY_CENTER_RATIO,
                y + size
            );
            ctx.bezierCurveTo(
                x + size * STRAWBERRY_EDGE_RATIO,
                y + size * STRAWBERRY_BOTTOM_RATIO,
                x + size * STRAWBERRY_EDGE_RATIO,
                y + size * APPLE_STEM_TOP_RATIO,
                x + size * STRAWBERRY_CENTER_RATIO,
                y + size * STRAWBERRY_TOP_RATIO
            );
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        drawGrape(ctx, x, y, size) {
            const radius = size * GRAPE_RADIUS_RATIO;
            for (const pos of GRAPE_CLUSTER_POSITIONS) {
                ctx.beginPath();
                ctx.arc(x + size * pos.x, y + size * pos.y, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }

        drawOverlay(ctx, width, height) {
            ctx.save();
            ctx.fillStyle = COLORS.overlay;
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = COLORS.overlayText;
            ctx.textAlign = "center";

            if (this.state === GAME_STATES.Start) {
                ctx.font = `bold ${OVERLAY_TITLE_SIZE}px ${OVERLAY_FONT}`;
                ctx.fillText("Wąż i owoce!", width / 2, height / 2 - OVERLAY_TITLE_OFFSET);
                ctx.font = `${OVERLAY_TEXT_SIZE}px ${OVERLAY_FONT}`;
                ctx.fillText("Strzałki / WASD – ruszaj do zabawy", width / 2, height / 2 + OVERLAY_TEXT_OFFSET);
                ctx.fillText("Kliknij START albo rusz klawiszem", width / 2, height / 2 + OVERLAY_TEXT_GAP);
            } else if (this.state === GAME_STATES.Paused) {
                ctx.font = `bold ${OVERLAY_TITLE_SIZE}px ${OVERLAY_FONT}`;
                ctx.fillText("Pauza", width / 2, height / 2 - OVERLAY_PAUSE_OFFSET);
                ctx.font = `${OVERLAY_TEXT_SIZE}px ${OVERLAY_FONT}`;
                ctx.fillText("Kliknij START aby wrócić", width / 2, height / 2 + OVERLAY_PAUSE_TEXT_OFFSET);
            } else if (this.state === GAME_STATES.GameOver) {
                ctx.font = `bold ${OVERLAY_TITLE_SIZE}px ${OVERLAY_FONT}`;
                ctx.fillText("Koniec gry", width / 2, height / 2 - OVERLAY_GAMEOVER_OFFSET);
                ctx.font = `${OVERLAY_TEXT_SIZE}px ${OVERLAY_FONT}`;
                ctx.fillText("Spróbuj jeszcze raz!", width / 2, height / 2 + OVERLAY_GAMEOVER_TEXT_OFFSET);
            }

            ctx.restore();
        }

        createInitialSnake() {
            const startX = Math.floor(this.grid.columns / 2);
            const startY = Math.floor(this.grid.rows / 2);

            const segments = [];
            for (let i = 0; i < INITIAL_SNAKE_LENGTH; i += 1) {
                segments.push({ x: startX - i, y: startY });
            }
            return segments;
        }

        spawnFood() {
            const freeCells = [];
            for (let x = 0; x < this.grid.columns; x += 1) {
                for (let y = 0; y < this.grid.rows; y += 1) {
                    if (!this.snake.some((segment) => segment.x === x && segment.y === y)) {
                        freeCells.push({ x, y });
                    }
                }
            }

            const index = Math.floor(Math.random() * freeCells.length);
            this.food = freeCells[index] ?? { x: 0, y: 0 };
            this.foodStyle = FOOD_STYLES[Math.floor(Math.random() * FOOD_STYLES.length)];
        }

        applyGridSettings() {
            const { columns, rows } = this.options.kidMode ? GRID_CONFIG.kid : GRID_CONFIG.default;
            this.grid.columns = columns;
            this.grid.rows = rows;

            this.resizeCanvas();
            this.constrainSnake();
        }

        resizeCanvas() {
            const parent = this.canvas.parentElement ?? this.canvas;
            const rect = parent.getBoundingClientRect();
            const devicePixelRatio = window.devicePixelRatio || 1;

            const width = Math.max(rect.width, MIN_CANVAS_SIZE);
            const height = Math.max(rect.height, MIN_CANVAS_SIZE);

            const cellSize = Math.floor(Math.min(width / this.grid.columns, height / this.grid.rows));
            const canvasWidth = cellSize * this.grid.columns;
            const canvasHeight = cellSize * this.grid.rows;

            this.grid.cellSize = cellSize;
            this.grid.offsetX = Math.floor((width - canvasWidth) / 2);
            this.grid.offsetY = Math.floor((height - canvasHeight) / 2);

            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;
            this.canvas.width = Math.floor(width * devicePixelRatio);
            this.canvas.height = Math.floor(height * devicePixelRatio);

            this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
            this.backgroundDots = this.createBackgroundDots(width, height);
        }

        constrainSnake() {
            this.snake = this.snake.map((segment) => ({
                x: Math.min(this.grid.columns - 1, Math.max(0, segment.x)),
                y: Math.min(this.grid.rows - 1, Math.max(0, segment.y))
            }));
            this.previousSnake = this.cloneSnake(this.snake);
        }

        gameOver() {
            this.state = GAME_STATES.GameOver;
            this.emitStateChange();
            this.emitGameOver();
        }

        emitScoreChange() {
            this.lastTickTime = performance.now();
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.saveHighScore(this.highScore);
            }

            const speedLabel = DIFFICULTY_SETTINGS[this.options.difficulty].label;
            this.dotNetRef?.invokeMethodAsync("OnScoreChanged", this.score, this.highScore, speedLabel);
        }

        emitGameOver() {
            this.dotNetRef?.invokeMethodAsync("OnGameOver", this.score);
        }

        emitStateChange() {
            this.dotNetRef?.invokeMethodAsync("OnStateChanged", this.state);
        }

        playEatSound() {
            if (!this.options.soundEnabled) {
                return;
            }

            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const ctx = this.audioContext;
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();

            oscillator.type = "sine";
            oscillator.frequency.value = EAT_SOUND_FREQUENCY;

            gain.gain.value = EAT_SOUND_VOLUME;
            gain.gain.exponentialRampToValueAtTime(EAT_SOUND_FLOOR, ctx.currentTime + EAT_SOUND_DURATION);

            oscillator.connect(gain);
            gain.connect(ctx.destination);

            oscillator.start();
            oscillator.stop(ctx.currentTime + EAT_SOUND_DURATION);
        }

        createBackgroundDots(width, height) {
            const dots = [];
            for (let i = 0; i < BACKGROUND_DOT_COUNT; i += 1) {
                dots.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: Math.random() * DOT_SIZE_RANGE + DOT_SIZE_MIN
                });
            }
            return dots;
        }

        gridToPixel(gridX, gridY) {
            return {
                x: this.grid.offsetX + gridX * this.grid.cellSize,
                y: this.grid.offsetY + gridY * this.grid.cellSize
            };
        }

        lerp(start, end, amount) {
            return start + (end - start) * amount;
        }

        easeOutBack(x) {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
        }

        roundRect(ctx, x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        }

        cloneSnake(snake) {
            return snake.map((segment) => ({ x: segment.x, y: segment.y }));
        }

        getHighScore() {
            const stored = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
            return stored ? Number.parseInt(stored, 10) : 0;
        }

        saveHighScore(score) {
            localStorage.setItem(HIGH_SCORE_STORAGE_KEY, score.toString());
        }

        getMoveInterval() {
            const baseSpeed = DIFFICULTY_SETTINGS[this.options.difficulty].speed;
            const speedMultiplier = this.options.kidMode ? KID_SPEED_MULTIPLIER : 1;
            return 1000 / (baseSpeed * speedMultiplier);
        }
    }

    window.snakeGame = {
        init: (canvasId, options, dotNetRef) => {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error("Snake canvas not found.");
            }

            return new SnakeGameController(canvas, options, dotNetRef);
        }
    };
})();
