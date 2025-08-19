// Sistema de Matchmaking para Snake Battle
class MatchmakingSystem {
    constructor() {
        this.waitingPlayers = new Map(); // tableValue -> [players]
        this.activeMatches = new Map(); // matchId -> match
        this.playerQueues = new Map(); // playerId -> queueInfo
        
        // Configurações
        this.maxWaitTime = 30000; // 30 segundos
        this.botNames = [
            'SnakeBot', 'CobraAI', 'ViperaBot', 'PythonMaster', 'SerpentKing',
            'FastSnake', 'GreenMamba', 'RattleBot', 'CobraStrike', 'SnakeEye',
            'VenomBot', 'SlitherAI', 'BoaBot', 'AnacondaAI', 'KingCobra'
        ];
        
        this.init();
    }
    
    init() {
        // Simular alguns jogadores online
        this.simulateOnlinePlayers();
        
        // Atualizar estatísticas das mesas periodicamente
        setInterval(() => {
            this.updateTableStats();
        }, 5000);
    }
    
    // Adicionar jogador à fila
    addPlayerToQueue(playerId, playerName, tableValue, callback) {
        // Verificar se o jogador já está em uma fila
        if (this.playerQueues.has(playerId)) {
            callback({ error: 'Jogador já está em uma fila' });
            return;
        }
        
        const queueInfo = {
            playerId: playerId,
            playerName: playerName,
            tableValue: tableValue,
            joinTime: Date.now(),
            callback: callback
        };
        
        // Adicionar à fila específica da mesa
        if (!this.waitingPlayers.has(tableValue)) {
            this.waitingPlayers.set(tableValue, []);
        }
        
        this.waitingPlayers.get(tableValue).push(queueInfo);
        this.playerQueues.set(playerId, queueInfo);
        
        // Tentar fazer match imediatamente
        this.tryMatchmaking(tableValue);
        
        // Configurar timeout para match com bot
        setTimeout(() => {
            if (this.playerQueues.has(playerId)) {
                this.matchWithBot(playerId);
            }
        }, this.maxWaitTime);
        
        // Atualizar estatísticas da mesa
        this.updateTableStats();
    }
    
    // Remover jogador da fila
    removePlayerFromQueue(playerId) {
        const queueInfo = this.playerQueues.get(playerId);
        if (!queueInfo) return;
        
        const tableValue = queueInfo.tableValue;
        const queue = this.waitingPlayers.get(tableValue);
        
        if (queue) {
            const index = queue.findIndex(p => p.playerId === playerId);
            if (index !== -1) {
                queue.splice(index, 1);
            }
        }
        
        this.playerQueues.delete(playerId);
        this.updateTableStats();
    }
    
    // Tentar fazer matchmaking
    tryMatchmaking(tableValue) {
        const queue = this.waitingPlayers.get(tableValue);
        if (!queue || queue.length < 2) return;
        
        // Pegar os dois primeiros jogadores da fila
        const player1 = queue.shift();
        const player2 = queue.shift();
        
        // Remover dos mapas de controle
        this.playerQueues.delete(player1.playerId);
        this.playerQueues.delete(player2.playerId);
        
        // Criar partida
        const match = this.createMatch(player1, player2, tableValue);
        
        // Notificar os jogadores
        player1.callback({ 
            success: true, 
            match: match,
            opponent: {
                name: player2.playerName,
                isBot: false
            }
        });
        
        player2.callback({ 
            success: true, 
            match: match,
            opponent: {
                name: player1.playerName,
                isBot: false
            }
        });
        
        this.updateTableStats();
    }
    
    // Fazer match com bot
    matchWithBot(playerId) {
        const queueInfo = this.playerQueues.get(playerId);
        if (!queueInfo) return;
        
        // Remover da fila
        this.removePlayerFromQueue(playerId);
        
        // Criar bot
        const botName = this.botNames[Math.floor(Math.random() * this.botNames.length)];
        const bot = {
            playerId: 'bot_' + Date.now(),
            playerName: botName,
            tableValue: queueInfo.tableValue,
            isBot: true
        };
        
        // Criar partida
        const match = this.createMatch(queueInfo, bot, queueInfo.tableValue);
        
        // Notificar o jogador
        queueInfo.callback({
            success: true,
            match: match,
            opponent: {
                name: botName,
                isBot: true
            }
        });
    }
    
