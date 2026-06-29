// popup.js - ELECTRON 3 SƏHİFƏLİ VERSİYA (Plan, İş Saatı, CRM Xəta - 7.5 saatlıq hesablama ilə)

const BASE_AMOUNT_EUR = 440;
const EXCHANGE_RATE = 1.85; 
const BONUS_TARGETS = [70, 80, 90, 100, 105, 110, 115, 120, 130, 140, 150, 160, 170, 180, 190, 200];
const BONUS_PERCENTAGES = {
    70: 35, 80: 50, 90: 70, 100: 110, 105: 115, 110: 120, 115: 130, 
    120: 140, 130: 145, 140: 150, 150: 170, 160: 180, 170: 195, 
    180: 210, 190: 230, 200: 250
};

let currentLang = 'az'; 
let currentTab = 'plan'; // 'plan', 'workhours', 'crm'
let isTargetView = false; 

// Plan Dəyişənləri
let currentHolidays = []; 
let currentCalcType = 'all'; 
let isSettingsCollapsed = true; 
let lastPlan = 0; let lastDoc = 0; let lastCrm = 0;

// Taymer Dəyişənləri
let timerInterval = null;
let timerSeconds = 0;
let archiveData = [];
let isArchiveVisible = false;

// İş Saatı Dəyişənləri
let sickDays = 0; let vacDays = 0; let holDays = 0;

