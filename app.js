// ===== Global Data =====
const DEFAULT_CATEGORY_GROUPS = {
    rent: 'fixed',
    utilities: 'fixed',
    phoneBill: 'fixed',
    groceries: 'everyday',
    transportation: 'everyday',
    misc: 'everyday',
    savings: 'goals',
    investments: 'goals'
};

function freshAppData() {
    return {
        budgetProfile: null,
        expensesProfile: null,
        transactionLog: [],
        recurringPayments: [],
        categoryGroups: { ...DEFAULT_CATEGORY_GROUPS }
    };
}

let appData = freshAppData();
let currentUser = null;

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    setupAuthStateListener();
});

// ===== Firebase Auth State Listener =====
function setupAuthStateListener() {
    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        if (user) {
            document.getElementById('currentUserEmail').textContent = user.email;
            await loadAllDataFromFirestore();
            checkAuthStatus();
        } else {
            appData = freshAppData();
            inputDrafts = { budgetInputs: null, expensesInputs: null };
            showScreen('loginScreen');
        }
    });
}

// ===== Screen Management =====
function handleBudgetScreenBack() {
    // If a full profile already exists, this screen was reached via
    // Settings → "Edit Income & Expenses", so go back to the dashboard.
    // Otherwise this is first-time setup, so back means logging out.
    if (appData.budgetProfile && appData.expensesProfile) {
        showScreen('dashboardScreen');
    } else {
        handleLogout();
    }
}

function showScreen(screenId) {
    // save drafts before leaving input screens
    if (document.getElementById('budgetInputsScreen')?.classList.contains('active')) {
        saveDraftFromBudgetInputs();
    }
    if (document.getElementById('expensesInputsScreen')?.classList.contains('active')) {
        saveDraftFromExpensesInputs();
    }

    // restore drafts when navigating back
    if (screenId === 'budgetInputsScreen') {
        restoreDraftToBudgetInputs();
        const label = document.getElementById('budgetBackLabel');
        if (label) {
            const hasFullProfile = !!(appData.budgetProfile && appData.expensesProfile);
            label.textContent = hasFullProfile ? 'Dashboard' : 'Logout';
        }
    }
    if (screenId === 'expensesInputsScreen') restoreDraftToExpensesInputs();

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}


// ===== Drafts (to preserve input when navigating back) =====
let inputDrafts = {
    budgetInputs: null,
    expensesInputs: null
};

function saveDraftFromBudgetInputs() {
    inputDrafts.budgetInputs = {
        grossIncome: document.getElementById('grossIncome')?.value,
        fedTax: document.getElementById('fedTax')?.value,
        provTax: document.getElementById('provTax')?.value,
        cpp: document.getElementById('cpp')?.value,
        ei: document.getElementById('ei')?.value,
        customDeductions: Array.from(document.querySelectorAll('#customDeductionsContainer .custom-row')).map(row => ({
            label: row.querySelector('[data-field="label"]')?.value,
            value: row.querySelector('[data-field="value"]')?.value
        }))
    };
}

function restoreDraftToBudgetInputs() {
    // Prefer an in-session draft; otherwise fall back to the saved profile
    // (this is what was missing — going back previously showed blank fields
    // even though a profile had already been saved to Firestore).
    let d = inputDrafts.budgetInputs;
    if (!d && appData.budgetProfile) {
        const p = appData.budgetProfile;
        d = {
            grossIncome: p.monthlyGross,
            fedTax: p.deductions?.fedTax,
            provTax: p.deductions?.provTax,
            cpp: p.deductions?.cpp,
            ei: p.deductions?.ei,
            customDeductions: p.customDeductions || []
        };
    }
    if (!d) d = {};

    document.getElementById('grossIncome').value = d.grossIncome ?? '';
    document.getElementById('fedTax').value      = d.fedTax ?? '';
    document.getElementById('provTax').value     = d.provTax ?? '';
    document.getElementById('cpp').value         = d.cpp ?? '';
    document.getElementById('ei').value          = d.ei ?? '';

    const container = document.getElementById('customDeductionsContainer');
    if (!container) return;
    container.innerHTML = '';
    (d.customDeductions || []).forEach(item => {
        const id = Date.now() + Math.floor(Math.random()*1000);
        container.insertAdjacentHTML('beforeend', `
            <div class="custom-row" id="deduction-${id}">
                <input type="text" class="form-input custom-label-input" placeholder="e.g. Health / RRSP" data-id="${id}" data-field="label" value="${item.label ?? ''}">
                <input type="number" class="form-input custom-value-input" placeholder="$ Amount" data-id="${id}" data-field="value" value="${item.value ?? ''}">
                <button class="delete-button" onclick="removeCustomDeduction(${id})">✕</button>
            </div>
        `);
    });

    // capture this as the active draft so further nav is consistent
    saveDraftFromBudgetInputs();
}

