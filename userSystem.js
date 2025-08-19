// Sistema de Usuários para Snake Battle
class UserSystem {
    constructor() {
        this.currentUser = null;
        this.users = new Map();
        this.sessions = new Map();
        
        // Configurações
        this.initialBalance = 100.00;
        this.bonusAmount = 50.00;
        this.dailyBonusAmount = 25.00;
        
        this.init();
    }
    
    init() {
        this.loadUsersFromStorage();
        this.loadCurrentSession();
        this.generateMockUsers();
    }
    
    // Carregar usuários do localStorage
    loadUsersFromStorage() {
        const usersData = localStorage.getItem('snakeBattleUsers');
        if (usersData) {
            const usersArray = JSON.parse(usersData);
            usersArray.forEach(user => {
                this.users.set(user.id, user);
            });
        }
    }
    
    // Salvar usuários no localStorage
    saveUsersToStorage() {
        const usersArray = Array.from(this.users.values());
        localStorage.setItem('snakeBattleUsers', JSON.stringify(usersArray));
    }
    
    // Carregar sessão atual
    loadCurrentSession() {
        const sessionData = localStorage.getItem('snakeBattleSession');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            const user = this.users.get(session.userId);
            if (user) {
                this.currentUser = user;
                this.sessions.set(session.sessionId, session);
            }
        }
    }
    
    // Salvar sessão atual
    saveCurrentSession() {
        if (this.currentUser) {
            const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const session = {
                sessionId: sessionId,
                userId: this.currentUser.id,
                loginTime: Date.now(),
                lastActivity: Date.now()
            };
            
            this.sessions.set(sessionId, session);
            localStorage.setItem('snakeBattleSession', JSON.stringify(session));
        }
    }
    
    // Gerar usuários simulados
    generateMockUsers() {
        if (this.users.size > 0) return; // Já existem usuários
        
        const mockUsers = [
            { username: 'SnakeMaster', email: 'snake@example.com', wins: 127, losses: 23 },
            { username: 'CobraKing', email: 'cobra@example.com', wins: 98, losses: 31 },
            { username: 'ViperaQueen', email: 'vipera@example.com', wins: 87, losses: 28 },
            { username: 'FastSnake', email: 'fast@example.com', wins: 76, losses: 34 },
            { username: 'GreenMamba', email: 'green@example.com', wins: 65, losses: 29 }
        ];
        
        mockUsers.forEach((userData, index) => {
            const user = this.createUser(
                userData.username,
                userData.email,
                'password123',
                false // Não salvar automaticamente
            );
            
            if (user && !user.error) {
                user.stats.wins = userData.wins;
                user.stats.losses = userData.losses;
                user.stats.totalEarnings = userData.wins * 15 + Math.random() * 500;
                user.balance = 50 + Math.random() * 200;
                user.profile.joinDate = new Date(Date.now() - (index + 1) * 30 * 24 * 60 * 60 * 1000).toISOString();
            }
        });
        
        this.saveUsersToStorage();
    }
    
    // Criar novo usuário
    createUser(username, email, password, autoSave = true) {
        // Verificar se username já existe
        const existingUser = Array.from(this.users.values()).find(u => u.username === username);
        if (existingUser) {
            return { error: 'Nome de usuário já existe' };
        }
        
        // Verificar se email já existe
        const existingEmail = Array.from(this.users.values()).find(u => u.email === email);
        if (existingEmail) {
            return { error: 'Email já está em uso' };
        }
        
        const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const user = {
            id: userId,
            username: username,
            email: email,
            password: this.hashPassword(password), // Em produção, usar hash real
            balance: this.initialBalance,
            profile: {
                joinDate: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                avatar: this.generateAvatar(username),
                level: 1,
                experience: 0
            },
            stats: {
                wins: 0,
                losses: 0,
                draws: 0,
                totalGames: 0,
                totalEarnings: 0,
                totalLosses: 0,
                bestStreak: 0,
                currentStreak: 0,
                longestSurvival: 0,
                totalPlayTime: 0
            },
            achievements: [],
            settings: {
                soundEnabled: true,
                notificationsEnabled: true,
                theme: 'dark'
            },
            history: []
        };
        
        this.users.set(userId, user);
        
        if (autoSave) {
            this.saveUsersToStorage();
        }
        
        return user;
    }
    
    // Login
    login(usernameOrEmail, password) {
        const user = Array.from(this.users.values()).find(u => 
            u.username === usernameOrEmail || u.email === usernameOrEmail
        );
        
        if (!user) {
            return { error: 'Usuário não encontrado' };
        }
        
        if (user.password !== this.hashPassword(password)) {
            return { error: 'Senha incorreta' };
        }
        
        // Atualizar último login
        user.profile.lastLogin = new Date().toISOString();
        
        // Verificar bônus diário
        this.checkDailyBonus(user);
        
        this.currentUser = user;
        this.saveCurrentSession();
        this.saveUsersToStorage();
        
        return { success: true, user: user };
    }
    
    // Logout
    logout() {
        if (this.currentUser) {
            // Salvar dados do usuário
            this.saveUsersToStorage();
            
            // Limpar sessão
            localStorage.removeItem('snakeBattleSession');
            this.currentUser = null;
        }
        
        return { success: true };
    }
    
    // Verificar bônus diário
    checkDailyBonus(user) {
        const lastLogin = new Date(user.profile.lastLogin);
        const now = new Date();
        const daysDiff = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
        
        if (daysDiff >= 1) {
            user.balance += this.dailyBonusAmount;
            
            // Adicionar ao histórico
            this.addToHistory(user, {
                type: 'bonus',
                amount: this.dailyBonusAmount,
                description: 'Bônus diário',
                timestamp: now.toISOString()
            });
            
            return this.dailyBonusAmount;
        }
        
        return 0;
    }
    
    // Atualizar saldo
    updateBalance(userId, amount, description = '') {
        const user = this.users.get(userId);
        if (!user) return false;
        
        const oldBalance = user.balance;
        user.balance += amount;
        
        // Não permitir saldo negativo
        if (user.balance < 0) {
            user.balance = 0;
        }
        
        // Adicionar ao histórico
        this.addToHistory(user, {
            type: amount > 0 ? 'credit' : 'debit',
            amount: Math.abs(amount),
            oldBalance: oldBalance,
            newBalance: user.balance,
            description: description,
            timestamp: new Date().toISOString()
        });
        
        this.saveUsersToStorage();
        return true;
    }
    
    // Adicionar vitória
    addVictory(userId, earnings, gameStats) {
        const user = this.users.get(userId);
        if (!user) return false;
        
        user.stats.wins++;
        user.stats.totalGames++;
        user.stats.totalEarnings += earnings;
        user.stats.currentStreak++;
        
        if (user.stats.currentStreak > user.stats.bestStreak) {
            user.stats.bestStreak = user.stats.currentStreak;
        }
        
        if (gameStats.survivalTime > user.stats.longestSurvival) {
            user.stats.longestSurvival = gameStats.survivalTime;
        }
        
        user.stats.totalPlayTime += gameStats.survivalTime;
        
        // Atualizar saldo
        this.updateBalance(userId, earnings, `Vitória em partida - Mesa R$ ${gameStats.tableValue}`);
        
        // Verificar conquistas
        this.checkAchievements(user);
        
        // Adicionar ao histórico
        this.addToHistory(user, {
            type: 'match_win',
            earnings: earnings,
            tableValue: gameStats.tableValue,
            survivalTime: gameStats.survivalTime,
            opponent: gameStats.opponent,
            timestamp: new Date().toISOString()
        });
        
        this.saveUsersToStorage();
        return true;
    }
    
    // Adicionar derrota
    addLoss(userId, loss, gameStats) {
        const user = this.users.get(userId);
        if (!user) return false;
        
        user.stats.losses++;
        user.stats.totalGames++;
        user.stats.totalLosses += loss;
        user.stats.currentStreak = 0; // Reset streak
        
        if (gameStats.survivalTime > user.stats.longestSurvival) {
            user.stats.longestSurvival = gameStats.survivalTime;
        }
        
        user.stats.totalPlayTime += gameStats.survivalTime;
        
        // Adicionar ao histórico
        this.addToHistory(user, {
            type: 'match_loss',
            loss: loss,
            tableValue: gameStats.tableValue,
            survivalTime: gameStats.survivalTime,
            opponent: gameStats.opponent,
            timestamp: new Date().toISOString()
        });
        
        this.saveUsersToStorage();
        return true;
    }
    
    // Verificar conquistas
    checkAchievements(user) {
        const achievements = [
            {
                id: 'first_win',
                name: 'Primeira Vitória',
                description: 'Ganhe sua primeira partida',
                condition: () => user.stats.wins >= 1
            },
            {
                id: 'win_streak_5',
                name: 'Sequência de 5',
                description: 'Ganhe 5 partidas seguidas',
                condition: () => user.stats.currentStreak >= 5
            },
            {
                id: 'win_streak_10',
                name: 'Sequência de 10',
                description: 'Ganhe 10 partidas seguidas',
                condition: () => user.stats.currentStreak >= 10
            },
            {
                id: 'survivor_60',
                name: 'Sobrevivente',
                description: 'Sobreviva por 60 segundos em uma partida',
                condition: () => user.stats.longestSurvival >= 60
            },
            {
                id: 'rich_player',
                name: 'Jogador Rico',
                description: 'Acumule R$ 500,00 em ganhos',
                condition: () => user.stats.totalEarnings >= 500
            }
        ];
        
        achievements.forEach(achievement => {
            if (!user.achievements.includes(achievement.id) && achievement.condition()) {
                user.achievements.push(achievement.id);
                
                // Dar bônus por conquista
                this.updateBalance(user.id, this.bonusAmount, `Conquista desbloqueada: ${achievement.name}`);
            }
        });
    }
    
    // Adicionar ao histórico
    addToHistory(user, entry) {
        user.history.unshift(entry);
        
        // Manter apenas os últimos 100 registros
        if (user.history.length > 100) {
            user.history = user.history.slice(0, 100);
        }
    }
    
    // Obter estatísticas do usuário
    getUserStats(userId) {
        const user = this.users.get(userId);
        if (!user) return null;
        
        const winRate = user.stats.totalGames > 0 ? 
            (user.stats.wins / user.stats.totalGames * 100).toFixed(1) : 0;
        
        const avgSurvival = user.stats.totalGames > 0 ?
            Math.floor(user.stats.totalPlayTime / user.stats.totalGames) : 0;
        
        return {
            ...user.stats,
            winRate: winRate,
            avgSurvival: avgSurvival,
            netEarnings: user.stats.totalEarnings - user.stats.totalLosses
        };
    }
    
    // Obter ranking do usuário
    getUserRanking(userId) {
        const allUsers = Array.from(this.users.values());
        
        // Ranking por vitórias
        const winRanking = allUsers
            .sort((a, b) => b.stats.wins - a.stats.wins)
            .findIndex(u => u.id === userId) + 1;
        
        // Ranking por ganhos
        const earningsRanking = allUsers
            .sort((a, b) => b.stats.totalEarnings - a.stats.totalEarnings)
            .findIndex(u => u.id === userId) + 1;
        
        return {
            wins: winRanking,
            earnings: earningsRanking,
            totalPlayers: allUsers.length
        };
    }
    
    // Hash simples de senha (em produção usar bcrypt ou similar)
    hashPassword(password) {
        // Implementação muito simples - NÃO usar em produção
        return btoa(password + 'snake_salt');
    }
    
    // Gerar avatar simples
    generateAvatar(username) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
        const color = colors[username.length % colors.length];
        
        return {
            backgroundColor: color,
            initials: username.substring(0, 2).toUpperCase()
        };
    }
    
    // Obter usuário atual
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Verificar se usuário está logado
    isLoggedIn() {
        return this.currentUser !== null;
    }
    
    // Obter histórico do usuário
    getUserHistory(userId, limit = 20) {
        const user = this.users.get(userId);
        if (!user) return [];
        
        return user.history.slice(0, limit);
    }
    
    // Atualizar configurações do usuário
    updateUserSettings(userId, settings) {
        const user = this.users.get(userId);
        if (!user) return false;
        
        user.settings = { ...user.settings, ...settings };
        this.saveUsersToStorage();
        
        return true;
    }
    
    // Obter top jogadores
    getTopPlayers(category = 'wins', limit = 10) {
        const allUsers = Array.from(this.users.values());
        
        let sortFn;
        switch(category) {
            case 'earnings':
                sortFn = (a, b) => b.stats.totalEarnings - a.stats.totalEarnings;
                break;
            case 'streak':
                sortFn = (a, b) => b.stats.bestStreak - a.stats.bestStreak;
                break;
            case 'wins':
            default:
                sortFn = (a, b) => b.stats.wins - a.stats.wins;
                break;
        }
        
        return allUsers
            .sort(sortFn)
            .slice(0, limit)
            .map((user, index) => ({
                rank: index + 1,
                username: user.username,
                avatar: user.profile.avatar,
                stats: user.stats
            }));
    }
}

// Instância global
window.userSystem = new UserSystem();