const LANGUAGE_DATA = {
    az: {
        tabPlan: "Plan", tabWorkHours: "İş Saatı", tabCrm: "CRM Xəta",
        plan: "Aylıq Plan", doc: "DOC", crm: "CRM", total: "Toplam", result: "Nəticə",
        completed: "% Tamamlanıb", remaining: "% Qalıb", bonusCalc: "Bonus Hesablaması:", 
        targetBtn: "Hədəfə Nə Qədər Qalıb?", targetTitle: "Hədəfə Nə Qədər Qalıb?", 
        backBtn: "Əsas Plana Geri Qayıt", remDays: "Qalan Gün Sayı:", totalPlan: "Aylıq Plan:",
        currentTotal: "Hazırkı Toplam:", neededAmount: "Qalıq Məbləğ:", dailyPlanning: "Günlük Planlama (Mövcud Toplama Görə)",
        dailyTarget: "Ümumi Gündəlik Hədəf:", bonusTableTitle: "Bonus Cədvəlinə Çatmaq üçün Günlük Plan",
        targetPercent: "Hədəf Faizi", requiredAmount: "Tələb Olunan Məbləğ", earnedEur: "Qazanc (EUR)", 
        dailyRequired: "Gündəlik Lazım Olan", reached: "Çatılıb", planNotSet: "Aylıq plan təyin edilməyib.",
        daysFinished: "Bu ayın bütün günləri bitib.", placeholder: "Ümumi planı yazın",
        calcTitle: "Hesablama Növü:", calcAllDays: "Bütün Günlər", calcWorkDays: "İş Günləri", 
        holidaysTitle: "Bayram Günləri (İş Günü Hesablanmayacaq):", remWorkDays: "Qalan İş Günü Sayı:",
        settingsTitle: "Təqvim və Hesablama Ayarları",
        whTitle: "İş Saatı Hesablayıcı", 
        whInfo: "(09:00 - 18:00 / Gündəlik xalis iş: 7.5 saat)", // YENİLƏNDİ
        sickLeave: "Xəstəlik (Gün)", vacation: "Məzuniyyət (Gün)", holidayLeave: "Bayram (Gün)",
        totalDays: "Ayın Ümumi Günləri:", weekends: "Şənbə/Bazar Günləri:", 
        workDays: "Xalis İş Günü:", totalHours: "Yekun İş Saatı:",
        timerTitle: "Fasilə və Xəta Taymeri", reasonPlaceholder: "Dayanma səbəbini yazın...",
        startTimerBtn: "Başla", stopTimerBtn: "Dayandır", showArchive: "Arxivi Göstər", hideArchive: "Arxivi Gizlət",
        dateCol: "Tarix", durationCol: "Müddət", reasonCol: "Səbəb", emptyArchive: "Arxiv boşdur"
    },
    en: {
        tabPlan: "Plan", tabWorkHours: "Work Hours", tabCrm: "CRM Error",
        plan: "Monthly Plan", doc: "DOC", crm: "CRM", total: "Total", result: "Result", 
        completed: "% Completed", remaining: "% Remaining", bonusCalc: "Bonus Calculation:", 
        targetBtn: "How Much is Left to Target?", targetTitle: "How Much is Left to Target?", 
        backBtn: "Go Back to Main Plan", remDays: "Remaining Days:", totalPlan: "Monthly Plan:",
        currentTotal: "Current Total:", neededAmount: "Needed Amount:", dailyPlanning: "Daily Planning (Based on Current Total)",
        dailyTarget: "Overall Daily Target:", bonusTableTitle: "Daily Plan to Reach Bonus Target",
        targetPercent: "Target Percent", requiredAmount: "Required Amount", earnedEur: "Earnings (EUR)", 
        dailyRequired: "Daily Needed", reached: "Reached", planNotSet: "Monthly plan not set.",
        daysFinished: "All days of this month are over.", placeholder: "Enter total plan",
        calcTitle: "Calculation Type:", calcAllDays: "All Days", calcWorkDays: "Work Days Only", 
        holidaysTitle: "Holidays (Will Not Be Counted as Work Day):", remWorkDays: "Remaining Work Days:",
        settingsTitle: "Calendar and Calculation Settings", 
        whTitle: "Work Hours Calculator", 
        whInfo: "(09:00 - 18:00 / Net daily work: 7.5 hours)", // YENİLƏNDİ
        sickLeave: "Sick Leave (Days)", vacation: "Vacation (Days)", holidayLeave: "Holiday (Days)",
        totalDays: "Total Days in Month:", weekends: "Weekends:", 
        workDays: "Net Work Days:", totalHours: "Total Work Hours:",
        timerTitle: "Error & Break Timer", reasonPlaceholder: "Enter pause reason...",
        startTimerBtn: "Start", stopTimerBtn: "Stop", showArchive: "Show Archive", hideArchive: "Hide Archive",
        dateCol: "Date", durationCol: "Duration", reasonCol: "Reason", emptyArchive: "Archive is empty"
    },
    ru: { 
        tabPlan: "План", tabWorkHours: "Часы", tabCrm: "CRM Ошибка", plan: "Месячный план", doc: "ДОК", crm: "CRM", total: "Итог", result: "Результат", completed: "% Выполнено", remaining: "% Осталось", bonusCalc: "Расчет бонуса:", targetBtn: "Сколько осталось до цели?", targetTitle: "Сколько осталось до цели?", backBtn: "Вернуться к основному плану", remDays: "Осталось дней:", totalPlan: "Месячный план:", currentTotal: "Текущий итог:", neededAmount: "Оставшаяся сумма:", dailyPlanning: "Дневное планирование", dailyTarget: "Дневная цель:", bonusTableTitle: "Дневной план", targetPercent: "Процент", requiredAmount: "Требуемая сумма", earnedEur: "Заработок (EUR)", dailyRequired: "Нужно в день", reached: "Достигнуто", planNotSet: "План не установлен.", daysFinished: "Дни прошли.", placeholder: "Введите план", calcTitle: "Тип расчета:", calcAllDays: "Все Дни", calcWorkDays: "Рабочие Дни", holidaysTitle: "Праздники:", remWorkDays: "Осталось Рабочих Дней:", settingsTitle: "Настройки", 
        whTitle: "Калькулятор Часов", whInfo: "(09:00 - 18:00 / Чистая работа: 7.5 часов)", // YENİLƏNDİ
        sickLeave: "Больничный (Дни)", vacation: "Отпуск (Дни)", holidayLeave: "Праздник (Дни)", totalDays: "Всего дней в месяце:", weekends: "Выходные (Сб/Вс):", workDays: "Чистые рабочие дни:", totalHours: "Итого часов:", timerTitle: "Таймер ошибок", reasonPlaceholder: "Причина остановки...", startTimerBtn: "Старт", stopTimerBtn: "Стоп", showArchive: "Показать архив", hideArchive: "Скрыть архив", dateCol: "Дата", durationCol: "Длительность", reasonCol: "Причина", emptyArchive: "Архив пуст"
    },
    tr: {
        tabPlan: "Plan", tabWorkHours: "Mesai", tabCrm: "CRM Hata", plan: "Aylık Plan", doc: "CRM", crm: "DOC", total: "Toplam", result: "Sonuç", completed: "% Tamamlandı", remaining: "% Kaldı", bonusCalc: "Bonus Hesaplaması:", targetBtn: "Hedefe Ne Kadar Kaldı?", targetTitle: "Hedefe Ne Kadar Kaldı?", backBtn: "Ana Plana Geri Dön", remDays: "Kalan Gün Sayısı:", totalPlan: "Aylık Plan:", currentTotal: "Mevcut Toplam:", neededAmount: "Gereken Miktar:", dailyPlanning: "Günlük Planlama", dailyTarget: "Günlük Hedef:", bonusTableTitle: "Günlük Plan", targetPercent: "Yüzde", requiredAmount: "Gereken Miktar", earnedEur: "Kazanç (EUR)", dailyRequired: "Günlük Gereken", reached: "Ulaşıldı", planNotSet: "Plan ayarlanmadı.", daysFinished: "Günler bitti.", placeholder: "Planı girin", calcTitle: "Hesaplama Türü:", calcAllDays: "Tüm Günler", calcWorkDays: "İş Günleri", holidaysTitle: "Tatiller:", remWorkDays: "Kalan İş Günleri:", settingsTitle: "Ayarlar", 
        whTitle: "Mesai Hesaplayıcı", whInfo: "(09:00 - 18:00 / Net günlük çalışma: 7.5 saat)", // YENİLƏNDİ
        sickLeave: "Hastalık (Gün)", vacation: "İzin (Gün)", holidayLeave: "Tatil (Gün)", totalDays: "Aydaki Toplam Gün:", weekends: "Hafta Sonu (Ct/Pz):", workDays: "Net İş Günü:", totalHours: "Toplam Saat:", timerTitle: "Hata Zamanlayıcısı", reasonPlaceholder: "Durma nedeni...", startTimerBtn: "Başla", stopTimerBtn: "Durdur", showArchive: "Arşivi Göster", hideArchive: "Arşivi Gizle", dateCol: "Tarih", durationCol: "Süre", reasonCol: "Neden", emptyArchive: "Arşiv boş"
    }
};