    // Criar partida
    createMatch(player1, player2, tableValue) {
        const matchId = 'match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const match = {
            id: matchId,
            tableValue: tableValue,
            players: [
                {
                    id: player1.playerId,
                    name: player1.playerName,
                    isBot: player1.isBot || false
                },
                {
                    id: player2.playerId,
                    name: player2.playerName,
                    isBot: player2.isBot || false
                }
            ],
            startTime: Date.now(),
            status: 'starting'
        };
        
        this.activeMatches.set(matchId, match);
        
        // Remover partida após 10 minutos (cleanup)
        setTimeout(() => {
            this.activeMatches.delete(matchId);
        }, 600000);
        
        return match;
    }
    
    // Simular jogadores online
    simulateOnlinePlayers() {
        const tableValues = [5, 10, 15, 20];
        
        // Adicionar alguns jogadores simulados às filas
        tableValues.forEach(value => {
            const playersCount = Math.floor(Math.random() * 3); // 0-2 jogadores por mesa
            
            for (let i = 0; i < playersCount; i++) {
                const botName = this.botNames[Math.floor(Math.random() * this.botNames.length)];
                const botId = 'simulated_' + Date.now() + '_' + i;
                
                if (!this.waitingPlayers.has(value)) {
                    this.waitingPlayers.set(value, []);
                }
                
                // Não adicionar callback para jogadores simulados
                this.waitingPlayers.get(value).push({
                    playerId: botId,
                    playerName: botName,
                    tableValue: value,
                    joinTime: Date.now() - Math.random() * 60000, // Até 1 minuto atrás
                    isSimulated: true
                });
            }
        });
        
        // Simular algumas partidas em andamento
        for (let i = 0; i < 2; i++) {
            const tableValue = tableValues[Math.floor(Math.random() * tableValues.length)];
            const matchId = 'simulated_match_' + i;
            
            this.activeMatches.set(matchId, {
                id: matchId,
                tableValue: tableValue,
                players: [
                    { name: this.botNames[i * 2], isBot: true },
                    { name: this.botNames[i * 2 + 1], isBot: true }
                ],
                startTime: Date.now() - Math.random() * 300000, // Até 5 minutos atrás
                status: 'playing'
            });
        }
    }
    
    // Atualizar estatísticas das mesas
    updateTableStats() {
        const tableCards = document.querySelectorAll('.table-card');
        
        tableCards.forEach(card => {
            const tableValue = parseFloat(card.getAttribute('data-value'));
            const waitingCount = this.waitingPlayers.get(tableValue)?.length || 0;
            const playingCount = Array.from(this.activeMatches.values())
                .filter(match => match.tableValue === tableValue && match.status === 'playing').length;
            
            // Atualizar contador de jogadores
            const playersCountEl = card.querySelector('.players-count span');
            const statusEl = card.querySelector('.table-status');
            const btnEl = card.querySelector('.btn-join-table, .btn-watch-game');
            
            if (playingCount > 0) {
                // Mesa com partida em andamento
                playersCountEl.textContent = '2/2 jogadores';
                statusEl.textContent = 'Em Andamento';
                statusEl.className = 'table-status status-playing';
                card.setAttribute('data-status', 'playing');
                
                btnEl.className = 'btn-watch-game';
                btnEl.innerHTML = '<i class="fas fa-eye"></i> Assistir Partida';
            } else if (waitingCount > 0) {
                // Mesa com jogadores aguardando
                playersCountEl.textContent = `${waitingCount}/2 jogadores`;
                statusEl.textContent = 'Aguardando';
                statusEl.className = 'table-status status-waiting';
                card.setAttribute('data-status', 'waiting');
                
                btnEl.className = 'btn-join-table';
                btnEl.innerHTML = '<i class="fas fa-gamepad"></i> Entrar na Mesa';
            } else {
                // Mesa disponível
                playersCountEl.textContent = '0/2 jogadores';
                statusEl.textContent = 'Disponível';
                statusEl.className = 'table-status status-available';
                card.setAttribute('data-status', 'available');
                
                btnEl.className = 'btn-join-table';
                btnEl.innerHTML = '<i class="fas fa-gamepad"></i> Entrar na Mesa';
            }
        });
    }
    
    // Obter estatísticas gerais
    getStats() {
        const totalWaiting = Array.from(this.waitingPlayers.values())
            .reduce((sum, queue) => sum + queue.length, 0);
        const totalPlaying = this.activeMatches.size * 2;
        
        return {
            totalWaiting: totalWaiting,
            totalPlaying: totalPlaying,
            totalOnline: totalWaiting + totalPlaying,
            activeMatches: this.activeMatches.size,
            queuesByTable: Object.fromEntries(
                Array.from(this.waitingPlayers.entries()).map(([value, queue]) => [value, queue.length])
            )
        };
    }
    
    // Obter informações de uma mesa específica
    getTableInfo(tableValue) {
        const waitingCount = this.waitingPlayers.get(tableValue)?.length || 0;
        const activeMatches = Array.from(this.activeMatches.values())
            .filter(match => match.tableValue === tableValue);
        
        return {
            tableValue: tableValue,
            waitingPlayers: waitingCount,
            activeMatches: activeMatches.length,
            status: activeMatches.length > 0 ? 'playing' : 
                   waitingCount > 0 ? 'waiting' : 'available'
        };
    }
}

