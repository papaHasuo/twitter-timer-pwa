// モバイル版タイマーアプリ
class MobileTimerApp {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.timeRemaining = 30 * 60; // 30分（秒）
        this.totalTime = 30 * 60;
        this.timerInterval = null;
        this.warningShown = false;
        this.isBlocked = false;
        this.blockEndTime = null;
        
        this.initElements();
        this.loadSettings();
        this.bindEvents();
        this.updateDisplay();
        this.startSiteMonitoring();
        this.checkNotificationPermission();
    }
    
    initElements() {
        // タイマー要素
        this.timeDisplay = document.getElementById('timeRemaining');
        this.statusDisplay = document.getElementById('timerStatus');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // ナビゲーション要素
        this.navItems = document.querySelectorAll('.nav-item');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // 設定要素
        this.timeLimitInput = document.getElementById('timeLimitInput');
        this.sitesList = document.getElementById('sitesList');
        this.newSiteInput = document.getElementById('newSiteInput');
        this.addSiteBtn = document.getElementById('addSiteBtn');
        this.messagesList = document.getElementById('messagesList');
        this.newMessageInput = document.getElementById('newMessageInput');
        this.addMessageBtn = document.getElementById('addMessageBtn');
        this.notificationSwitch = document.getElementById('notificationSwitch');
        
        // モーダル要素
        this.warningModal = document.getElementById('warningModal');
        this.warningMessage = document.getElementById('warningMessage');
        this.countdown = document.getElementById('countdown');
        this.continueBtn = document.getElementById('continueBtn');
        this.stopNowBtn = document.getElementById('stopNowBtn');
        
        // ブロック画面要素
        this.blockScreen = document.getElementById('blockScreen');
        this.blockTimer = document.getElementById('blockTimer');
        this.emergencyBtn = document.getElementById('emergencyBtn');
        
        // 統計要素
        this.totalUsage = document.getElementById('totalUsage');
        this.sessionCount = document.getElementById('sessionCount');
        this.statUsage = document.getElementById('statUsage');
        this.statBlocks = document.getElementById('statBlocks');
        this.statGoal = document.getElementById('statGoal');
        this.statStreak = document.getElementById('statStreak');
        this.monitoringSites = document.getElementById('monitoringSites');
    }
    
    bindEvents() {
        // タイマーボタン
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        
        // ナビゲーション
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => this.switchTab(e.target.closest('.nav-item').dataset.tab));
        });
        
        // 設定
        this.timeLimitInput.addEventListener('change', () => this.saveSettings());
        this.addSiteBtn.addEventListener('click', () => this.addSite());
        this.newSiteInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addSite();
        });
        this.addMessageBtn.addEventListener('click', () => this.addMessage());
        this.notificationSwitch.addEventListener('change', () => this.saveSettings());
        
        // モーダル
        this.continueBtn.addEventListener('click', () => this.extendTime());
        this.stopNowBtn.addEventListener('click', () => this.startBreak());
        
        // ブロック画面
        this.emergencyBtn.addEventListener('click', () => this.emergencyUnblock());
        
        // ページ離脱時の処理
        window.addEventListener('beforeunload', () => this.saveState());
        
        // ページフォーカス時の監視
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkSiteMonitoring();
            }
        });
    }
    
    switchTab(tabName) {
        // ナビゲーションのアクティブ状態を更新
        this.navItems.forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // タブコンテンツの表示を更新
        this.tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // 統計タブが選択された場合、統計を更新
        if (tabName === 'stats') {
            this.updateStats();
        }
    }
    
    startTimer() {
        if (this.isBlocked) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.statusDisplay.textContent = 'タイマー動作中';
        
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();
            
            // 5分前警告
            if (this.timeRemaining === 5 * 60 && !this.warningShown) {
                this.showWarning(5 * 60);
            }
            
            // 1分前警告
            if (this.timeRemaining === 1 * 60 && !this.warningShown) {
                this.showWarning(1 * 60);
            }
            
            // 時間切れ
            if (this.timeRemaining <= 0) {
                this.timeUp();
            }
        }, 1000);
        
        this.saveState();
    }
    
    pauseTimer() {
        this.isPaused = true;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.statusDisplay.textContent = 'タイマー一時停止中';
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.saveState();
    }
    
    resetTimer() {
        this.isRunning = false;
        this.isPaused = false;
        this.timeRemaining = this.totalTime;
        this.warningShown = false;
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.statusDisplay.textContent = 'タイマー停止中';
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.updateDisplay();
        this.saveState();
    }
    
    timeUp() {
        this.showFinalWarning();
    }
    
    showWarning(remainingTime) {
        if (this.warningShown) return;
        this.warningShown = true;
        
        const settings = this.getSettings();
        const messages = settings.messages || ['時間が近づいています！'];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        this.warningMessage.textContent = randomMessage;
        this.warningModal.classList.add('active');
        
        // 通知も送信
        if (this.notificationSwitch.checked) {
            this.sendNotification('使いすぎ警告', randomMessage);
        }
        
        // 5秒後に自動で警告を閉じる
        setTimeout(() => {
            this.warningModal.classList.remove('active');
        }, 5000);
    }
    
    showFinalWarning() {
        const settings = this.getSettings();
        const messages = settings.messages || ['時間になりました！'];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        this.warningMessage.textContent = randomMessage;
        this.warningModal.classList.add('active');
        
        let countdown = 5;
        this.countdown.textContent = `${countdown}秒後にブロック画面に移行します...`;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                this.countdown.textContent = `${countdown}秒後にブロック画面に移行します...`;
            } else {
                clearInterval(countdownInterval);
                this.startBreak();
            }
        }, 1000);
        
        // 通知送信
        if (this.notificationSwitch.checked) {
            this.sendNotification('制限時間終了', '休憩時間です！');
        }
    }
    
    extendTime() {
        // あと5分延長
        this.timeRemaining += 5 * 60;
        this.warningModal.classList.remove('active');
        this.warningShown = false;
        
        // 統計に記録
        this.incrementStat('extensions');
    }
    
    startBreak() {
        this.isBlocked = true;
        this.warningModal.classList.remove('active');
        this.blockScreen.style.display = 'flex';
        
        // 15分間のブロック
        this.blockEndTime = Date.now() + (15 * 60 * 1000);
        this.updateBlockTimer();
        
        // タイマーリセット
        this.resetTimer();
        
        // 統計に記録
        this.incrementStat('blocks');
        this.addUsageTime();
    }
    
    updateBlockTimer() {
        if (!this.isBlocked || !this.blockEndTime) return;
        
        const remaining = Math.max(0, this.blockEndTime - Date.now());
        
        if (remaining <= 0) {
            this.endBreak();
            return;
        }
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        this.blockTimer.textContent = `残り休憩時間: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        setTimeout(() => this.updateBlockTimer(), 1000);
    }
    
    emergencyUnblock() {
        if (confirm('本当に緊急解除しますか？\n頻繁な解除は健康に良くありません。')) {
            this.endBreak();
        }
    }
    
    endBreak() {
        this.isBlocked = false;
        this.blockEndTime = null;
        this.blockScreen.style.display = 'none';
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    startSiteMonitoring() {
        // 簡単な監視シミュレーション（実際のブラウザ制御は困難）
        this.updateMonitoringSites();
        setInterval(() => this.checkSiteMonitoring(), 5000);
    }
    
    checkSiteMonitoring() {
        // 現在のURLをチェック（実際の実装では制限があります）
        const currentUrl = window.location.hostname.toLowerCase();
        const settings = this.getSettings();
        const sites = settings.sites || ['twitter.com', 'x.com', 'instagram.com'];
        
        const isOnBlockedSite = sites.some(site => currentUrl.includes(site));
        
        if (isOnBlockedSite && this.isRunning && !this.isBlocked) {
            // 監視対象サイトにアクセス中
            console.log('監視対象サイトを検出');
        }
    }
    
    updateMonitoringSites() {
        const settings = this.getSettings();
        const sites = settings.sites || [];
        
        this.monitoringSites.innerHTML = sites.map(site => `
            <div class="site-item">
                <span class="site-name">${site}</span>
                <span class="site-status">監視中</span>
            </div>
        `).join('');
    }
    
    addSite() {
        const site = this.newSiteInput.value.trim();
        if (!site) return;
        
        const settings = this.getSettings();
        if (!settings.sites.includes(site)) {
            settings.sites.push(site);
            this.saveSettings(settings);
            this.updateSitesList();
            this.updateMonitoringSites();
        }
        
        this.newSiteInput.value = '';
    }
    
    addMessage() {
        const message = this.newMessageInput.value.trim();
        if (!message) return;
        
        const settings = this.getSettings();
        settings.messages.push(message);
        this.saveSettings(settings);
        this.updateMessagesList();
        
        this.newMessageInput.value = '';
    }
    
    updateSitesList() {
        const settings = this.getSettings();
        this.sitesList.innerHTML = settings.sites.map((site, index) => `
            <div class="list-item">
                <span class="list-text">${site}</span>
                <button class="remove-btn" onclick="app.removeSite(${index})">削除</button>
            </div>
        `).join('');
    }
    
    updateMessagesList() {
        const settings = this.getSettings();
        this.messagesList.innerHTML = settings.messages.map((message, index) => `
            <div class="list-item">
                <span class="list-text">${message}</span>
                <button class="remove-btn" onclick="app.removeMessage(${index})">削除</button>
            </div>
        `).join('');
    }
    
    removeSite(index) {
        const settings = this.getSettings();
        settings.sites.splice(index, 1);
        this.saveSettings(settings);
        this.updateSitesList();
        this.updateMonitoringSites();
    }
    
    removeMessage(index) {
        const settings = this.getSettings();
        settings.messages.splice(index, 1);
        this.saveSettings(settings);
        this.updateMessagesList();
    }
    
    loadSettings() {
        const settings = this.getSettings();
        this.timeLimitInput.value = settings.timeLimit / 60;
        this.totalTime = settings.timeLimit;
        this.timeRemaining = settings.timeLimit;
        this.notificationSwitch.checked = settings.notifications;
        
        this.updateSitesList();
        this.updateMessagesList();
        this.updateDisplay();
    }
    
    saveSettings(customSettings = null) {
        const settings = customSettings || {
            timeLimit: this.timeLimitInput.value * 60,
            sites: this.getSettings().sites,
            messages: this.getSettings().messages,
            notifications: this.notificationSwitch.checked
        };
        
        localStorage.setItem('timerSettings', JSON.stringify(settings));
        
        if (!customSettings) {
            this.totalTime = settings.timeLimit;
            this.resetTimer();
        }
    }
    
    getSettings() {
        const defaultSettings = {
            timeLimit: 30 * 60,
            sites: ['twitter.com', 'x.com', 'instagram.com', 'tiktok.com', 'youtube.com'],
            messages: [
                'お疲れさまでした♪ もう十分見たから休憩の時間ですよ〜',
                'えーっと、時間オーバーです！ちょっと休憩しませんか？',
                'あら、もうこんなに時間が経ってるの？お外の景色でも見てリフレッシュしましょ♪',
                'お疲れさま！目を休めて、お水でも飲んでくださいね〜',
                'はいはい、もう十分です！ストレッチでもして体を動かしましょ♪',
                'あまり見すぎるとダメですよ〜！少し休憩が必要ですね',
                'えへへ、時間になっちゃいました♪ 他のことも楽しみましょ！'
            ],
            notifications: true
        };
        
        const saved = localStorage.getItem('timerSettings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }
    
    saveState() {
        const state = {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            timeRemaining: this.timeRemaining,
            lastUpdate: Date.now(),
            warningShown: this.warningShown
        };
        
        localStorage.setItem('timerState', JSON.stringify(state));
    }
    
    loadState() {
        const saved = localStorage.getItem('timerState');
        if (!saved) return;
        
        const state = JSON.parse(saved);
        const now = Date.now();
        const elapsed = Math.floor((now - state.lastUpdate) / 1000);
        
        if (state.isRunning && !state.isPaused) {
            this.timeRemaining = Math.max(0, state.timeRemaining - elapsed);
            this.warningShown = state.warningShown;
            
            if (this.timeRemaining > 0) {
                this.startTimer();
            }
        }
    }
    
    updateStats() {
        const stats = this.getStats();
        this.statUsage.textContent = `${Math.floor(stats.totalUsage / 60)}分`;
        this.statBlocks.textContent = `${stats.blocks}回`;
        this.statGoal.textContent = `${stats.goalAchievement}%`;
        this.statStreak.textContent = `${stats.streak}日`;
        
        this.totalUsage.textContent = `${Math.floor(stats.todayUsage / 60)}分`;
        this.sessionCount.textContent = `${stats.todaySessions}回`;
    }
    
    getStats() {
        const defaultStats = {
            totalUsage: 0,
            blocks: 0,
            extensions: 0,
            goalAchievement: 100,
            streak: 0,
            todayUsage: 0,
            todaySessions: 0
        };
        
        const saved = localStorage.getItem('timerStats');
        return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
    }
    
    incrementStat(statName) {
        const stats = this.getStats();
        stats[statName] = (stats[statName] || 0) + 1;
        localStorage.setItem('timerStats', JSON.stringify(stats));
    }
    
    addUsageTime() {
        const stats = this.getStats();
        const usedTime = this.totalTime - this.timeRemaining;
        stats.totalUsage = (stats.totalUsage || 0) + usedTime;
        stats.todayUsage = (stats.todayUsage || 0) + usedTime;
        stats.todaySessions = (stats.todaySessions || 0) + 1;
        localStorage.setItem('timerStats', JSON.stringify(stats));
    }
    
    checkNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
    
    sendNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: 'icons/icon-192x192.png',
                badge: 'icons/icon-192x192.png'
            });
        }
    }
}

// アプリ初期化
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new MobileTimerApp();
});