// ==============================
// 1. ÜMUMİ İDARƏETMƏ (ROUTER)
// ==============================

function switchTab(tabId) {
    currentTab = tabId;
    isTargetView = false; 
    
    document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab_${tabId}`).classList.add('active');
    
    renderApp();
}

function renderApp() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    
    if (currentTab === 'plan') {
        if (isTargetView) renderTargetPage(mainContent);
        else renderMainPlanPage(mainContent);
    } 
    else if (currentTab === 'workhours') {
        renderWorkHoursPage(mainContent);
    } 
    else if (currentTab === 'crm') {
        renderCrmTimerPage(mainContent);
    }
}

// ==============================
// 2. PLAN SƏHİFƏSİ
// ==============================
function renderMainPlanPage(container) {
    const texts = LANGUAGE_DATA[currentLang];
    container.innerHTML = `
        <div class="input-group">
            <div class="header input-row">
                <label for="plan">${texts.plan}</label>
                <input type="number" id="plan" placeholder="${texts.placeholder}" value="${lastPlan || ''}">
            </div>
            <div class="input-row">
                <label for="doc">${texts.doc}</label>
                <input type="number" id="doc" min="0" value="${lastDoc || ''}"> 
            </div>
            <div class="input-row">
                <label for="crm">${texts.crm}</label>
                <input type="number" id="crm" min="0" value="${lastCrm || ''}">
            </div>
        </div>
        <div class="total input-row">
            <label>${texts.total}</label>
            <span id="total_value">0</span>
        </div>
        <div class="percentage">
            <label id="result_label">${texts.result}:</label>
            <div class="input-row"><label></label><div id="percentage_reached">0${texts.completed}</div></div>
            <div class="input-row"><label></label><div id="percentage_left">100${texts.remaining}</div></div>
        </div>
        <div class="final-result">
            <label>${texts.bonusCalc}</label>
            <div class="input-row"><label></label><span id="final_result_value_eur">0.00 EUR</span></div>
            <div class="input-row"><label></label><span id="final_result_value_azn">0.00 AZN</span></div>
        </div>
        <button id="target_button">${texts.targetBtn}</button>
    `;

    document.getElementById('plan').addEventListener('input', savePlanValues);
    document.getElementById('doc').addEventListener('input', savePlanValues);
    document.getElementById('crm').addEventListener('input', savePlanValues);
    document.getElementById('target_button').addEventListener('click', () => { isTargetView = true; renderApp(); });

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
    
    document.getElementById('total_value').textContent = total.toFixed(0);
    document.getElementById('percentage_reached').textContent = `${reachedPercentage.toFixed(1)}${LANGUAGE_DATA[currentLang].completed}`;
    document.getElementById('percentage_reached').style.color = reachedPercentage >= 100 ? '#50fa7b' : '#ff6b6b';
    document.getElementById('percentage_left').textContent = `${Math.max(0, 100 - reachedPercentage).toFixed(1)}${LANGUAGE_DATA[currentLang].remaining}`;
    document.getElementById('percentage_left').style.color = reachedPercentage >= 100 ? '#50fa7b' : '#ff6b6b';
    document.getElementById('final_result_value_eur').textContent = `${finalEur.toFixed(2)} EUR`;
    document.getElementById('final_result_value_azn').textContent = `${(finalEur * EXCHANGE_RATE).toFixed(2)} AZN`;
}

// ==============================
// 2.1 HƏDƏF SƏHİFƏSİ (TARGET)
// ==============================
function renderTargetPage(container) {
    const texts = LANGUAGE_DATA[currentLang];
    const currentTotal = lastDoc + lastCrm;
    const remainingDays = calculateRemainingDays(); 
    const needed = Math.max(0, lastPlan - currentTotal);
    const dailyTarget = (remainingDays > 0 && needed > 0) ? (needed / remainingDays) : 0;

    let tableRows = '';
    if (lastPlan > 0 && remainingDays > 0) {
        BONUS_TARGETS.forEach(pct => {
            const tgtAmt = (lastPlan * pct) / 100;
            const reqDaily = Math.max(0, tgtAmt - currentTotal) / remainingDays;
            const totalEarned = ((BASE_AMOUNT_EUR * (BONUS_PERCENTAGES[pct] || 0)) / 100) + BASE_AMOUNT_EUR;
            const dailyText = currentTotal >= tgtAmt ? `<span style="color: #00eaff;">${texts.reached}</span>` : reqDaily.toFixed(2);
            tableRows += `<tr><td>${pct}%</td><td>${tgtAmt.toFixed(0)}</td><td class="earned-eur">${totalEarned.toFixed(2)} €</td><td class="daily-plan-value">${dailyText}</td></tr>`;
        });
    }

    container.innerHTML = `
        <div class="target-info" style="margin-bottom:15px;">
            <div class="input-row"><strong>${texts.remDays}</strong> <span>${remainingDays}</span></div>
            <div class="input-row"><strong>${texts.currentTotal}</strong> <span>${currentTotal.toFixed(0)}</span></div>
            <div class="input-row"><strong>${texts.dailyTarget}</strong> <span style="color:#00ff00;">${dailyTarget.toFixed(2)}</span></div>
        </div>
        <table id="daily_bonus_targets" style="width:100%; text-align:center; border-collapse: collapse;">
            <thead><tr><th>%</th><th>AMT</th><th>EUR</th><th>Daily</th></tr></thead>
            <tbody>${tableRows}</tbody>
        </table>
        <button id="back_button" style="width:100%; padding:10px; margin-top:15px;">${texts.backBtn}</button>
    `;

    document.getElementById('back_button').addEventListener('click', () => { isTargetView = false; renderApp(); });
}

function calculateRemainingDays() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1;
}

// ==============================
// 3. İŞ SAATİ SƏHİFƏSİ
// ==============================
function renderWorkHoursPage(container) {
    const texts = LANGUAGE_DATA[currentLang];
    
    container.innerHTML = `
        <h3 style="text-align:center;">${texts.whTitle}</h3>
        <p style="text-align:center; font-size: 0.85em; opacity: 0.7; margin-top:-10px;">${texts.whInfo}</p>
        
        <div class="input-group" style="margin-top: 15px;">
            <div class="input-row">
                <label>${texts.sickLeave}</label>
                <input type="number" id="wh_sick" min="0" value="${sickDays}">
            </div>
            <div class="input-row">
                <label>${texts.vacation}</label>
                <input type="number" id="wh_vac" min="0" value="${vacDays}">
            </div>
            <div class="input-row">
                <label>${texts.holidayLeave}</label>
                <input type="number" id="wh_hol" min="0" value="${holDays}">
            </div>
        </div>

        <div class="info target-info" style="margin-top: 15px;">
            <div class="input-row"><strong>${texts.totalDays}</strong> <span id="res_totalDays">0</span></div>
            <div class="input-row"><strong>${texts.weekends}</strong> <span id="res_weekends">0</span></div>
            <div class="input-row" style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 5px;">
                <strong>${texts.workDays}</strong> <span id="res_workDays" style="color:#00eaff;">0</span>
            </div>
            <div class="input-row" style="font-size: 1.2em; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 5px;">
                <strong>${texts.totalHours}</strong> <span id="res_totalHours" style="color:#50fa7b; font-weight:bold;">0</span>
            </div>
        </div>
    `;

    ['wh_sick', 'wh_vac', 'wh_hol'].forEach(id => {
        document.getElementById(id).addEventListener('input', calculateWorkHours);
    });

    calculateWorkHours();
}

function calculateWorkHours() {
    sickDays = parseInt(document.getElementById('wh_sick').value) || 0;
    vacDays = parseInt(document.getElementById('wh_vac').value) || 0;
    holDays = parseInt(document.getElementById('wh_hol').value) || 0;

    localStorage.setItem('wh_sick', sickDays);
    localStorage.setItem('wh_vac', vacDays);
    localStorage.setItem('wh_hol', holDays);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    
    let weekends = 0;
    for(let i = 1; i <= totalDaysInMonth; i++) {
        const day = new Date(year, month, i).getDay();
        if(day === 0 || day === 6) weekends++;
    }

    const maxWorkDays = totalDaysInMonth - weekends;
    const deductedDays = sickDays + vacDays + holDays;
    const actualWorkDays = Math.max(0, maxWorkDays - deductedDays);
    
    // Gündəlik xalis iş saatı 7.5 olaraq YENİLƏNDİ
    const totalWorkHours = actualWorkDays * 7.5; 

    document.getElementById('res_totalDays').textContent = totalDaysInMonth;
    document.getElementById('res_weekends').textContent = weekends;
    document.getElementById('res_workDays').textContent = actualWorkDays;
    document.getElementById('res_totalHours').textContent = totalWorkHours.toFixed(1);
}

// ==============================
// 4. CRM XƏTA (TAYMER) SƏHİFƏSİ
// ==============================
function renderCrmTimerPage(container) {
    const texts = LANGUAGE_DATA[currentLang];
    
    container.innerHTML = `
        <h3 style="text-align: center;">${texts.timerTitle}</h3>
        <div class="timer-section input-group" style="padding: 20px 10px; text-align:center;">
            <div class="timer-display" id="timer_display" style="font-size:3em; margin-bottom:20px;">
                ${formatTime(timerSeconds)}
            </div>
            <input type="text" id="pause_reason" placeholder="${texts.reasonPlaceholder}" style="width:100%; padding: 10px; margin-bottom:15px; border-radius: 4px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.3); color:white; box-sizing: border-box;">
            
            <div style="display: flex; gap: 10px;">
                <button id="start_timer_btn" style="flex:1; background: #28a745; color: white; padding: 12px; font-weight: bold; border-radius: 4px; cursor: pointer;">${texts.startTimerBtn}</button>
                <button id="stop_timer_btn" style="flex:1; background: #dc3545; color: white; padding: 12px; font-weight: bold; border-radius: 4px; cursor: pointer;" ${timerInterval ? '' : 'disabled'}>${texts.stopTimerBtn}</button>
            </div>
        </div>

        <button id="toggle_archive_btn" style="width: 100%; padding: 10px; margin-top: 20px; background: transparent; color: var(--primary-color); border: 1px dashed var(--primary-color); cursor: pointer;">
            ${isArchiveVisible ? texts.hideArchive : texts.showArchive}
        </button>
        
        <div id="archive_section" style="display: ${isArchiveVisible ? 'block' : 'none'}; margin-top: 10px; max-height: 250px; overflow-y: auto;">
            <table id="archive_table" style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                <thead><tr><th>${texts.dateCol}</th><th>${texts.durationCol}</th><th>${texts.reasonCol}</th></tr></thead>
                <tbody id="archive_body"></tbody>
            </table>
        </div>
    `;

    document.getElementById('start_timer_btn').addEventListener('click', startTimer);
    document.getElementById('stop_timer_btn').addEventListener('click', stopTimer);
    document.getElementById('toggle_archive_btn').addEventListener('click', toggleArchive);
    
    if(timerInterval) document.getElementById('start_timer_btn').disabled = true;

    if (isArchiveVisible) renderArchiveList();
}

function formatTime(totalSeconds) {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function startTimer() {
    if (timerInterval) return;
    
    const startBtn = document.getElementById('start_timer_btn');
    if(startBtn) {
        startBtn.disabled = true;
        document.getElementById('stop_timer_btn').disabled = false;
    }
    
    timerInterval = setInterval(() => {
        timerSeconds++;
        const display = document.getElementById('timer_display');
        if(display) display.textContent = formatTime(timerSeconds); 
    }, 1000);
}

function stopTimer() {
    if (!timerInterval) return;
    clearInterval(timerInterval);
    timerInterval = null;
    
    const reasonInput = document.getElementById('pause_reason');
    const reason = reasonInput ? reasonInput.value.trim() || "-" : "-";
    
    if (timerSeconds > 0) {
        archiveData.push({ date: new Date().toLocaleString(currentLang), duration: formatTime(timerSeconds), reason: reason });
        localStorage.setItem('timerArchive', JSON.stringify(archiveData));
    }
    
    timerSeconds = 0;
    
    if (document.getElementById('timer_display')) {
        document.getElementById('timer_display').textContent = "00:00:00";
        if (reasonInput) reasonInput.value = "";
        document.getElementById('start_timer_btn').disabled = false;
        document.getElementById('stop_timer_btn').disabled = true;
        if(isArchiveVisible) renderArchiveList();
    }
}

function toggleArchive() {
    isArchiveVisible = !isArchiveVisible;
    renderApp(); 
}

function renderArchiveList() {
    const tbody = document.getElementById('archive_body');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (archiveData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">${LANGUAGE_DATA[currentLang].emptyArchive}</td></tr>`;
        return;
    }
    [...archiveData].reverse().forEach(item => {
        tbody.innerHTML += `<tr><td style="font-size:0.8em;opacity:0.8;">${item.date}</td><td style="font-weight:bold;color:#ff6b6b;">${item.duration}</td><td>${item.reason}</td></tr>`;
    });
}