function saveDraftFromExpensesInputs() {
    inputDrafts.expensesInputs = {
        rent: document.getElementById('rent')?.value,
        groceries: document.getElementById('groceries')?.value,
        utilities: document.getElementById('utilities')?.value,
        phoneBill: document.getElementById('phoneBill')?.value,
        transportation: document.getElementById('transportation')?.value,
        savings: document.getElementById('savings')?.value,
        investments: document.getElementById('investments')?.value,
        misc: document.getElementById('misc')?.value,
        customExpenses: Array.from(document.querySelectorAll('#customExpensesContainer .custom-row')).map(row => ({
            label: row.querySelector('[data-field="label"]')?.value,
            value: row.querySelector('[data-field="value"]')?.value
        }))
    };
}

function restoreDraftToExpensesInputs() {
    let d = inputDrafts.expensesInputs;
    if (!d && appData.expensesProfile) {
        const p = appData.expensesProfile;
        d = {
            rent: p.rent, groceries: p.groceries, utilities: p.utilities,
            phoneBill: p.phoneBill, transportation: p.transportation,
            savings: p.savings, investments: p.investments, misc: p.misc,
            customExpenses: p.customExpenses || []
        };
    }
    if (!d) d = {};

    document.getElementById('rent').value = d.rent ?? '';
    document.getElementById('groceries').value = d.groceries ?? '';
    document.getElementById('utilities').value = d.utilities ?? '';
    document.getElementById('phoneBill').value = d.phoneBill ?? '';
    document.getElementById('transportation').value = d.transportation ?? '';
    document.getElementById('savings').value = d.savings ?? '';
    document.getElementById('investments').value = d.investments ?? '';
    document.getElementById('misc').value = d.misc ?? '';

    const container = document.getElementById('customExpensesContainer');
    if (!container) return;
    container.innerHTML = '';
    (d.customExpenses || []).forEach(item => {
        const id = Date.now() + Math.floor(Math.random()*1000);
        container.insertAdjacentHTML('beforeend', `
            <div class="custom-row" id="expense-${id}">
                <input type="text" class="form-input custom-label-input" placeholder="e.g. Gym membership" data-id="${id}" data-field="label" value="${item.label ?? ''}">
                <input type="number" class="form-input custom-value-input" placeholder="$ Amount" data-id="${id}" data-field="value" value="${item.value ?? ''}">
                <button class="delete-button" onclick="removeCustomExpense(${id})">✕</button>
            </div>
        `);
    });

    saveDraftFromExpensesInputs();
}


function toggleMenu() {
    // Placeholder — reserved for future side menu
}

// ===== Authentication =====
function checkAuthStatus() {
    if (!currentUser) { showScreen('loginScreen'); return; }

    if (!appData.budgetProfile) {
        showScreen('budgetInputsScreen');
    } else if (!appData.expensesProfile) {
        showScreen('expensesInputsScreen');
        displayAvailableBudgetSpace();
    } else {
        showScreen('dashboardScreen');
        updateDashboard();
    }
}

async function handleGoogleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        if (error.code === 'auth/popup-blocked') {
            alert('Pop-up blocked. Please enable pop-ups for this site and try again.');
        } else if (error.code !== 'auth/popup-closed-by-user') {
            alert('Sign-in failed: ' + error.message);
        }
    }
}

// ===== Budget Inputs Screen =====
async function saveBudgetInputs() {
    saveDraftFromBudgetInputs();
    const gross   = parseFloat(document.getElementById('grossIncome').value) || 0;
    const fedTax  = parseFloat(document.getElementById('fedTax').value)      || 0;
    const provTax = parseFloat(document.getElementById('provTax').value)     || 0;
    const cpp     = parseFloat(document.getElementById('cpp').value)         || 0;
    const ei      = parseFloat(document.getElementById('ei').value)          || 0;

    if (!gross) {
        alert('Please enter your gross monthly income to continue.');
        return;
    }

    const customDeductions    = getCustomDeductionsValues();
    const totalCustom         = customDeductions.reduce((s, d) => s + (parseFloat(d.value) || 0), 0);
    const totalDeductions     = fedTax + provTax + cpp + ei + totalCustom;
    const netIncome           = gross - totalDeductions;

    appData.budgetProfile = {
        monthlyGross:     gross.toFixed(2),
        monthlyNet:       netIncome.toFixed(2),
        totalDeductions:  totalDeductions.toFixed(2),
        deductions:       { fedTax, provTax, cpp, ei },
        customDeductions,
        updatedAt:        new Date().toISOString()
    };

    await saveBudgetToFirestore();
    showScreen('expensesInputsScreen');
    displayAvailableBudgetSpace();
}

