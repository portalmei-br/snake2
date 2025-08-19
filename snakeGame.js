// Engine do Jogo Snake com Suporte a Duas Áreas Simultâneas
class SnakeGame {
    constructor(canvasId, isOpponent = false) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isOpponent = isOpponent;
        
        // Configurações do jogo
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // Estado do jogo
        this.snake = [
            { x: 10, y: 10 }
        ];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameStartTime = null;
        this.survivalTime = 0;
        
        // Callbacks
        this.onGameOver = null;
        this.onScoreChange = null;
        this.onTimeUpdate = null;
        
        // Cores
        this.colors = {
            snake: this.isOpponent ? '#ff4757' : '#00ff88',
            food: '#ffa502',
            background: '#1a1a1a',
            grid: '#2d2d2d'
        };
        
        // Bot AI (para oponente)
        this.botDirection = null;
        this.botMoveTimer = null;
        this.botDifficulty = 0.7; // 0.0 = fácil, 1.0 = difícil
        
        this.generateFood();
        if (!this.isOpponent) {
            this.setupControls();
        }
        this.gameLoop = this.gameLoop.bind(this);
    }
    
    // Configurar controles (apenas para jogador)
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gamePaused || this.isOpponent) return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.dy !== 1) {
                        this.dx = 0;
                        this.dy = -1;
                    }
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.dy !== -1) {
                        this.dx = 0;
                        this.dy = 1;
                    }
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.dx !== 1) {
                        this.dx = -1;
                        this.dy = 0;
                    }
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.dx !== -1) {
                        this.dx = 1;
                        this.dy = 0;
                    }
                    break;
                case ' ':
                    if (!this.isOpponent) {
                        this.togglePause();
                    }
                    break;
            }
            e.preventDefault();
        });
    }
    
    // Gerar comida
    generateFood() {
        this.food = {
            x: Math.floor(Math.random() * this.tileCount),
            y: Math.floor(Math.random() * this.tileCount)
        };
        
        // Verificar se a comida não está na cobra
        for (let segment of this.snake) {
            if (segment.x === this.food.x && segment.y === this.food.y) {
                this.generateFood();
                return;
            }
        }
    }
    
    // Iniciar jogo
    startGame() {
        this.snake = [{ x: 10, y: 10 }];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = true;
        this.gamePaused = false;
        this.gameStartTime = Date.now();
        this.survivalTime = 0;
        
        this.generateFood();
        this.draw();
        
        // Para o bot, iniciar movimento automático
        if (this.isOpponent) {
            this.startBotAI();
        }
        
        this.gameLoop();
        
        if (this.onScoreChange) {
            this.onScoreChange(this.score);
        }
    }
    
    // Iniciar IA do bot
    startBotAI() {
        // Dar uma direção inicial aleatória
        const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        this.dx = randomDir.dx;
        this.dy = randomDir.dy;
        
        // Configurar timer para decisões do bot
        this.botMoveTimer = setInterval(() => {
            this.makeBotDecision();
        }, 200 + Math.random() * 300); // Decisões a cada 200-500ms
    }
    
    // Lógica de decisão do bot
    makeBotDecision() {
        if (!this.gameRunning || this.gamePaused) return;
        
        const head = this.snake[0];
        const food = this.food;
        
        // Calcular direções possíveis
        const directions = [
            { dx: 1, dy: 0, name: 'right' },
            { dx: -1, dy: 0, name: 'left' },
            { dx: 0, dy: 1, name: 'down' },
            { dx: 0, dy: -1, name: 'up' }
        ];
        
        // Filtrar direções que não causam colisão imediata
        const safeDirs = directions.filter(dir => {
            // Não pode ir na direção oposta
            if (dir.dx === -this.dx && dir.dy === -this.dy) return false;
            
            const newHead = { x: head.x + dir.dx, y: head.y + dir.dy };
            
            // Verificar colisão com paredes
            if (newHead.x < 0 || newHead.x >= this.tileCount || 
                newHead.y < 0 || newHead.y >= this.tileCount) return false;
            
            // Verificar colisão com o corpo
            for (let segment of this.snake) {
                if (newHead.x === segment.x && newHead.y === segment.y) return false;
            }
            
            return true;
        });
        
        if (safeDirs.length === 0) return; // Sem saída
        
        // Escolher direção baseada na dificuldade
        let chosenDir;
        
        if (Math.random() < this.botDifficulty) {
            // Comportamento inteligente - ir em direção à comida
            const foodDirs = safeDirs.map(dir => {
                const newHead = { x: head.x + dir.dx, y: head.y + dir.dy };
                const distance = Math.abs(newHead.x - food.x) + Math.abs(newHead.y - food.y);
                return { ...dir, distance };
            });
            
            // Escolher a direção que mais se aproxima da comida
            foodDirs.sort((a, b) => a.distance - b.distance);
            chosenDir = foodDirs[0];
        } else {
            // Comportamento aleatório
            chosenDir = safeDirs[Math.floor(Math.random() * safeDirs.length)];
        }
        
        // Aplicar nova direção
        this.dx = chosenDir.dx;
        this.dy = chosenDir.dy;
    }
    
    // Pausar/Despausar jogo
    togglePause() {
        this.gamePaused = !this.gamePaused;
        if (!this.gamePaused) {
            this.gameLoop();
        }
    }
    
    // Parar jogo
    stopGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        
        if (this.botMoveTimer) {
            clearInterval(this.botMoveTimer);
            this.botMoveTimer = null;
        }
    }
    
    // Loop principal do jogo
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        setTimeout(() => {
            this.clearCanvas();
            this.moveSnake();
            this.drawFood();
            this.drawSnake();
            this.updateTime();
            
            if (this.gameRunning) {
                this.gameLoop();
            }
        }, this.isOpponent ? 180 : 150); // Bot um pouco mais lento
    }
    
    // Limpar canvas
    clearCanvas() {
        // Fundo
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grid
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    // Mover cobra
    moveSnake() {
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
        
        // Verificar colisão com paredes
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.endGame();
            return;
        }
        
        // Verificar colisão com o próprio corpo
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.endGame();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        // Verificar se comeu a comida
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.generateFood();
            this.createParticleEffect(head.x * this.gridSize, head.y * this.gridSize);
            
            if (this.onScoreChange) {
                this.onScoreChange(this.score);
            }
        } else {
            this.snake.pop();
        }
    }
    
    // Desenhar cobra
    drawSnake() {
        this.ctx.fillStyle = this.colors.snake;
        
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            
            // Cabeça da cobra com efeito especial
            if (i === 0) {
                this.ctx.fillStyle = this.colors.snake;
                this.ctx.shadowColor = this.colors.snake;
                this.ctx.shadowBlur = 10;
                this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
                this.ctx.shadowBlur = 0;
                
                // Olhos da cobra
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(x + 6, y + 6, 3, 3);
                this.ctx.fillRect(x + 11, y + 6, 3, 3);
            } else {
                // Corpo da cobra
                const alpha = 1 - (i * 0.1);
                this.ctx.fillStyle = this.colors.snake + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                this.ctx.fillRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2);
            }
        }
    }
    
    // Desenhar comida
    drawFood() {
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;
        
        // Efeito pulsante na comida
        const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;
        const size = this.gridSize * pulse;
        const offset = (this.gridSize - size) / 2;
        
        this.ctx.fillStyle = this.colors.food;
        this.ctx.shadowColor = this.colors.food;
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(x + offset, y + offset, size, size);
        this.ctx.shadowBlur = 0;
    }
    
    // Atualizar tempo de sobrevivência
    updateTime() {
        if (this.gameStartTime) {
            this.survivalTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
            
            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.survivalTime);
            }
        }
    }
    
    // Finalizar jogo
    endGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        
        if (this.botMoveTimer) {
            clearInterval(this.botMoveTimer);
            this.botMoveTimer = null;
        }
        
        // Efeito visual de game over
        this.ctx.fillStyle = this.isOpponent ? 'rgba(255, 71, 87, 0.3)' : 'rgba(255, 71, 87, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.onGameOver) {
            this.onGameOver({
                score: this.score,
                survivalTime: this.survivalTime,
                snakeLength: this.snake.length
            });
        }
    }
    
    // Criar efeito de partículas
    createParticleEffect(x, y) {
        const particleCount = 8;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = (x + this.canvas.offsetLeft) + 'px';
            particle.style.top = (y + this.canvas.offsetTop) + 'px';
            
            const angle = (i / particleCount) * Math.PI * 2;
            const velocity = 20;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            particle.style.setProperty('--vx', vx + 'px');
            particle.style.setProperty('--vy', vy + 'px');
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    }
    
    // Desenhar estado inicial
    draw() {
        this.clearCanvas();
        this.drawFood();
        this.drawSnake();
    }
    
    // Obter estatísticas do jogo
    getStats() {
        return {
            score: this.score,
            survivalTime: this.survivalTime,
            snakeLength: this.snake.length,
            isRunning: this.gameRunning,
            isPaused: this.gamePaused
        };
    }
    
    // Definir callbacks
    setCallbacks(callbacks) {
        this.onGameOver = callbacks.onGameOver || null;
        this.onScoreChange = callbacks.onScoreChange || null;
        this.onTimeUpdate = callbacks.onTimeUpdate || null;
    }
    
    // Definir dificuldade do bot
    setBotDifficulty(difficulty) {
        this.botDifficulty = Math.max(0, Math.min(1, difficulty));
    }
}