// ==============================
// 5. İLK YÜKLƏMƏ VƏ DİL
// ==============================
document.addEventListener('DOMContentLoaded', () => {
    currentLang = localStorage.getItem('language') || 'az';
    lastPlan = parseFloat(localStorage.getItem('plan')) || 0;
    lastDoc = parseFloat(localStorage.getItem('doc')) || 0;
    lastCrm = parseFloat(localStorage.getItem('crm')) || 0;
    
    sickDays = parseInt(localStorage.getItem('wh_sick')) || 0;
    vacDays = parseInt(localStorage.getItem('wh_vac')) || 0;
    holDays = parseInt(localStorage.getItem('wh_hol')) || 0;
    
    archiveData = JSON.parse(localStorage.getItem('timerArchive')) || [];

    document.querySelectorAll('.tab-link').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.getAttribute('data-target')));
    });

    document.querySelectorAll('.lang-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentLang = e.target.getAttribute('data-lang');
            localStorage.setItem('language', currentLang);
            document.querySelectorAll('.lang-button').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateTabTexts();
            renderApp();
        });
    });

    document.getElementById(`lang-${currentLang}`).classList.add('active');
    updateTabTexts();
    renderApp();
});

function updateTabTexts() {
    const txt = LANGUAGE_DATA[currentLang];
    document.getElementById('tab_plan').textContent = txt.tabPlan;
    document.getElementById('tab_workhours').textContent = txt.tabWorkHours;
    document.getElementById('tab_crm').textContent = txt.tabCrm;
}