// Sistema de Ranking
class RankingSystem {
    constructor() {
        this.rankings = {
            victories: [],
            earnings: [],
            streak: []
        };
        
        this.init();
    }
    
    init() {
        this.generateMockRankings();
        this.updateRankingDisplay();
    }
    
    // Gerar rankings simulados
    generateMockRankings() {
        const playerNames = [
            'SnakeMaster', 'CobraKing', 'ViperaQueen', 'FastSnake', 'GreenMamba',
            'PythonLord', 'SerpentAce', 'ViperStrike', 'CobraElite', 'SnakeGod',
            'VenomKing', 'SlitherPro', 'BoaMaster', 'AnacondaLord', 'RattleSnake'
        ];
        
        // Ranking por vitórias
        this.rankings.victories = playerNames.slice(0, 10).map((name, index) => ({
            rank: index + 1,
            name: name,
            victories: 127 - (index * 8) - Math.floor(Math.random() * 10),
            earnings: (127 - (index * 8)) * 20 + Math.floor(Math.random() * 500)
        }));
        
        // Ranking por ganhos
        this.rankings.earnings = [...this.rankings.victories]
            .sort((a, b) => b.earnings - a.earnings)
            .map((player, index) => ({ ...player, rank: index + 1 }));
        
        // Ranking por sequência
        this.rankings.streak = playerNames.slice(0, 10).map((name, index) => ({
            rank: index + 1,
            name: name,
            streak: 25 - (index * 2) - Math.floor(Math.random() * 3),
            victories: Math.floor(Math.random() * 100) + 50
        }));
    }
    
    // Atualizar exibição do ranking
    updateRankingDisplay() {
        const rankingList = document.getElementById('victories-ranking');
        if (!rankingList) return;
        
        rankingList.innerHTML = '';
        
        this.rankings.victories.forEach(player => {
            const item = document.createElement('div');
            item.className = `ranking-item ${player.rank <= 3 ? 'rank-' + player.rank : ''}`;
            
            item.innerHTML = `
                <div class="rank-position">${player.rank}</div>
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-stats">${player.victories} vitórias</div>
                </div>
                <div class="player-earnings">R$ ${player.earnings.toFixed(2)}</div>
            `;
            
            rankingList.appendChild(item);
        });
    }
    
    // Adicionar vitória de jogador
    addPlayerVictory(playerName, earnings) {
        // Encontrar jogador no ranking ou criar novo
        let player = this.rankings.victories.find(p => p.name === playerName);
        
        if (!player) {
            player = {
                name: playerName,
                victories: 0,
                earnings: 0
            };
            this.rankings.victories.push(player);
        }
        
        player.victories++;
        player.earnings += earnings;
        
        // Reordenar ranking
        this.rankings.victories.sort((a, b) => b.victories - a.victories);
        
        // Atualizar ranks
        this.rankings.victories.forEach((p, index) => {
            p.rank = index + 1;
        });
        
        this.updateRankingDisplay();
    }
    
    // Obter posição do jogador
    getPlayerRank(playerName) {
        const player = this.rankings.victories.find(p => p.name === playerName);
        return player ? player.rank : null;
    }
}

// Instâncias globais
window.matchmakingSystem = new MatchmakingSystem();
window.rankingSystem = new RankingSystem();