function addCustomDeduction() {
    const container = document.getElementById('customDeductionsContainer');
    const id = Date.now();
    container.insertAdjacentHTML('beforeend', `
        <div class="custom-row" id="deduction-${id}">
            <input type="text"   class="form-input custom-label-input" placeholder="e.g. Health / RRSP"
                   data-id="${id}" data-field="label">
            <input type="number" class="form-input custom-value-input" placeholder="$ Amount"
                   data-id="${id}" data-field="value">
            <button class="delete-button" onclick="removeCustomDeduction(${id})">✕</button>
        </div>
    `);
}

function removeCustomDeduction(id) {
    const el = document.getElementById(`deduction-${id}`);
    if (el) el.remove();
}

function getCustomDeductionsValues() {
    return Array.from(
        document.querySelectorAll('#customDeductionsContainer .custom-row')
    ).map(row => ({
        label: row.querySelector('[data-field="label"]').value,
        value: row.querySelector('[data-field="value"]').value
    })).filter(d => d.label && d.value);
}

// ===== Expenses Inputs Screen =====
function displayAvailableBudgetSpace() {
    if (appData.budgetProfile) {
        const net = parseFloat(appData.budgetProfile.monthlyNet);
        document.getElementById('availableBudgetSpace').textContent = formatMoney(net);
    }
}

async function saveExpenseInputs() {
    saveDraftFromExpensesInputs();
    const expenses = {
        rent:           parseFloat(document.getElementById('rent').value)           || 0,
        groceries:      parseFloat(document.getElementById('groceries').value)      || 0,
        utilities:      parseFloat(document.getElementById('utilities').value)      || 0,
        phoneBill:      parseFloat(document.getElementById('phoneBill').value)      || 0,
        transportation: parseFloat(document.getElementById('transportation').value) || 0,
        savings:        parseFloat(document.getElementById('savings').value)        || 0,
        investments:    parseFloat(document.getElementById('investments').value)    || 0,
        misc:           parseFloat(document.getElementById('misc').value)           || 0
    };

    const customExpenses  = getCustomExpensesValues();
    const totalCustom     = customExpenses.reduce((s, e) => s + (parseFloat(e.value) || 0), 0);
    const totalExpenses   = Object.values(expenses).reduce((a, b) => a + b, 0) + totalCustom;
    const netIncome       = parseFloat(appData.budgetProfile.monthlyNet);

    if (totalExpenses > netIncome) {
        alert(`Your total targets ($${totalExpenses.toFixed(2)}) exceed your net income ($${netIncome.toFixed(2)}). Please reduce your targets by $${(totalExpenses - netIncome).toFixed(2)}.`);
        return;
    }

    appData.expensesProfile = {
        ...expenses,
        totalExpenses: totalExpenses.toFixed(2),
        customExpenses,
        updatedAt: new Date().toISOString()
    };

    await saveExpensesToFirestore();
    showScreen('dashboardScreen');
    updateDashboard();
}

function addCustomExpense() {
    const container = document.getElementById('customExpensesContainer');
    const id = Date.now();
    container.insertAdjacentHTML('beforeend', `
        <div class="custom-row" id="expense-${id}">
            <input type="text"   class="form-input custom-label-input" placeholder="e.g. Gym membership"
                   data-id="${id}" data-field="label">
            <input type="number" class="form-input custom-value-input" placeholder="$ Amount"
                   data-id="${id}" data-field="value">
            <button class="delete-button" onclick="removeCustomExpense(${id})">✕</button>
        </div>
    `);
}

function removeCustomExpense(id) {
    const el = document.getElementById(`expense-${id}`);
    if (el) el.remove();
}

function getCustomExpensesValues() {
    return Array.from(
        document.querySelectorAll('#customExpensesContainer .custom-row')
    ).map(row => ({
        label: row.querySelector('[data-field="label"]').value,
        value: row.querySelector('[data-field="value"]').value
    })).filter(e => e.label && e.value);
}

// ===== Dashboard =====
function updateDashboard() {
    if (!appData.budgetProfile || !appData.expensesProfile) return;

    const netIncome       = parseFloat(appData.budgetProfile.monthlyNet);
    const plannedExpenses = parseFloat(appData.expensesProfile.totalExpenses);
    const totalSpent      = appData.transactionLog.reduce((s, tx) => s + tx.amount, 0);
    const walletRemaining = netIncome - totalSpent;

    document.getElementById('netIncome').textContent       = formatMoney(netIncome);
    document.getElementById('plannedExpenses').textContent = formatMoney(plannedExpenses);
    document.getElementById('totalSpent').textContent      = formatMoney(totalSpent);

    const walletEl = document.getElementById('walletRemaining');
    walletEl.textContent = formatMoney(walletRemaining);
    walletEl.className   = 'summary-amount' + (walletRemaining < 0 ? ' negative' : '');

    renderBudgetGroups();
    renderTransactionLog();
    populateLogCategorySelect();

    // Keep the spending chart in sync if it's currently visible
    if (document.getElementById('dashboardSpendingChartView')?.classList.contains('active')) {
        renderSpendingChart();
    }
}