// Gerenciador de Partidas com Duas Áreas
class MatchManager {
    constructor() {
        this.currentMatch = null;
        this.playerGame = null;
        this.opponentGame = null;
        this.matchState = 'waiting'; // waiting, playing, finished
        this.currentRound = 1;
        this.maxRounds = 3;
        this.playerScore = 0;
        this.opponentScore = 0;
        this.roundResults = [];
        
        // Callbacks
        this.onMatchStart = null;
        this.onRoundEnd = null;
        this.onMatchEnd = null;
        this.onStateChange = null;
    }
    
    // Iniciar nova partida
    startMatch(tableValue, opponentName = 'Oponente') {
        this.currentMatch = {
            tableValue: tableValue,
            opponentName: opponentName,
            startTime: Date.now()
        };
        
        this.matchState = 'waiting';
        this.currentRound = 1;
        this.playerScore = 0;
        this.opponentScore = 0;
        this.roundResults = [];
        
        // Inicializar jogos
        this.playerGame = new SnakeGame('player-canvas', false);
        this.opponentGame = new SnakeGame('opponent-canvas', true);
        
        // Configurar callbacks
        this.setupGameCallbacks();
        
        // Simular encontrar oponente
        setTimeout(() => {
            this.matchState = 'playing';
            this.startRound();
            
            if (this.onMatchStart) {
                this.onMatchStart(this.currentMatch);
            }
            
            if (this.onStateChange) {
                this.onStateChange(this.matchState);
            }
        }, 2000);
    }
    
