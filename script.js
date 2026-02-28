(function() {
    function createParticles() {
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 8 + 's';
            particle.style.background = i % 3 === 0 ? '#bf7aff' : (i % 3 === 1 ? '#ff7de9' : '#aa6eff');
            particle.style.width = (Math.random() * 6 + 2) + 'px';
            particle.style.height = particle.style.width;
            document.body.appendChild(particle);
        }
    }
    createParticles();

    const lightning = document.getElementById('lightning');
    function flashLightning() {
        lightning.style.setProperty('--x', (Math.random() * 100) + '%');
        lightning.style.setProperty('--y', (Math.random() * 100) + '%');
        lightning.classList.add('flash');
        setTimeout(() => {
            lightning.classList.remove('flash');
        }, 300);
    }

    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        lightning.style.setProperty('--x', x + '%');
        lightning.style.setProperty('--y', y + '%');
    });
    
    const ROWS = 9;
    const COLS = 9;
    const TOTAL_MINES = 10;

    let board = [];
    let revealed = [];
    let flags = [];
    let gameActive = true;
    let minesGenerated = false;

    const ADMIN_USERNAME = "N3XUS_C0R3";
    const ADMIN_PASSWORD = "GH05T_4DM1N";
    
    let currentRole = 'guest';
    let currentUser = null;
    let users = [];
    let leaderboardData = [
        { name: 'SHADOW', mines: 9, time: '42с' },
        { name: 'VIOLET_M', mines: 8, time: '55с' },
        { name: 'NOX', mines: 7, time: '1:02' },
        { name: 'FANTOM', mines: 6, time: '1:20' },
        { name: 'LUNA', mines: 5, time: '1:47' }
    ];

    const boardElement = document.getElementById('board');
    const mineCounterElement = document.getElementById('mineCounter');
    const resetBtn = document.getElementById('resetGameBtn');
    const gameStatusEl = document.getElementById('gameStatus');
    const rightSection = document.getElementById('rightSection');
    const roleBadge = document.getElementById('roleBadge');

    function formatMines(count) {
        return count.toString().padStart(3, '0');
    }

    function updateMineCounter() {
        let flaggedCount = 0;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (flags[r][c]) flaggedCount++;
            }
        }
        const remaining = TOTAL_MINES - flaggedCount;
        mineCounterElement.textContent = formatMines(remaining >= 0 ? remaining : 0);
    }

    function initMatrices() {
        board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        revealed = Array(ROWS).fill().map(() => Array(COLS).fill(false));
        flags = Array(ROWS).fill().map(() => Array(COLS).fill(false));
        minesGenerated = false;
        gameActive = true;
    }

    function generateMines(firstRow, firstCol) {
        let minesPlaced = 0;
        
        while (minesPlaced < TOTAL_MINES) {
            const r = Math.floor(Math.random() * ROWS);
            const c = Math.floor(Math.random() * COLS);
            if ((r === firstRow && c === firstCol) || board[r][c] === -1) continue;
            board[r][c] = -1;
            minesPlaced++;
        }

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] === -1) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === -1) count++;
                    }
                }
                board[r][c] = count;
            }
        }
    }

    function revealCell(row, col) {
        if (!gameActive) return;
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
        if (revealed[row][col] || flags[row][col]) return;

        revealed[row][col] = true;

        if (board[row][col] === -1) {
            gameActive = false;
            gameStatusEl.textContent = '💥 БАХ! ПРИЗРАЧНАЯ МИНА ВЗОРВАЛАСЬ! 💥';
            flashLightning();
            
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (board[r][c] === -1) revealed[r][c] = true;
                }
            }
            renderBoard();
            
            if (currentUser) {
                console.log('📡 [POST] /api/game-result', {
                    user: currentUser,
                    role: currentRole,
                    result: 'lose',
                    timestamp: new Date().toISOString()
                });
            }
            return;
        }

        if (board[row][col] === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = row + dr;
                    const nc = col + dc;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !revealed[nr][nc] && !flags[nr][nc]) {
                        revealCell(nr, nc);
                    }
                }
            }
        }

        checkWin();
    }

    function checkWin() {
        let allSafeRevealed = true;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] !== -1 && !revealed[r][c]) {
                    allSafeRevealed = false;
                    break;
                }
            }
        }

        if (allSafeRevealed && gameActive) {
            gameActive = false;
            
            gameStatusEl.textContent = '🎉 ПОБЕДА! ФИОЛЕТОВАЯ МОЛНИЯ! 🎉';
            flashLightning();
            
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (board[r][c] === -1) flags[r][c] = true;
                }
            }
            renderBoard();
            
            if (currentUser) {
                console.log('📡 [POST] /api/game-result', {
                    user: currentUser,
                    role: currentRole,
                    result: 'win',
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    function toggleFlag(row, col) {
        if (!gameActive) return;
        if (revealed[row][col]) return;
        flags[row][col] = !flags[row][col];
        updateMineCounter();
        renderBoard();
    }

    function leftClickHandler(row, col) {
        if (!gameActive) return;
        if (revealed[row][col] || flags[row][col]) return;

        if (!minesGenerated) {
            generateMines(row, col);
            minesGenerated = true;
        }

        revealCell(row, col);
        updateMineCounter();
        renderBoard();
    }

    function renderBoard() {
        boardElement.innerHTML = '';
        
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                if (revealed[r][c]) {
                    cell.classList.add('revealed');
                    if (board[r][c] === -1) {
                        cell.textContent = '💣';
                        if (Math.random() < 0.3) cell.classList.add('ghost-mine');
                    } else {
                        const val = board[r][c];
                        cell.textContent = val === 0 ? '' : val;
                        cell.setAttribute('data-value', val);
                    }
                } else {
                    if (flags[r][c]) {
                        cell.classList.add('flagged');
                    }
                    if (Math.random() < 0.1 && !flags[r][c]) {
                        cell.classList.add('ghost-mine');
                    }
                }
                
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                cell.addEventListener('click', (e) => {
                    e.preventDefault();
                    const rr = parseInt(e.currentTarget.dataset.row);
                    const cc = parseInt(e.currentTarget.dataset.col);
                    leftClickHandler(rr, cc);
                });
                
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    const rr = parseInt(e.currentTarget.dataset.row);
                    const cc = parseInt(e.currentTarget.dataset.col);
                    toggleFlag(rr, cc);
                });
                
                boardElement.appendChild(cell);
            }
        }
    }

    function resetGame() {
        initMatrices();
        renderBoard();
        updateMineCounter();
        gameActive = true;
        minesGenerated = false;
        gameStatusEl.textContent = '⚡ НОВАЯ ИГРА ⚡';
    }
    
    function updateRoleUI() {
        roleBadge.className = 'role-badge ' + currentRole;
        
        if (currentRole === 'guest') {
            roleBadge.innerHTML = '👤 ГОСТЬ';
        } else if (currentRole === 'user') {
            roleBadge.innerHTML = `⭐ ${currentUser || 'ЮЗЕР'}`;
        } else if (currentRole === 'admin') {
            roleBadge.innerHTML = `🛡️ АДМИН ${currentUser || ''}`;
        }
    }

    function renderLeaderboard() {
        let rows = '';
        leaderboardData.forEach((player, index) => {
            rows += `
                <tr>
                    <td>${player.name}</td>
                    <td>${player.mines}</td>
                    <td>${player.time}</td>
                </tr>
            `;
        });
        return rows;
    }

    function renderAdminUserList() {
        let list = '';
        leaderboardData.forEach((player, index) => {
            list += `
                <div class="admin-user-row">
                    <span>${player.name}</span>
                    <span style="color:#9effb0;">👻 онлайн</span>
                    <button class="remove-user-btn" data-username="${player.name}">✕</button>
                </div>
            `;
        });
        return list;
    }

    function removeUserFromLeaderboard(username) {
        leaderboardData = leaderboardData.filter(player => player.name !== username);
        if (currentRole === 'admin') {
            renderRightPanel();
        }
        gameStatusEl.textContent = `👻 Игрок ${username} удалён из лидерборда`;
        flashLightning();
    }

    function renderRightPanel() {
        let html = '';
        
        if (currentRole === 'guest') {
            html = `
                <div class="register-box">
                    <div class="register-title">🔐 РЕГИСТРАЦИЯ</div>
                    <input type="text" class="register-input" id="usernameInput" placeholder="имя пользователя" value="Игрок_${Math.floor(Math.random() * 1000)}">
                    <input type="password" class="register-input" id="passwordInput" placeholder="пароль">
                    <div id="registerError" class="error-message" style="display: none;">Введите пароль</div>
                    <button class="register-button" id="registerBtn">🌟 ЗАРЕГИСТРИРОВАТЬСЯ</button>
                </div>
                <div class="leaderboard">
                    <h3>🏆 ТОП ИГРОКОВ</h3>
                    <table class="leaderboard-table">
                        <thead><tr><th>ИГРОК</th><th>МИНЫ</th><th>ВРЕМЯ</th></tr></thead>
                        <tbody>
                            ${renderLeaderboard()}
                        </tbody>
                    </table>
                    <div class="backend-hint" id="guestLeaderboardHint">⚡ загрузить с бэкенда</div>
                </div>
            `;
        } else if (currentRole === 'user') {
            html = `
                <div class="register-box">
                    <div class="register-title">⭐ ПРИВЕТ, ${currentUser}</div>
                    <div style="background:#2b1e3d; border-radius:40px; padding:15px; margin-bottom:16px; border:1px solid #9b79cf;">
                        Ты в игре, удачи!
                    </div>
                    <button class="register-button" id="saveScoreBtn">💾 СОХРАНИТЬ РЕЗУЛЬТАТ</button>
                    <button class="register-button" style="margin-top:10px; background:#352c4a;" id="logoutBtn">🚪 ВЫЙТИ</button>
                </div>
                <div class="leaderboard">
                    <h3>🏆 ТВОЙ ТОП</h3>
                    <table class="leaderboard-table">
                        <thead><tr><th>ИГРОК</th><th>МИНЫ</th><th>ВРЕМЯ</th></tr></thead>
                        <tbody>
                            ${renderLeaderboard()}
                        </tbody>
                    </table>
                    <div class="backend-hint" id="userLeaderboardHint">⚡ моя статистика</div>
                </div>
            `;
        } else if (currentRole === 'admin') {
            html = `
                <div class="register-box">
                    <div class="register-title">🛡️ АДМИНКА</div>
                    <div style="background:#2b1d3e; border-radius:40px; padding:15px; margin-bottom:16px; border:2px solid #ff44aa;">
                        ${currentUser}, ты управляешь всем
                    </div>
                    <button class="register-button" id="resetLeaderboardBtn" style="background:#6b3f6b;">⚡ СБРОСИТЬ ЛИДЕРБОРД</button>
                    <button class="register-button" style="margin-top:10px; background:#4f3a6b;" id="adminLogoutBtn">🚪 ВЫЙТИ ИЗ АДМИНКИ</button>
                </div>
                <div class="leaderboard" style="border-color:#ff88ff;">
                    <h3>👥 УПРАВЛЕНИЕ ИГРОКАМИ</h3>
                    <div id="usersList">
                        ${renderAdminUserList()}
                    </div>
                    <div class="backend-hint" id="adminHint">⚡ нажми ✕ чтобы удалить игрока</div>
                </div>
            `;
        }
        
        rightSection.innerHTML = html;
        
        if (currentRole === 'guest') {
            document.getElementById('registerBtn')?.addEventListener('click', () => {
                const nick = document.getElementById('usernameInput')?.value.trim() || 'Игрок';
                const password = document.getElementById('passwordInput')?.value.trim() || '';
                const errorEl = document.getElementById('registerError');
                
                if (!password) {
                    errorEl.style.display = 'block';
                    errorEl.textContent = 'Введите пароль';
                    gameStatusEl.textContent = '❌ Пароль не может быть пустым';
                    return;
                }
                
                errorEl.style.display = 'none';
                
                console.log('📡 [POST] /api/register', { 
                    username: nick, 
                    password: '●'.repeat(password.length) 
                });
                
                if (nick === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                    currentRole = 'admin';
                    currentUser = nick;
                } else {
                    currentRole = 'user';
                    currentUser = nick;
                }
                
                if (!users.includes(nick)) users.push(nick);
                updateRoleUI();
                renderRightPanel();
                
                if (currentRole === 'admin') {
                    gameStatusEl.textContent = '👑 Добро пожаловать, N3XUS_C0R3!';
                } else {
                    gameStatusEl.textContent = `⭐ Добро пожаловать, ${nick}!`;
                }
                flashLightning();
            });
            
            document.getElementById('guestLeaderboardHint')?.addEventListener('click', () => {
                console.log('📡 [GET] /api/leaderboard');
                gameStatusEl.textContent = '📡 Запрос к бэкенду...';
            });
        }
        
        if (currentRole === 'user') {
            document.getElementById('saveScoreBtn')?.addEventListener('click', () => {
                console.log('📡 [POST] /api/save-score', {
                    user: currentUser
                });
                
                gameStatusEl.textContent = '💾 Результат отправлен на бэкенд!';
                flashLightning();
            });
            
            document.getElementById('logoutBtn')?.addEventListener('click', () => {
                console.log('📡 [POST] /api/logout', { user: currentUser });
                
                currentRole = 'guest';
                currentUser = null;
                updateRoleUI();
                renderRightPanel();
                gameStatusEl.textContent = '👋 Ты вышел. Возвращайся!';
            });
            
            document.getElementById('userLeaderboardHint')?.addEventListener('click', () => {
                console.log('📡 [GET] /api/user-stats', { user: currentUser });
                gameStatusEl.textContent = `📡 Загружаем статистику ${currentUser}...`;
            });
        }
        
        if (currentRole === 'admin') {
            document.getElementById('resetLeaderboardBtn')?.addEventListener('click', () => {
                console.log('📡 [POST] /api/admin/reset-leaderboard', { admin: currentUser });
                
                leaderboardData = [
                    { name: 'SHADOW', mines: 9, time: '42с' },
                    { name: 'VIOLET_M', mines: 8, time: '55с' },
                    { name: 'NOX', mines: 7, time: '1:02' },
                    { name: 'FANTOM', mines: 6, time: '1:20' },
                    { name: 'LUNA', mines: 5, time: '1:47' }
                ];
                renderRightPanel();
                
                gameStatusEl.textContent = '🌩️ ЛИДЕРБОРД СБРОШЕН!';
                flashLightning();
                flashLightning();
            });
            
            document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
                console.log('📡 [POST] /api/admin/logout', { admin: currentUser });
                
                currentRole = 'guest';
                currentUser = null;
                updateRoleUI();
                renderRightPanel();
                gameStatusEl.textContent = '👋 Админ вышел. Возвращайся!';
                flashLightning();
            });
            
            document.querySelectorAll('.remove-user-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const username = btn.dataset.username;
                    removeUserFromLeaderboard(username);
                });
            });
        }
    }
    
    initMatrices();
    renderBoard();
    updateMineCounter();
    renderRightPanel();
    updateRoleUI();

    resetBtn.addEventListener('click', resetGame);

    window.saperAPI = {
        updateLeaderboard: function(data) {
            console.log('📥 Получены данные лидерборда:', data);
            const tbody = document.querySelector('.leaderboard-table tbody');
            if (tbody && data) {
                tbody.innerHTML = data.map(row => 
                    `<tr><td>${row.name}</td><td>${row.mines}</td><td>${row.time}</td></tr>`
                ).join('');
            }
        },
        
        updateUserData: function(userData) {
            console.log('📥 Данные пользователя:', userData);
            if (userData.role) {
                currentRole = userData.role;
                currentUser = userData.username;
                updateRoleUI();
                renderRightPanel();
            }
        },
        
        notify: function(message, type = 'info') {
            gameStatusEl.textContent = `📢 ${message}`;
            if (type === 'success') flashLightning();
        }
    };
})();