function renderBudgetGroups() {
    const container = document.getElementById('budgetGroupsContainer');

    const EXCLUDED_KEYS = new Set(['totalExpenses', 'customExpenses', 'updatedAt', 'savedAt']);

    const categoryMeta = {
        rent:           { label: 'Rent / Mortgage',    icon: '🏠', color: '#00adb5' },
        groceries:      { label: 'Groceries',          icon: '🛒', color: '#ff9500' },
        utilities:      { label: 'Utilities',          icon: '⚡', color: '#af52de' },
        phoneBill:      { label: 'Phone Bill',         icon: '📱', color: '#007aff' },
        savings:        { label: 'Savings Target',     icon: '🐷', color: '#30d158' },
        investments:    { label: 'Investments',        icon: '📈', color: '#5856d6' },
        misc:           { label: 'Miscellaneous',      icon: '🌀', color: '#8e8e93' },
        transportation: { label: 'Transit / Gas',      icon: '🚗', color: '#ff2d55' }
    };

    const groupTitles = {
        fixed:    { title: 'Fixed Bills',       subtitle: 'Rent, insurance, and recurring obligations' },
        everyday: { title: 'Everyday Spending', subtitle: 'Flexible monthly costs you track often' },
        goals:    { title: 'Financial Goals',   subtitle: 'Savings and structural active assets' },
        custom:   { title: 'Custom Expenses',   subtitle: 'Additional personalized configurations' }
    };

    // Build per-key actual spend map
    const actualSpend = {};
    appData.transactionLog.forEach(tx => {
        actualSpend[tx.key] = (actualSpend[tx.key] || 0) + tx.amount;
    });

    // Build groups
    const groups = {};
    Object.keys(appData.expensesProfile).forEach(key => {
        if (EXCLUDED_KEYS.has(key)) return;
        const groupKey = (appData.categoryGroups && appData.categoryGroups[key]) || 'custom';
        if (!groups[groupKey]) {
            groups[groupKey] = { items: [], planned: 0, spent: 0 };
        }
        const target = parseFloat(appData.expensesProfile[key]) || 0;
        if (target <= 0) return; // skip zero-value categories
        const actual = actualSpend[key] || 0;
        const meta   = categoryMeta[key] || { label: key, icon: '📦', color: '#8e8e93' };
        groups[groupKey].items.push({ key, ...meta, target, actual });
        groups[groupKey].planned += target;
        groups[groupKey].spent   += actual;
    });

    // Custom expenses from customExpenses array
    const customExpenses = appData.expensesProfile.customExpenses || [];
    const customColors   = ['#ff3b30', '#4cd964', '#007aff', '#ff2d55', '#5856d6', '#ff6b35'];
    const customIcons    = ['💳', '🎮', '🏋️', '🎬', '🛍️', '💇'];
    customExpenses.forEach((item, i) => {
        const target = parseFloat(item.value) || 0;
        if (!item.label || target <= 0) return;
        if (!groups['custom']) groups['custom'] = { items: [], planned: 0, spent: 0 };
        const actual = actualSpend[item.label] || 0;
        groups['custom'].items.push({
            key:    item.label,
            label:  item.label,
            icon:   customIcons[i % customIcons.length],
            color:  customColors[i % customColors.length],
            target,
            actual
        });
        groups['custom'].planned += target;
        groups['custom'].spent   += actual;
    });

    if (Object.keys(groups).length === 0) {
        container.innerHTML = '<p class="empty-state">No budget categories configured.</p>';
        return;
    }

    // Render in a consistent order
    const ORDER = ['fixed', 'everyday', 'goals', 'custom'];
    let html = '';

    ORDER.forEach(groupKey => {
        const group = groups[groupKey];
        if (!group || group.items.length === 0) return;
        const titles = groupTitles[groupKey] || { title: groupKey, subtitle: '' };

        html += `
        <div class="budget-group">
            <div class="group-header">
                <h3 class="group-title">${titles.title}</h3>
                <p class="group-subtitle">${titles.subtitle}</p>
                <div class="group-stats">
                    <span>Planned: <strong>${formatMoney(group.planned)}</strong></span>
                    <span>Spent: <strong>${formatMoney(group.spent)}</strong></span>
                    <span>Left: <strong>${formatMoney(group.planned - group.spent)}</strong></span>
                </div>
            </div>`;

        group.items.forEach(item => {
            const pct        = item.target > 0 ? Math.min((item.actual / item.target) * 100, 100) : 0;
            const remaining  = item.target - item.actual;
            const overBudget = remaining < 0;
            const barColor   = overBudget ? 'var(--danger)' : item.color;
            const recurringTag = isRecurring(item.key) ? '<span class="budget-recurring-badge">🔁 Recurring</span>' : '';

            html += `
            <div class="budget-item" role="button" tabindex="0" data-budget-key="${item.key}" onclick="openLogModal('${item.key}')" onkeydown="if(event.key==='Enter'||event.key===' '){openLogModal('${item.key}');}">
                <div class="budget-item-top">
                    <div class="budget-item-left">
                        <span class="budget-icon-badge" style="background:${item.color}26;">${item.icon}</span>
                        <span class="budget-name">${item.label} ${recurringTag}</span>
                    </div>
                    <div class="budget-values">
                        <div class="budget-actual">${formatMoney(item.actual)} / ${formatMoney(item.target)}</div>
                        <div class="budget-percent" style="color: ${barColor}">${pct.toFixed(0)}% used</div>
                    </div>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${pct}%; background: ${barColor};"></div>
                </div>
            </div>`;
        });

        html += `</div>`;
    });

    container.innerHTML = html;
}