    // Configurar callbacks dos jogos
    setupGameCallbacks() {
        // Callbacks do jogador
        this.playerGame.setCallbacks({
            onGameOver: (stats) => {
                this.handlePlayerGameOver(stats);
            },
            onScoreChange: (score) => {
                this.updatePlayerScore(score);
            },
            onTimeUpdate: (time) => {
                this.updatePlayerTimer(time);
            }
        });
        
        // Callbacks do oponente
        this.opponentGame.setCallbacks({
            onGameOver: (stats) => {
                this.handleOpponentGameOver(stats);
            },
            onScoreChange: (score) => {
                this.updateOpponentScore(score);
            },
            onTimeUpdate: (time) => {
                this.updateOpponentTimer(time);
            }
        });
    }
    
    // Iniciar rodada
    startRound() {
        if (!this.playerGame || !this.opponentGame) return;
        
        // Atualizar UI
        document.getElementById('current-round').textContent = this.currentRound;
        
        // Esconder overlays
        document.getElementById('player-overlay').classList.add('hidden');
        document.getElementById('opponent-overlay').classList.add('hidden');
        
        // Iniciar ambos os jogos simultaneamente
        this.playerGame.startGame();
        this.opponentGame.startGame();
        
        if (this.onStateChange) {
            this.onStateChange('round_playing');
        }
    }
    
    // Lidar com game over do jogador
    handlePlayerGameOver(playerStats) {
        this.playerStats = playerStats;
        this.checkRoundEnd();
    }
    
