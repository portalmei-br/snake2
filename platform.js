// JavaScript principal da plataforma Snake Battle
class SnakePlatform {
    constructor() {
        this.currentUser = null;
        this.matchManager = null;
        this.isInGame = false;
        
        this.init();
    }
    
    // Inicializar plataforma
    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.updateUI();
        this.startWinnersAnimation();
        this.setupTableFilters();
        this.setupRankingTabs();
        this.setupModals();
    }
    
    // Configurar event listeners
    setupEventListeners() {
        // Navegação
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection(link.getAttribute('href'));
            });
        });
        
        // Botões de login/registro
        document.getElementById('login-btn').addEventListener('click', () => {
            this.showModal('login-modal');
        });
        
        document.getElementById('register-btn').addEventListener('click', () => {
            this.showModal('register-modal');
        });
        
        // Partida rápida
        document.getElementById('quick-match-btn').addEventListener('click', () => {
            this.startQuickMatch();
        });
        
        // Botões das mesas
        document.querySelectorAll('.btn-join-table').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tableCard = e.target.closest('.table-card');
                const tableValue = tableCard.getAttribute('data-value');
                this.joinTable(parseFloat(tableValue));
            });
        });
        
        // Botões de assistir
        document.querySelectorAll('.btn-watch-game').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showNotification('Funcionalidade de assistir partidas em desenvolvimento!', 'info');
            });
        });
        
        // Sair do jogo
        document.getElementById('leave-game').addEventListener('click', () => {
            this.leaveGame();
        });
        
        // Menu mobile
        document.getElementById('mobile-menu').addEventListener('click', () => {
            this.toggleMobileMenu();
        });
        
        // Scroll suave
        document.addEventListener('scroll', () => {
            this.handleScroll();
        });
    }
    
    // Configurar filtros das mesas
    setupTableFilters() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remover classe active de todos os botões
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                
                // Adicionar classe active ao botão clicado
                e.target.classList.add('active');
                
                // Filtrar mesas
                const filter = e.target.getAttribute('data-filter');
                this.filterTables(filter);
            });
        });
    }
    
    // Filtrar mesas
    filterTables(filter) {
        const tables = document.querySelectorAll('.table-card');
        
        tables.forEach(table => {
            const status = table.getAttribute('data-status');
            
            if (filter === 'all' || status === filter) {
                table.style.display = 'block';
            } else {
                table.style.display = 'none';
            }
        });
    }
    
    // Configurar abas do ranking
    setupRankingTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remover classe active de todas as abas
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                
                // Adicionar classe active à aba clicada
                e.target.classList.add('active');
                
                // Mostrar conteúdo correspondente
                const tab = e.target.getAttribute('data-tab');
                this.showRankingTab(tab);
            });
        });
    }
    
    // Mostrar aba do ranking
    showRankingTab(tab) {
        // Por enquanto, apenas uma aba está implementada
        // Em uma implementação completa, haveria diferentes rankings
        this.showNotification(`Ranking de ${tab} selecionado!`, 'info');
    }
    
    // Configurar modais
    setupModals() {
        // Fechar modais
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal.id);
            });
        });
        
        // Fechar modal clicando fora
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
        
        // Alternar entre login e registro
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('login-modal');
            this.showModal('register-modal');
        });
        
        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('register-modal');
            this.showModal('login-modal');
        });
        
        // Formulários
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    }
    
    // Carregar dados do usuário
    loadUserData() {
        if (window.userSystem && window.userSystem.isLoggedIn()) {
            this.currentUser = window.userSystem.getCurrentUser();
        }
    }
    
    // Salvar dados do usuário
    saveUserData() {
        // Os dados são salvos automaticamente pelo userSystem
    }
    
    // Atualizar interface
    updateUI() {
        if (this.currentUser) {
            // Usuário logado
            document.getElementById('user-balance').textContent = `R$ ${this.currentUser.balance.toFixed(2)}`;
            document.getElementById('login-btn').style.display = 'none';
            document.getElementById('register-btn').style.display = 'none';
            
            // Mostrar informações do usuário
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `
                <span class="username">${this.currentUser.username}</span>
                <button class="btn-logout" onclick="platform.logout()">Sair</button>
            `;
            
            const headerActions = document.querySelector('.header-actions');
            if (!headerActions.querySelector('.user-info')) {
                headerActions.appendChild(userInfo);
            }
        } else {
            // Usuário não logado
            document.getElementById('user-balance').textContent = 'R$ 0,00';
            document.getElementById('login-btn').style.display = 'block';
            document.getElementById('register-btn').style.display = 'block';
            
            // Remover informações do usuário
            const userInfo = document.querySelector('.user-info');
            if (userInfo) {
                userInfo.remove();
            }
        }
    }
    
    // Navegação
    navigateToSection(sectionId) {
        const section = document.querySelector(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
            
            // Atualizar navegação ativa
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            document.querySelector(`[href="${sectionId}"]`).classList.add('active');
        }
    }
    
    // Animação dos vencedores
    startWinnersAnimation() {
        const winnersScroll = document.querySelector('.winners-scroll');
        if (winnersScroll) {
            // Duplicar itens para animação contínua
            const items = winnersScroll.innerHTML;
            winnersScroll.innerHTML = items + items;
        }
    }
    
    // Mostrar modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Esconder modal
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
    
    // Login
    handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        if (!username || !password) {
            this.showNotification('Preencha todos os campos!', 'error');
            return;
        }
        
        const result = window.userSystem.login(username, password);
        
        if (result.error) {
            this.showNotification(result.error, 'error');
            return;
        }
        
        this.currentUser = result.user;
        this.updateUI();
        this.hideModal('login-modal');
        this.showNotification(`Bem-vindo, ${this.currentUser.username}!`, 'success');
    }
    
    // Registro
    handleRegister() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        if (!username || !email || !password) {
            this.showNotification('Preencha todos os campos!', 'error');
            return;
        }
        
        const result = window.userSystem.createUser(username, email, password);
        
        if (result.error) {
            this.showNotification(result.error, 'error');
            return;
        }
        
        // Fazer login automaticamente
        const loginResult = window.userSystem.login(username, password);
        if (loginResult.success) {
            this.currentUser = loginResult.user;
            this.updateUI();
            this.hideModal('register-modal');
            this.showNotification(`Conta criada com sucesso! Bem-vindo, ${username}!`, 'success');
        }
    }
    
    // Logout
    logout() {
        window.userSystem.logout();
        this.currentUser = null;
        this.updateUI();
        this.showNotification('Logout realizado com sucesso!', 'info');
        
        if (this.isInGame) {
            this.leaveGame();
        }
    }
    
    // Partida rápida
    startQuickMatch() {
        if (!this.currentUser) {
            this.showModal('login-modal');
            this.showNotification('Faça login para jogar!', 'warning');
            return;
        }
        
        // Selecionar mesa aleatória
        const tableValues = [5, 10, 15, 20];
        const randomValue = tableValues[Math.floor(Math.random() * tableValues.length)];
        this.joinTable(randomValue);
    }
    
    // Entrar em mesa
    joinTable(tableValue) {
        if (!this.currentUser) {
            this.showModal('login-modal');
            this.showNotification('Faça login para jogar!', 'warning');
            return;
        }
        
        if (this.currentUser.balance < tableValue) {
            this.showNotification('Saldo insuficiente!', 'error');
            return;
        }
        
        // Debitar valor da mesa
        this.currentUser.balance -= tableValue;
        this.saveUserData();
        this.updateUI();
        
        // Iniciar jogo
        this.startGame(tableValue);
    }
    
    // Iniciar jogo
    startGame(tableValue) {
        this.isInGame = true;
        
        // Mostrar área de jogo
        document.getElementById('game-area').classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Atualizar informações da mesa
        document.getElementById('game-table-value').textContent = tableValue.toFixed(2);
        
        // Resetar UI do jogo
        this.resetGameUI();
        
        // Inicializar gerenciador de partidas
        this.matchManager = new MatchManager();
        
        // Configurar callbacks
        this.matchManager.setCallbacks({
            onMatchStart: (match) => {
                this.hideGameOverlay();
                this.showNotification('Partida iniciada! Boa sorte!', 'success');
            },
            onRoundEnd: (result) => {
                this.handleRoundEnd(result);
            },
            onMatchEnd: (result) => {
                this.handleMatchEnd(result, tableValue);
            },
            onStateChange: (state) => {
                this.updateGameState(state);
            }
        });
        
        // Iniciar partida
        this.matchManager.startMatch(tableValue);
        
        // Mostrar overlay de aguardando
        this.showGameOverlay('Procurando Oponente...', 'Aguarde enquanto encontramos outro jogador');
    }
    
    // Resetar UI do jogo
    resetGameUI() {
        // Resetar placares
        document.getElementById('current-round').textContent = '1';
        document.getElementById('player-match-score').textContent = '0';
        document.getElementById('opponent-match-score').textContent = '0';
        document.getElementById('player-score').textContent = '0';
        document.getElementById('opponent-score').textContent = '0';
        document.getElementById('player-timer').textContent = '00:00';
        document.getElementById('opponent-timer').textContent = '00:00';
        
        // Resetar resultados das rodadas
        for (let i = 1; i <= 3; i++) {
            const resultEl = document.getElementById(`round-${i}-result`).querySelector('.result');
            resultEl.textContent = '-';
            resultEl.className = 'result';
        }
    }
    
    // Sair do jogo
    leaveGame() {
        if (this.matchManager) {
            this.matchManager.leaveMatch();
        }
        
        this.isInGame = false;
        document.getElementById('game-area').classList.remove('active');
        document.body.style.overflow = 'auto';
        
        this.showNotification('Você saiu da partida', 'info');
    }
    
    // Mostrar overlay do jogo
    showGameOverlay(title, message) {
        const playerOverlay = document.getElementById('player-overlay');
        const opponentOverlay = document.getElementById('opponent-overlay');
        
        // Atualizar overlay do jogador
        playerOverlay.querySelector('h3').textContent = title;
        playerOverlay.querySelector('p').textContent = message;
        playerOverlay.classList.remove('hidden');
        
        // Atualizar overlay do oponente
        opponentOverlay.querySelector('h3').textContent = 'Oponente';
        opponentOverlay.querySelector('p').textContent = 'Preparando jogo...';
        opponentOverlay.classList.remove('hidden');
    }
    
    // Esconder overlay do jogo
    hideGameOverlay() {
        document.getElementById('player-overlay').classList.add('hidden');
        document.getElementById('opponent-overlay').classList.add('hidden');
    }
    
    // Atualizar estado do jogo
    updateGameState(state) {
        const playerCanvas = document.getElementById('player-canvas');
        const opponentCanvas = document.getElementById('opponent-canvas');
        
        // Remover classes de estado anteriores
        [playerCanvas, opponentCanvas].forEach(canvas => {
            canvas.classList.remove('game-state-waiting', 'game-state-playing', 'game-state-finished');
        });
        
        switch(state) {
            case 'waiting':
                playerCanvas.classList.add('game-state-waiting');
                opponentCanvas.classList.add('game-state-waiting');
                break;
            case 'playing':
            case 'round_playing':
                playerCanvas.classList.add('game-state-playing');
                opponentCanvas.classList.add('game-state-playing');
                break;
            case 'finished':
                playerCanvas.classList.add('game-state-finished');
                opponentCanvas.classList.add('game-state-finished');
                break;
        }
    }
    
    // Lidar com fim de rodada
    handleRoundEnd(result) {
        const resultText = result.result === 'win' ? 'Vitória!' : 
                          result.result === 'lose' ? 'Derrota!' : 'Empate!';
        
        this.showNotification(`Rodada ${result.round}: ${resultText}`, 
                             result.result === 'win' ? 'success' : 
                             result.result === 'lose' ? 'error' : 'warning');
    }
    
    // Lidar com fim de partida
    handleMatchEnd(result, tableValue) {
        const isWinner = result.winner === 'player';
        const prize = isWinner ? tableValue * 2 : 0;
        
        if (isWinner) {
            // Adicionar vitória e prêmio
            window.userSystem.addVictory(this.currentUser.id, prize, {
                tableValue: tableValue,
                survivalTime: result.rounds[result.rounds.length - 1].playerTime,
                opponent: 'Bot'
            });
            
            // Atualizar ranking
            window.rankingSystem.addPlayerVictory(this.currentUser.username, prize);
            
            this.showNotification(`Parabéns! Você ganhou R$ ${prize.toFixed(2)}!`, 'success');
        } else {
            // Adicionar derrota
            window.userSystem.addLoss(this.currentUser.id, tableValue, {
                tableValue: tableValue,
                survivalTime: result.rounds[result.rounds.length - 1].playerTime,
                opponent: 'Bot'
            });
            
            this.showNotification('Que pena! Tente novamente!', 'error');
        }
        
        // Atualizar dados do usuário
        this.currentUser = window.userSystem.getCurrentUser();
        this.updateUI();
        
        // Sair do jogo após 3 segundos
        setTimeout(() => {
            this.leaveGame();
        }, 3000);
    }
    
    // Menu mobile
    toggleMobileMenu() {
        // Implementação do menu mobile
        this.showNotification('Menu mobile em desenvolvimento!', 'info');
    }
    
    // Scroll
    handleScroll() {
        // Implementação de efeitos de scroll
    }
    
    // Mostrar notificação
    showNotification(message, type = 'info') {
        // Remover notificação anterior se existir
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Criar nova notificação
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Mostrar notificação
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Esconder notificação após 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