function computeCategoryPlannedActual() {
    const planned = {};

    if (appData && appData.expensesProfile) {
        // planned fixed/everyday/goals keys
        Object.keys(appData.expensesProfile).forEach(key => {
            if (['totalExpenses', 'customExpenses', 'updatedAt', 'savedAt'].includes(key)) return;
            const v = parseFloat(appData.expensesProfile[key]);
            if (!Number.isFinite(v) || v <= 0) return;
            planned[key] = v;
        });

        // planned custom keys by user label
        const custom = appData.expensesProfile.customExpenses || [];
        custom.forEach(item => {
            const v = parseFloat(item.value);
            if (!item.label || !Number.isFinite(v) || v <= 0) return;
            planned[item.label] = v;
        });
    }

    const actual = {};
    (appData.transactionLog || []).forEach(tx => {
        const amt = parseFloat(tx.amount);
        if (!Number.isFinite(amt) || amt <= 0) return;
        actual[tx.key] = (actual[tx.key] || 0) + amt;
    });

    // unify labels (planned keys + actual keys)
    const keys = Array.from(new Set([...Object.keys(planned), ...Object.keys(actual)]));

    // meta (icon/colors) for known keys
    const metaByKey = {
        rent:           { icon: '🏠', color: '#00adb5' },
        groceries:      { icon: '🛒', color: '#ff9500' },
        utilities:      { icon: '⚡', color: '#af52de' },
        phoneBill:      { icon: '📱', color: '#007aff' },
        transportation: { icon: '🚗', color: '#ff2d55' },
        savings:        { icon: '🐷', color: '#30d158' },
        investments:    { icon: '📈', color: '#5856d6' },
        misc:           { icon: '🌀', color: '#8e8e93' }
    };

    return keys
        .map(key => ({
            key,
            label: key,
            planned: planned[key] || 0,
            actual: actual[key] || 0,
            icon: metaByKey[key]?.icon || '📦',
            color: metaByKey[key]?.color || '#8e8e93'
        }))
        .sort((a, b) => (b.actual + b.planned) - (a.actual + a.planned));
}