    // Lidar com game over do oponente
    handleOpponentGameOver(opponentStats) {
        this.opponentStats = opponentStats;
        this.checkRoundEnd();
    }
    
    // Verificar se a rodada acabou
    checkRoundEnd() {
        if (this.playerStats && this.opponentStats) {
            this.endRound();
        }
    }
    
    // Finalizar rodada
    endRound() {
        const playerTime = this.playerStats.survivalTime;
        const opponentTime = this.opponentStats.survivalTime;
        
        let result;
        if (playerTime > opponentTime) {
            result = 'win';
            this.playerScore++;
        } else if (playerTime < opponentTime) {
            result = 'lose';
            this.opponentScore++;
        } else {
            result = 'draw';
        }
        
        this.roundResults.push({
            round: this.currentRound,
            result: result,
            playerTime: playerTime,
            opponentTime: opponentTime,
            playerScore: this.playerStats.score,
            opponentScore: this.opponentStats.score
        });
        
        // Atualizar UI
        this.updateRoundResult(this.currentRound, result);
        this.updateMatchScore();
        
        if (this.onRoundEnd) {
            this.onRoundEnd({
                round: this.currentRound,
                result: result,
                playerStats: this.playerStats,
                opponentStats: this.opponentStats
            });
        }
        
        // Verificar se a partida acabou
        if (this.currentRound >= this.maxRounds || this.playerScore >= 2 || this.opponentScore >= 2) {
            this.endMatch();
        } else {
            this.currentRound++;
            this.playerStats = null;
            this.opponentStats = null;
            
            setTimeout(() => {
                this.startRound();
            }, 3000); // Pausa entre rodadas
        }
    }
    
    // Atualizar resultado da rodada na UI
    updateRoundResult(round, result) {
        const resultEl = document.getElementById(`round-${round}-result`).querySelector('.result');
        
        switch(result) {
            case 'win':
                resultEl.textContent = 'Vitória';
                resultEl.className = 'result win';
                break;
            case 'lose':
                resultEl.textContent = 'Derrota';
                resultEl.className = 'result lose';
                break;
            case 'draw':
                resultEl.textContent = 'Empate';
                resultEl.className = 'result draw';
                break;
        }
    }
    
    // Atualizar placar da partida
    updateMatchScore() {
        document.getElementById('player-match-score').textContent = this.playerScore;
        document.getElementById('opponent-match-score').textContent = this.opponentScore;
    }
    
    // Atualizar score do jogador
    updatePlayerScore(score) {
        document.getElementById('player-score').textContent = score;
    }
    
    // Atualizar score do oponente
    updateOpponentScore(score) {
        document.getElementById('opponent-score').textContent = score;
    }
    
    // Atualizar timer do jogador
    updatePlayerTimer(time) {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        document.getElementById('player-timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Atualizar timer do oponente
    updateOpponentTimer(time) {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        document.getElementById('opponent-timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Finalizar partida
    endMatch() {
        this.matchState = 'finished';
        
        const matchResult = {
            winner: this.playerScore > this.opponentScore ? 'player' : 'opponent',
            playerScore: this.playerScore,
            opponentScore: this.opponentScore,
            rounds: this.roundResults,
            tableValue: this.currentMatch.tableValue,
            duration: Date.now() - this.currentMatch.startTime
        };
        
        if (this.onMatchEnd) {
            this.onMatchEnd(matchResult);
        }
        
        if (this.onStateChange) {
            this.onStateChange(this.matchState);
        }
    }
    
    // Abandonar partida
    leaveMatch() {
        if (this.playerGame) {
            this.playerGame.stopGame();
        }
        
        if (this.opponentGame) {
            this.opponentGame.stopGame();
        }
        
        this.matchState = 'abandoned';
        this.currentMatch = null;
        
        if (this.onStateChange) {
            this.onStateChange(this.matchState);
        }
    }
    
    // Definir callbacks
    setCallbacks(callbacks) {
        this.onMatchStart = callbacks.onMatchStart || null;
        this.onRoundEnd = callbacks.onRoundEnd || null;
        this.onMatchEnd = callbacks.onMatchEnd || null;
        this.onStateChange = callbacks.onStateChange || null;
    }
}

