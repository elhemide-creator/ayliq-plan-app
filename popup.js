const { ipcRenderer } = require('electron');

const BASE_AMOUNT_EUR = 440;
const EXCHANGE_RATE = 1.85; 
const BONUS_PERCENTAGES = { 70: 35, 80: 50, 90: 70, 100: 110, 105: 115, 110: 120, 115: 130, 120: 140, 130: 145, 140: 150, 150: 170, 160: 180, 170: 195, 180: 210, 190: 230, 200: 250 };

let currentTab = 'plan'; 
let lastPlan = 0, lastDoc = 0, lastCrm = 0;
let timerInterval = null, timerSeconds = 0;

function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab_${tabId}`).classList.add('active');
    renderApp();
}

function renderApp() {
    const mainContent = document.getElementById('main-content');
    if (currentTab === 'plan') renderMainPlanPage(mainContent);
    else if (currentTab === 'workhours') renderWorkHoursPage(mainContent);
    else if (currentTab === 'crm') renderCrmTimerPage(mainContent);
}

function renderMainPlanPage(container) {
    container.innerHTML = `
        <div class="input-group">
            <div class="header input-row"><label>Aylıq Plan</label><input type="number" id="plan" value="${lastPlan || ''}"></div>
            <div class="input-row"><label>DOC</label><input type="number" id="doc" value="${lastDoc || ''}"></div>
            <div class="input-row"><label>CRM</label><input type="number" id="crm" value="${lastCrm || ''}"></div>
        </div>
        <div class="total input-row"><label>Toplam</label><span id="total_value" style="font-weight:bold; font-size:1.2em;">0</span></div>
        <div class="percentage">
            <div class="input-row"><label>% Tamamlanıb</label><span id="percentage_reached">0%</span></div>
            <div class="input-row"><label>% Qalıb</label><span id="percentage_left">100%</span></div>
        </div>
        <div class="final-result">
            <div class="input-row"><label>Qazanc (EUR)</label><span id="final_result_value_eur" style="color:var(--danger-color); font-weight:bold;">0.00 EUR</span></div>
        </div>
        <button id="target_button">Hesabla</button>
    `;
    
    ['plan', 'doc', 'crm'].forEach(id => {
        document.getElementById(id).addEventListener('input', savePlanValues);
    });
    updatePlanResults(lastPlan, lastDoc, lastCrm);
}

function savePlanValues() {
    lastPlan = parseFloat(document.getElementById('plan').value) || 0;
    lastDoc = parseFloat(document.getElementById('doc').value) || 0;
    lastCrm = parseFloat(document.getElementById('crm').value) || 0;
    localStorage.setItem('plan', lastPlan);
    localStorage.setItem('doc', lastDoc);
    localStorage.setItem('crm', lastCrm);
    updatePlanResults(lastPlan, lastDoc, lastCrm);
}

function getBonusPercentage(reachedPercentage) {
    const keys = Object.keys(BONUS_PERCENTAGES).map(Number).sort((a, b) => a - b);
    if (reachedPercentage < 70) return 0;
    let applicableBonus = 0;
    for (const key of keys) {
        if (reachedPercentage >= key) applicableBonus = BONUS_PERCENTAGES[key];
        else break; 
    }
    return reachedPercentage >= 200 ? BONUS_PERCENTAGES[200] : applicableBonus;
}

function updatePlanResults(plan, doc, crm) {
    const total = doc + crm;
    let reachedPercentage = (plan > 0) ? (total / plan) * 100 : 0;
    const bonusAmount = (BASE_AMOUNT_EUR * getBonusPercentage(reachedPercentage)) / 100;
    const finalEur = bonusAmount + BASE_AMOUNT_EUR;
    
    const eTotal = document.getElementById('total_value');
    if(eTotal) {
        eTotal.textContent = total.toFixed(0);
        document.getElementById('percentage_reached').textContent = `${reachedPercentage.toFixed(1)}%`;
        document.getElementById('percentage_reached').style.color = reachedPercentage >= 100 ? '#50fa7b' : '#ff6b6b';
        document.getElementById('percentage_left').textContent = `${Math.max(0, 100 - reachedPercentage).toFixed(1)}%`;
        document.getElementById('final_result_value_eur').textContent = `${finalEur.toFixed(2)} EUR`;
    }
}

function renderWorkHoursPage(container) {
    container.innerHTML = `<h3 style="text-align:center;">İş Saatı Hesablayıcı</h3><p style="text-align:center;opacity:0.7;">(Tezliklə inkişaf etdiriləcək)</p>`;
}

function renderCrmTimerPage(container) {
    container.innerHTML = `
        <h3 style="text-align: center;">Xəta Taymeri</h3>
        <div class="timer-display" id="timer_display">${formatTime(timerSeconds)}</div>
        <div style="display: flex; gap: 10px; margin-top:20px;">
            <button id="start_timer_btn" class="primary-btn" style="background:#28a745;">Başla</button>
            <button id="stop_timer_btn" class="primary-btn" style="background:#dc3545;" ${timerInterval ? '' : 'disabled'}>Dayandır</button>
        </div>
    `;
    document.getElementById('start_timer_btn').addEventListener('click', startTimer);
    document.getElementById('stop_timer_btn').addEventListener('click', stopTimer);
}

function formatTime(totalSeconds) {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function startTimer() {
    if (timerInterval) return;
    document.getElementById('start_timer_btn').disabled = true;
    document.getElementById('stop_timer_btn').disabled = false;
    timerInterval = setInterval(() => {
        timerSeconds++;
        const display = document.getElementById('timer_display');
        if(display) display.textContent = formatTime(timerSeconds); 
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerSeconds = 0;
    if (document.getElementById('timer_display')) {
        document.getElementById('timer_display').textContent = "00:00:00";
        document.getElementById('start_timer_btn').disabled = false;
        document.getElementById('stop_timer_btn').disabled = true;
    }
}

// --- DİZAYN VƏ AYARLAR MƏNTİQİ ---
function applyThemeColor(color) {
    document.documentElement.style.setProperty('--primary-color', color);
    document.documentElement.style.setProperty('--border-color', color + '80'); // 50% opacity
    document.documentElement.style.setProperty('--neon-shadow', `0 0 8px ${color}`);
}

document.addEventListener('DOMContentLoaded', () => {
    // Rəng Yükləməsi
    const savedColor = localStorage.getItem('neonColor') || '#00eaff';
    applyThemeColor(savedColor);
    document.getElementById('neon_color_picker').value = savedColor;

    // Gecə/Gündüz Yükləməsi
    if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');

    // Startup və Mini-Mode Yükləməsi
    const isStartup = localStorage.getItem('autoStartup') === 'true';
    const isMiniMode = localStorage.getItem('miniMode') === 'true';
    document.getElementById('startup_toggle').checked = isStartup;
    document.getElementById('mini_mode_toggle').checked = isMiniMode;
    
    if(isMiniMode) {
        document.body.classList.add('mini-mode');
        ipcRenderer.send('toggle-mini-mode', true);
    }

    // Dataları yüklə
    lastPlan = parseFloat(localStorage.getItem('plan')) || 0;
    lastDoc = parseFloat(localStorage.getItem('doc')) || 0;
    lastCrm = parseFloat(localStorage.getItem('crm')) || 0;
    
    // Tab eventləri
    document.querySelectorAll('.tab-link').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.getAttribute('data-target')));
    });

    // Tema düyməsi
    document.getElementById('theme_toggle').addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    });

    // Ayarlar Modalı Eventləri
    const modal = document.getElementById('settings_modal');
    document.getElementById('settings_btn').addEventListener('click', () => modal.classList.remove('hidden'));
    
    document.getElementById('close_settings').addEventListener('click', () => {
        // Rəngi yaddaşa vur
        const newColor = document.getElementById('neon_color_picker').value;
        localStorage.setItem('neonColor', newColor);
        applyThemeColor(newColor);

        // Startup yaddaşa vur və main.js-ə göndər
        const startup = document.getElementById('startup_toggle').checked;
        localStorage.setItem('autoStartup', startup);
        ipcRenderer.send('toggle-startup', startup);

        // Mini Mode yaddaşa vur və main.js-ə göndər
        const miniMode = document.getElementById('mini_mode_toggle').checked;
        localStorage.setItem('miniMode', miniMode);
        if (miniMode) {
            document.body.classList.add('mini-mode');
            ipcRenderer.send('toggle-mini-mode', true);
        } else {
            document.body.classList.remove('mini-mode');
            ipcRenderer.send('toggle-mini-mode', false);
        }

        modal.classList.add('hidden');
    });

    renderApp();
});