function renderSpendingChart() {
    const plannedRingEl = document.getElementById('chartPlannedRing');
    const actualRingEl  = document.getElementById('chartActualRing');
    const legendEl      = document.getElementById('spendingChartLegend');
    const centerEl       = document.getElementById('chartCenterLabel');

    if (!plannedRingEl || !actualRingEl || !legendEl) return;

    legendEl.innerHTML = '';

    const categories = computeCategoryPlannedActual().filter(c => c.planned > 0 || c.actual > 0);
    const totalPlanned = categories.reduce((s, c) => s + c.planned, 0);
    const totalActual  = categories.reduce((s, c) => s + c.actual, 0);

    // ----- Outer ring: each category's slice of the PLANNED goal pie -----
    // Slice size = that category's share of total planned spend.
    // This stays fixed all month — it's the "goal" map.
    let acc = 0;
    const sliceParts = [];
    categories.forEach(c => {
        if (c.planned <= 0) return;
        const pct = c.planned / (totalPlanned || 1);
        const start = acc * 100;
        const end = (acc + pct) * 100;
        sliceParts.push(`${c.color} ${start}%, ${c.color} ${end}%`);
        acc += pct;
    });
    plannedRingEl.style.background = sliceParts.length
        ? `conic-gradient(from 270deg, ${sliceParts.join(', ')})`
        : 'conic-gradient(from 270deg, rgba(255,255,255,0.06) 0% 100%)';

    // ----- Inner fill ring: same slice layout, but each slice is only
    // "filled" (opaque) up to how much of ITS OWN goal has been spent.
    // The unfilled remainder of each slice fades to transparent so the
    // dimmer outer ring goal-color shows through — a literal fill gauge. -----
    acc = 0;
    const fillParts = [];
    categories.forEach(c => {
        if (c.planned <= 0) return;
        const pct = c.planned / (totalPlanned || 1);
        const start = acc * 100;
        const fillRatio = Math.min(c.actual / c.planned, 1);
        const filledEnd = acc + pct * fillRatio;
        const end = acc + pct;
        if (fillRatio > 0) {
            fillParts.push(`${c.color} ${start}%, ${c.color} ${filledEnd * 100}%`);
        }
        fillParts.push(`transparent ${filledEnd * 100}%, transparent ${end * 100}%`);
        acc += pct;
    });
    actualRingEl.style.background = fillParts.length
        ? `conic-gradient(from 270deg, ${fillParts.join(', ')})`
        : 'conic-gradient(from 270deg, transparent 0% 100%)';

    if (centerEl) {
        const overallPct = totalPlanned > 0 ? Math.min((totalActual / totalPlanned) * 100, 999) : 0;
        centerEl.innerHTML = `
            <div class="chart-center-pct">${overallPct.toFixed(0)}%</div>
            <div class="chart-center-label">of goal spent</div>
        `;
    }

    // Legend: one row per category, with its own mini fill-to-goal bar
    categories.forEach(c => {
        const plannedText = formatMoney(c.planned);
        const actualText  = formatMoney(c.actual);
        const fillPct = c.planned > 0 ? Math.min((c.actual / c.planned) * 100, 100) : (c.actual > 0 ? 100 : 0);
        const over = c.planned > 0 && c.actual > c.planned;
        const barColor = over ? 'var(--danger)' : c.color;
        const recurringTag = isRecurring(c.key) ? '<span class="legend-recurring">🔁</span>' : '';

        legendEl.insertAdjacentHTML('beforeend', `
            <button class="legend-row" onclick="openLogModal('${c.key}')">
                <span class="legend-swatch" style="background:${c.color}"></span>
                <span class="legend-main">
                    <span class="legend-top-row">
                        <span class="legend-label">${c.icon} ${c.label} ${recurringTag}</span>
                        <span class="legend-pct" style="color:${barColor}">${fillPct.toFixed(0)}%</span>
                    </span>
                    <div class="legend-mini-bar"><div class="legend-mini-fill" style="width:${fillPct}%; background:${barColor};"></div></div>
                    <span class="legend-amounts-row">
                        <span class="legend-actual-val">${actualText} spent</span>
                        <span class="legend-planned-val">of ${plannedText} goal</span>
                    </span>
                </span>
            </button>
        `);
    });

    if (categories.length === 0) {
        legendEl.innerHTML = '<p class="empty-state">Set up your budget targets to see this chart.</p>';
    }
}

function showDashboardTab(tabId) {
    document.getElementById('dashboardBudgetView')?.classList.toggle('active', tabId === 'budgetView');
    document.getElementById('dashboardSpendingChartView')?.classList.toggle('active', tabId === 'spendingChart');

    document.getElementById('tabBudgetView')?.classList.toggle('active', tabId === 'budgetView');
    document.getElementById('tabSpendingChart')?.classList.toggle('active', tabId === 'spendingChart');

    // rerender chart when switching to chart view
    if (tabId === 'spendingChart') renderSpendingChart();
}


function renderTransactionLog() {
    const container = document.getElementById('transactionLogContainer');

    if (appData.transactionLog.length === 0) {
        container.innerHTML = '<p class="empty-state">No transactions logged yet.</p>';
        return;
    }

    const icons = {
        rent: '🏠', groceries: '🛒', utilities: '⚡', phoneBill: '📱',
        savings: '🐷', investments: '📈', misc: '🌀', transportation: '🚗'
    };
    const labels = {
        rent: 'Rent', groceries: 'Groceries', utilities: 'Utilities', phoneBill: 'Phone Bill',
        savings: 'Savings', investments: 'Investments', misc: 'Misc', transportation: 'Transit / Gas'
    };

    let html = '';
    // show newest first, but keep stable indices for delete
    const reversed = appData.transactionLog.slice().reverse();
    reversed.forEach((tx) => {
        const txIndex = appData.transactionLog.indexOf(tx);
        const date = new Date(tx.date || tx.timestamp).toLocaleDateString('en-CA', {
            month: 'short', day: 'numeric'
        });
        const recurringTag = tx.recurring ? '<span class="budget-recurring-badge">🔁 Recurring</span>' : '';

        html += `
        <div class="transaction-item">
            <div class="transaction-icon-badge">${icons[tx.key] || '📦'}</div>
            <div class="transaction-info">
                <div class="transaction-category">${labels[tx.key] || tx.key} ${recurringTag}</div>
                <div class="transaction-meta">${tx.note || 'No note'} · ${date}</div>
            </div>
            <div class="transaction-actions">
                <div class="transaction-amount">−${formatMoney(tx.amount)}</div>
                <button class="tx-delete-btn" type="button" onclick="deleteTransaction(${txIndex})" aria-label="Delete transaction">🗑️</button>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

let logModalRecurringState = false;

function openLogModal(categoryValue = '') {
    // ensure select options are populated
    populateLogCategorySelect();

    if (categoryValue) {
        document.getElementById('logCategory').value = categoryValue;
    } else {
        document.getElementById('logCategory').value = '';
    }

    logModalRecurringState = categoryValue ? isRecurring(categoryValue) : false;
    renderRecurringToggle();

    document.getElementById('logSpendingModal').classList.add('active');
}

function closeLogModal() {
    document.getElementById('logSpendingModal').classList.remove('active');
    document.getElementById('logCategory').value = '';
    document.getElementById('logAmount').value   = '';
    document.getElementById('logNote').value     = '';
    logModalRecurringState = false;
}

function onLogCategoryChange() {
    const category = document.getElementById('logCategory').value;
    logModalRecurringState = category ? isRecurring(category) : false;
    renderRecurringToggle();
}

function toggleRecurringInModal() {
    const category = document.getElementById('logCategory').value;
    if (!category) {
        alert('Please choose a category first.');
        return;
    }
    logModalRecurringState = !logModalRecurringState;
    renderRecurringToggle();
}

function renderRecurringToggle() {
    const btn = document.getElementById('recurringToggleBtn');
    if (!btn) return;
    btn.classList.toggle('is-active', logModalRecurringState);
    btn.innerHTML = logModalRecurringState
        ? `<span class="recurring-icon">🔁</span>
           <span class="recurring-text">
               <span class="recurring-title">Recurring payment — On</span>
               <span class="recurring-sub">This category auto-fills every month</span>
           </span>
           <span class="recurring-check">✓</span>`
        : `<span class="recurring-icon">🔁</span>
           <span class="recurring-text">
               <span class="recurring-title">Make this a recurring payment</span>
               <span class="recurring-sub">Skip logging it manually each month</span>
           </span>
           <span class="recurring-check">○</span>`;
}


async function saveTransaction() {
    const category = document.getElementById('logCategory').value;
    const amount   = parseFloat(document.getElementById('logAmount').value) || 0;
    const note     = document.getElementById('logNote').value;

    if (!category || !amount) {
        alert('Please select a category and enter an amount.');
        return;
    }

    appData.transactionLog.push({
        key:       category,
        amount,
        note,
        recurring: logModalRecurringState,
        monthKey:  currentMonthKey(),
        date:      new Date().toISOString(),
        timestamp: new Date().toISOString()
    });

    // Sync the recurring toggle for this category
    const wasRecurring = isRecurring(category);
    if (logModalRecurringState && !wasRecurring) {
        appData.recurringPayments.push({ key: category, addedAt: new Date().toISOString() });
        await saveRecurringPaymentsToFirestore();
    } else if (!logModalRecurringState && wasRecurring) {
        appData.recurringPayments = appData.recurringPayments.filter(r => r.key !== category);
        await saveRecurringPaymentsToFirestore();
    }

    await saveTransactionLogToFirestore();
    closeLogModal();
    updateDashboard();

    // If user is on the spending chart tab, rerender immediately.
    showDashboardTab('spendingChart');
}

function populateLogCategorySelect() {
    const labels = {
        rent: '🏠 Rent', groceries: '🛒 Groceries', utilities: '⚡ Utilities',
        phoneBill: '📱 Phone Bill', savings: '🐷 Savings', investments: '📈 Investments',
        misc: '🌀 Miscellaneous', transportation: '🚗 Transit / Gas'
    };

    let options = '<option value="">Select Category</option>';
    Object.entries(labels).forEach(([key, label]) => {
        if (appData.expensesProfile && parseFloat(appData.expensesProfile[key]) > 0) {
            options += `<option value="${key}">${label}</option>`;
        }
    });

    // Add custom expenses
    const customs = appData.expensesProfile?.customExpenses || [];
    customs.forEach(item => {
        if (item.label) options += `<option value="${item.label}">${item.label}</option>`;
    });

    document.getElementById('logCategory').innerHTML = options;
}

// ===== Settings =====
async function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        try {
            await auth.signOut();
        } catch (error) {
            alert('Logout error: ' + error.message);
        }
    }
}

async function clearTransactions() {
    if (confirm('Clear your spending history? Budget targets will stay intact.')) {
        appData.transactionLog = [];
        await saveTransactionLogToFirestore();
        updateDashboard();
        alert('✅ Spending history cleared.');
    }
}

async function factoryReset() {
    if (confirm('This will permanently delete all your data and cannot be undone. Are you sure?')) {
        try {
            const uid = currentUser.uid;
            appData = freshAppData();
            await db.collection('users').doc(uid).collection('budget').doc('profile').delete();
            await db.collection('users').doc(uid).collection('budget').doc('expenses').delete();
            await db.collection('users').doc(uid).collection('budget').doc('transactions').delete();
            await db.collection('users').doc(uid).collection('budget').doc('recurring').delete();
            await auth.signOut();
            alert('All data deleted.');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

// ===== Firestore =====
async function saveBudgetToFirestore() {
    if (!currentUser) return;
    try {
        await db.collection('users').doc(currentUser.uid).collection('budget').doc('profile')
            .set(appData.budgetProfile, { merge: true });
    } catch (e) { console.error('saveBudget:', e); }
}

async function saveExpensesToFirestore() {
    if (!currentUser) return;
    try {
        await db.collection('users').doc(currentUser.uid).collection('budget').doc('expenses')
            .set(appData.expensesProfile, { merge: true });
    } catch (e) { console.error('saveExpenses:', e); }
}

async function deleteTransaction(txIndex) {
    if (!Number.isFinite(txIndex)) return;
    if (!confirm('Delete this transaction?')) return;

    // txIndex refers to the index in appData.transactionLog
    if (txIndex < 0 || txIndex >= appData.transactionLog.length) return;

    appData.transactionLog.splice(txIndex, 1);
    await saveTransactionLogToFirestore();
    updateDashboard();
}

async function saveTransactionLogToFirestore() {
    if (!currentUser) return;
    try {
        await db.collection('users').doc(currentUser.uid).collection('budget').doc('transactions')
            .set({ log: appData.transactionLog, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) { console.error('saveTx:', e); }
}

async function saveRecurringPaymentsToFirestore() {
    if (!currentUser) return;
    try {
        await db.collection('users').doc(currentUser.uid).collection('budget').doc('recurring')
            .set({ items: appData.recurringPayments, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) { console.error('saveRecurring:', e); }
}

async function loadAllDataFromFirestore() {
    if (!currentUser) return;
    try {
        const userDoc = db.collection('users').doc(currentUser.uid);
        const [budgetSnap, expensesSnap, txSnap, recurringSnap] = await Promise.all([
            userDoc.collection('budget').doc('profile').get(),
            userDoc.collection('budget').doc('expenses').get(),
            userDoc.collection('budget').doc('transactions').get(),
            userDoc.collection('budget').doc('recurring').get()
        ]);
        if (budgetSnap.exists)   appData.budgetProfile   = budgetSnap.data();
        if (expensesSnap.exists) appData.expensesProfile = expensesSnap.data();
        if (txSnap.exists)       appData.transactionLog  = txSnap.data().log || [];
        if (recurringSnap.exists) appData.recurringPayments = recurringSnap.data().items || [];

        await applyRecurringPaymentsForCurrentMonth();
    } catch (e) { console.error('loadData:', e); }
}

// ===== Recurring Payments =====
// A "recurring payment" is a category marked as always-paid each month.
// Rather than requiring a manual log entry every month, we auto-create
// (at most once per month per category) a transaction equal to the
// planned/target amount, so the category always shows as fully spent.
function currentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function isRecurring(key) {
    return appData.recurringPayments.some(r => r.key === key);
}

async function toggleRecurring(key) {
    const idx = appData.recurringPayments.findIndex(r => r.key === key);
    if (idx >= 0) {
        appData.recurringPayments.splice(idx, 1);
    } else {
        appData.recurringPayments.push({ key, addedAt: new Date().toISOString() });
        // Immediately fill this month for the category if not already logged.
        await applyRecurringPaymentsForCurrentMonth();
    }
    await saveRecurringPaymentsToFirestore();
}

async function applyRecurringPaymentsForCurrentMonth() {
    if (!appData.expensesProfile || appData.recurringPayments.length === 0) return;
    const monthKey = currentMonthKey();
    const planned = computeCategoryPlannedActual().reduce((acc, c) => {
        acc[c.key] = c.planned;
        return acc;
    }, {});

    let changed = false;
    appData.recurringPayments.forEach(r => {
        const alreadyLoggedThisMonth = appData.transactionLog.some(tx =>
            tx.key === r.key && tx.recurring && (tx.monthKey === monthKey)
        );
        if (alreadyLoggedThisMonth) return;

        const amount = planned[r.key] || 0;
        if (amount <= 0) return;

        appData.transactionLog.push({
            key: r.key,
            amount,
            note: 'Recurring payment',
            recurring: true,
            monthKey,
            date: new Date().toISOString(),
            timestamp: new Date().toISOString()
        });
        changed = true;
    });

    if (changed) await saveTransactionLogToFirestore();
}

// ===== Utilities =====
function formatMoney(value, digits = 2) {
    const safe = Number.isFinite(value) ? value : 0;
    return `$${safe.toFixed(digits)}`;
}