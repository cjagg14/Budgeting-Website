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
        userProfile: null,
        budgetProfile: null,
        expensesProfile: null,
        transactionLog: [],
        recurringPayments: [],
        pdfPrefs: {
            fields: {
                name: true, jobTitle: true, company: true, address: true, payPeriod: true,
                grossIncome: true, netIncome: true, expenses: true, leftover: true,
                chart: true, notes: true
            },
            reminderEnabled: false,
            reminderDay: null,
            lastGeneratedMonthKey: null,
            lastDismissedMonthKey: null
        },
        categoryGroups: { ...DEFAULT_CATEGORY_GROUPS }
    };
}

const CUSTOM_COLOR_POOL = [
    '#f59e0b', '#8b5cf6', '#ec4899', '#10b981', 
    '#6366f1', '#f43f5e', '#06b6d4', '#84cc16'
];

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
    if (screenId === 'profileSetupScreen') restoreProfileSetupInputs();
    if (screenId === 'budgetInputsScreen') {
        restoreDraftToBudgetInputs();
        const label = document.getElementById('budgetBackLabel');
        if (label) {
            const hasFullProfile = !!(appData.budgetProfile && appData.expensesProfile);
            label.textContent = hasFullProfile ? 'Dashboard' : 'Logout';
        }
        updateIncomeLiveTracker();
    }
    if (screenId === 'expensesInputsScreen') {
        restoreDraftToExpensesInputs();
        updateExpenseLiveTracker();
    }
    if (screenId === 'settingsScreen') restorePdfPrefsToSettingsUI();

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
    updateIncomeLiveTracker();
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
    updateExpenseLiveTracker();
}

function toggleMenu() {
    // Placeholder — reserved for future side menu
}

// ===== Authentication =====
function checkAuthStatus() {
    if (!currentUser) { showScreen('loginScreen'); return; }

    if (!appData.userProfile) {
        showScreen('profileSetupScreen');
    } else if (!appData.budgetProfile) {
        showScreen('budgetInputsScreen');
    } else if (!appData.expensesProfile) {
        showScreen('expensesInputsScreen');
        displayAvailableBudgetSpace();
    } else {
        showScreen('dashboardScreen');
        updateDashboard();
        maybeShowPdfReminder();
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
// ===== Profile Setup Screen (Step 0) =====
async function saveProfileSetup() {
    const name       = document.getElementById('profileName').value.trim();
    const jobTitle   = document.getElementById('profileJobTitle').value.trim();
    const company    = document.getElementById('profileCompany').value.trim();
    const address    = document.getElementById('profileAddress').value.trim();
    const payPeriod  = document.getElementById('profilePayPeriod').value;
    const notes      = document.getElementById('profileNotes').value.trim();

    if (!name || !jobTitle) {
        alert('Please enter both your name and job title to continue.');
        return;
    }

    appData.userProfile = {
        name, jobTitle, company, address, payPeriod, notes,
        updatedAt: new Date().toISOString()
    };
    await saveUserProfileToFirestore();

    // If this was reached via Settings (profile already existed before this
    // edit), return to the dashboard instead of forcing the setup flow again.
    if (appData.budgetProfile && appData.expensesProfile) {
        showScreen('dashboardScreen');
    } else {
        showScreen('budgetInputsScreen');
    }
}

function restoreProfileSetupInputs() {
    const p = appData.userProfile;
    document.getElementById('profileName').value       = p ? p.name       ?? '' : '';
    document.getElementById('profileJobTitle').value    = p ? p.jobTitle   ?? '' : '';
    document.getElementById('profileCompany').value     = p ? p.company    ?? '' : '';
    document.getElementById('profileAddress').value     = p ? p.address    ?? '' : '';
    document.getElementById('profilePayPeriod').value   = p ? p.payPeriod  ?? 'Monthly' : 'Monthly';
    document.getElementById('profileNotes').value       = p ? p.notes      ?? '' : '';
}

async function saveUserProfileToFirestore() {
    if (!currentUser) return;
    try {
        await db.collection('users').doc(currentUser.uid).collection('budget').doc('userProfile')
            .set(appData.userProfile, { merge: true });
    } catch (e) { console.error('saveUserProfile:', e); }
}

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
    updateIncomeLiveTracker();
}

function removeCustomDeduction(id) {
    const el = document.getElementById(`deduction-${id}`);
    if (el) el.remove();
    updateIncomeLiveTracker();
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
    updateExpenseLiveTracker();
}

function updateExpenseLiveTracker() {
    const tracker = document.getElementById('expenseLiveTracker');
    if (!tracker || !appData.budgetProfile) return;

    const net = parseFloat(appData.budgetProfile.monthlyNet) || 0;

    const fieldIds = ['rent', 'groceries', 'utilities', 'phoneBill', 'transportation', 'savings', 'investments', 'misc'];
    let allocated = fieldIds.reduce((sum, id) => {
        const el = document.getElementById(id);
        return sum + (el ? parseFloat(el.value) || 0 : 0);
    }, 0);

    allocated += getCustomExpensesValues().reduce((sum, e) => sum + (parseFloat(e.value) || 0), 0);

    const remaining = net - allocated;
    const pct = net > 0 ? Math.min((allocated / net) * 100, 100) : 0;

    document.getElementById('liveAllocatedAmount').textContent = formatMoney(allocated);
    document.getElementById('liveAllocatedFill').style.width = `${pct}%`;
    document.getElementById('liveTrackerNet').textContent = formatMoney(net);

    const statusEl = document.getElementById('liveTrackerStatus');
    tracker.classList.remove('is-warning', 'is-over', 'is-complete');

    if (remaining < -0.004) {
        statusEl.textContent = `${formatMoney(Math.abs(remaining))} over budget`;
        tracker.classList.add('is-over');
    } else if (Math.abs(remaining) < 0.005) {
        statusEl.textContent = `Fully allocated`;
        tracker.classList.add('is-complete');
    } else {
        statusEl.textContent = `${formatMoney(remaining)} left to allocate`;
        if (net > 0 && allocated / net >= 0.9) tracker.classList.add('is-warning');
    }
}

function updateIncomeLiveTracker() {
    const tracker = document.getElementById('incomeLiveTracker');
    if (!tracker) return;

    const gross   = parseFloat(document.getElementById('grossIncome')?.value) || 0;
    const fedTax  = parseFloat(document.getElementById('fedTax')?.value)      || 0;
    const provTax = parseFloat(document.getElementById('provTax')?.value)     || 0;
    const cpp     = parseFloat(document.getElementById('cpp')?.value)         || 0;
    const ei      = parseFloat(document.getElementById('ei')?.value)          || 0;

    const customTotal = getCustomDeductionsValues().reduce((s, d) => s + (parseFloat(d.value) || 0), 0);
    const totalDeductions = fedTax + provTax + cpp + ei + customTotal;
    const net = gross - totalDeductions;
    const pct = gross > 0 ? Math.min((totalDeductions / gross) * 100, 100) : 0;

    document.getElementById('liveNetAmount').textContent = formatMoney(net);
    document.getElementById('liveNetFill').style.width = `${pct}%`;
    document.getElementById('liveGrossAmount').textContent = formatMoney(gross);

    const statusEl = document.getElementById('liveDeductionsStatus');
    tracker.classList.remove('is-warning', 'is-over');

    statusEl.textContent = `${formatMoney(totalDeductions)} in deductions`;
    if (net < -0.004) {
        tracker.classList.add('is-over');
    } else if (gross > 0 && totalDeductions / gross >= 0.45) {
        tracker.classList.add('is-warning');
    }
}

// Live-update both trackers on any keystroke/change within their screens,
// including dynamically-added custom rows (event delegation on the container).
document.addEventListener('DOMContentLoaded', () => {
    const expensesScreen = document.getElementById('expensesInputsScreen');
    if (expensesScreen) {
        expensesScreen.addEventListener('input', updateExpenseLiveTracker);
    }
    const budgetScreen = document.getElementById('budgetInputsScreen');
    if (budgetScreen) {
        budgetScreen.addEventListener('input', updateIncomeLiveTracker);
    }
});


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
    updateExpenseLiveTracker();
}

function removeCustomExpense(id) {
    const el = document.getElementById(`expense-${id}`);
    if (el) el.remove();
    updateExpenseLiveTracker();
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

    const greetEl = document.getElementById('dashboardUserName');
    if (greetEl) {
        const fullName = appData.userProfile?.name || '';
        greetEl.textContent = fullName ? `Hi, ${fullName.split(' ')[0]}` : 'Dashboard';
    }

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
        rent:           { label: 'Rent / Mortgage',    icon: '🏠', color: '#cccc00' },
        groceries:      { label: 'Groceries',          icon: '🛒', color: '#ff9f0a' },
        utilities:      { label: 'Utilities',          icon: '⚡', color: '#d946ef' },
        phoneBill:      { label: 'Phone Bill',         icon: '📱', color: '#0a84ff' },
        savings:        { label: 'Savings Target',     icon: '🐷', color: '#32d74b' },
        investments:    { label: 'Investments',        icon: '📈', color: '#7c6cf5' },
        misc:           { label: 'Miscellaneous',      icon: '🌀', color: '#9ca3af' },
        transportation: { label: 'Transit / Gas',      icon: '🚗', color: '#ff375f' }
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
    const customIcons    = ['📦'];
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

    // Collapse state persists across re-renders
    if (!window._budgetGroupCollapsed) window._budgetGroupCollapsed = {};

    // Render in a consistent order
    const ORDER = ['fixed', 'everyday', 'goals', 'custom'];
    let html = '';

    ORDER.forEach(groupKey => {
        const group = groups[groupKey];
        if (!group || group.items.length === 0) return;
        const titles = groupTitles[groupKey] || { title: groupKey, subtitle: '' };
        const isCollapsed = window._budgetGroupCollapsed[groupKey] === true;
        const leftAmt = group.planned - group.spent;
        const leftColor = leftAmt < 0 ? 'var(--danger)' : 'var(--success)';

        html += `
        <div class="budget-group" id="budgetGroup_${groupKey}">
            <div class="group-header group-header-toggle" onclick="toggleBudgetGroup('${groupKey}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){toggleBudgetGroup('${groupKey}');}" aria-expanded="${!isCollapsed}">
                <div class="group-header-top">
                    <div>
                        <h3 class="group-title">${titles.title}</h3>
                        <p class="group-subtitle">${titles.subtitle}</p>
                    </div>
                    <span class="group-chevron ${isCollapsed ? '' : 'open'}">▾</span>
                </div>
                <div class="group-stats">
                    <span>Planned: <strong>${formatMoney(group.planned)}</strong></span>
                    <span>Spent: <strong>${formatMoney(group.spent)}</strong></span>
                    <span>Left: <strong style="color:${leftColor}">${leftAmt < 0 ? '−' : ''}${formatMoney(Math.abs(leftAmt))}</strong></span>
                </div>
            </div>
            <div class="group-items ${isCollapsed ? '' : 'open'}"><div class="group-items-inner">`;
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

        html += `</div></div></div>`; // close .group-items-inner, .group-items, .budget-group
    });

    container.innerHTML = html;
}

function toggleBudgetGroup(groupKey) {
    if (!window._budgetGroupCollapsed) window._budgetGroupCollapsed = {};
    window._budgetGroupCollapsed[groupKey] = !window._budgetGroupCollapsed[groupKey];
    const groupEl = document.getElementById('budgetGroup_' + groupKey);
    if (!groupEl) return;
    const header = groupEl.querySelector('.group-header-toggle');
    const items  = groupEl.querySelector('.group-items');
    const chevron = groupEl.querySelector('.group-chevron');
    const collapsed = window._budgetGroupCollapsed[groupKey];
    items.classList.toggle('open', !collapsed);
    chevron.classList.toggle('open', !collapsed);
    if (header) header.setAttribute('aria-expanded', String(!collapsed));
}

function getConsistentColor(key, metaByKey) {
    // 1. If it's a known category, use the defined color
    if (metaByKey[key]) return metaByKey[key].color;

    // 2. If it's custom, pick from the pool based on the string length
    const index = key.length % CUSTOM_COLOR_POOL.length;
    return CUSTOM_COLOR_POOL[index];
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
        rent:           { label: 'Rent/Mortgage',      icon: '🏠', color: '#cccc00' },
        groceries:      { label: 'Groceries',          icon: '🛒', color: '#ff9f0a' },
        utilities:      { label: 'Utilities',          icon: '⚡', color: '#d946ef' },
        phoneBill:      { label: 'Phone Bill',         icon: '📱', color: '#0a84ff' },
        savings:        { label: 'Savings Target',     icon: '🐷', color: '#32d74b' },
        investments:    { label: 'Investments',        icon: '📈', color: '#7c6cf5' },
        misc:           { label: 'Misc',              icon: '🌀', color: '#9ca3af' },
        transportation: { label: 'Transit/Gas',        icon: '🚗', color: '#ff375f' }
    };

    // Return the mapped and sorted array
    return keys
        .map(key => ({
            key,
            label: metaByKey[key]?.label || key, 
            planned: planned[key] || 0,
            actual: actual[key] || 0,
            icon: metaByKey[key]?.icon || '📦',
            color: getConsistentColor(key, metaByKey) // Correctly calling the helper
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

    // Mini legend: just a colored box + name, no percentages
    const miniEl = document.getElementById('chartMiniLegend');
    if (miniEl) {
        miniEl.innerHTML = categories.map(c =>
            `<span class="mini-legend-item"><span class="mini-legend-swatch" style="background:${c.color}"></span>${c.label}</span>`
        ).join('');
    }

    if (categories.length === 0) {
        legendEl.innerHTML = '<p class="empty-state">Set up your budget targets to see this chart.</p>';
    }
}

function showDashboardTab(tabId) {
    const budgetView   = document.getElementById('dashboardBudgetView');
    const spendingView = document.getElementById('dashboardSpendingChartView');
    const tabBudget    = document.getElementById('tabBudgetView');
    const tabSpending  = document.getElementById('tabSpendingChart');

    // Fade out current active subview, then swap
    const currentActive = [budgetView, spendingView].find(el => el && el.classList.contains('active'));
    const nextEl = tabId === 'budgetView' ? budgetView : spendingView;

    if (currentActive && currentActive !== nextEl) {
        currentActive.classList.add('fading-out');
        setTimeout(() => {
            currentActive.classList.remove('active', 'fading-out');
            nextEl.classList.add('active', 'fading-in');
            setTimeout(() => nextEl.classList.remove('fading-in'), 220);
            if (tabId === 'spendingChart') renderSpendingChart();
        }, 150);
    } else if (!currentActive) {
        nextEl.classList.add('active');
        if (tabId === 'spendingChart') renderSpendingChart();
    }

    tabBudget  && tabBudget.classList.toggle('active', tabId === 'budgetView');
    tabSpending && tabSpending.classList.toggle('active', tabId === 'spendingChart');
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
        const [userProfileSnap, budgetSnap, expensesSnap, txSnap, recurringSnap, pdfPrefsSnap] = await Promise.all([
            userDoc.collection('budget').doc('userProfile').get(),
            userDoc.collection('budget').doc('profile').get(),
            userDoc.collection('budget').doc('expenses').get(),
            userDoc.collection('budget').doc('transactions').get(),
            userDoc.collection('budget').doc('recurring').get(),
            userDoc.collection('budget').doc('pdfPrefs').get()
        ]);
        if (userProfileSnap.exists) appData.userProfile     = userProfileSnap.data();
        if (budgetSnap.exists)      appData.budgetProfile   = budgetSnap.data();
        if (expensesSnap.exists)    appData.expensesProfile = expensesSnap.data();
        if (txSnap.exists)          appData.transactionLog  = txSnap.data().log || [];
        if (recurringSnap.exists)   appData.recurringPayments = recurringSnap.data().items || [];
        if (pdfPrefsSnap.exists) {
            const savedPrefs = pdfPrefsSnap.data();
            appData.pdfPrefs = {
                ...appData.pdfPrefs,
                ...savedPrefs,
                fields: { ...appData.pdfPrefs.fields, ...(savedPrefs.fields || {}) }
            };
        }

        await applyRecurringPaymentsForCurrentMonth();
    } catch (e) { console.error('loadData:', e); }
}

async function savePdfPrefsToFirestore() {
    if (!currentUser) return;
    try {
        await db.collection('users').doc(currentUser.uid).collection('budget').doc('pdfPrefs')
            .set(appData.pdfPrefs, { merge: true });
    } catch (e) { console.error('savePdfPrefs:', e); }
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

// ===== PDF Settings Sync =====
function restorePdfPrefsToSettingsUI() {
    const p = appData.pdfPrefs || {};
    const f = p.fields || {};
    document.getElementById('pdfFieldName').checked        = f.name        !== false;
    document.getElementById('pdfFieldJobTitle').checked     = f.jobTitle    !== false;
    document.getElementById('pdfFieldCompany').checked      = f.company     !== false;
    document.getElementById('pdfFieldAddress').checked      = f.address     !== false;
    document.getElementById('pdfFieldPayPeriod').checked    = f.payPeriod   !== false;
    document.getElementById('pdfFieldGrossIncome').checked  = f.grossIncome !== false;
    document.getElementById('pdfFieldNetIncome').checked    = f.netIncome   !== false;
    document.getElementById('pdfFieldExpenses').checked     = f.expenses    !== false;
    document.getElementById('pdfFieldLeftover').checked     = f.leftover    !== false;
    document.getElementById('pdfFieldChart').checked        = f.chart       !== false;
    document.getElementById('pdfFieldNotes').checked        = f.notes       !== false;
    document.getElementById('pdfReminderEnabled').checked   = !!p.reminderEnabled;
    document.getElementById('pdfReminderDay').value         = p.reminderDay ?? '';
}

async function savePdfLayoutPrefs() {
    appData.pdfPrefs.fields = {
        name:        document.getElementById('pdfFieldName').checked,
        jobTitle:    document.getElementById('pdfFieldJobTitle').checked,
        company:     document.getElementById('pdfFieldCompany').checked,
        address:     document.getElementById('pdfFieldAddress').checked,
        payPeriod:   document.getElementById('pdfFieldPayPeriod').checked,
        grossIncome: document.getElementById('pdfFieldGrossIncome').checked,
        netIncome:   document.getElementById('pdfFieldNetIncome').checked,
        expenses:    document.getElementById('pdfFieldExpenses').checked,
        leftover:    document.getElementById('pdfFieldLeftover').checked,
        chart:       document.getElementById('pdfFieldChart').checked,
        notes:       document.getElementById('pdfFieldNotes').checked
    };
    await savePdfPrefsToFirestore();
}

async function savePdfReminderPrefs() {
    const enabled = document.getElementById('pdfReminderEnabled').checked;
    let day = parseInt(document.getElementById('pdfReminderDay').value, 10);
    if (!Number.isFinite(day) || day < 1) day = 1;
    if (day > 28) day = 28; // stay valid in every month, including February
    document.getElementById('pdfReminderDay').value = day;

    appData.pdfPrefs.reminderEnabled = enabled;
    appData.pdfPrefs.reminderDay = day;
    await savePdfPrefsToFirestore();
}

// ===== Monthly PDF Reminder =====
function maybeShowPdfReminder() {
    const p = appData.pdfPrefs;
    if (!p || !p.reminderEnabled || !p.reminderDay) return;

    const now = new Date();
    const monthKey = currentMonthKey();
    if (now.getDate() < p.reminderDay) return;
    if (p.lastGeneratedMonthKey === monthKey) return;   // already generated this month
    if (p.lastDismissedMonthKey === monthKey) return;    // already said "later" this month

    document.getElementById('pdfReminderDayLabel').textContent = p.reminderDay;
    document.getElementById('pdfReminderModal').classList.add('active');
}

async function dismissPdfReminder() {
    appData.pdfPrefs.lastDismissedMonthKey = currentMonthKey();
    await savePdfPrefsToFirestore();
    document.getElementById('pdfReminderModal').classList.remove('active');
}

async function confirmPdfReminder() {
    document.getElementById('pdfReminderModal').classList.remove('active');
    await downloadMonthlyPdf();
    appData.pdfPrefs.lastGeneratedMonthKey = currentMonthKey();
    await savePdfPrefsToFirestore();
}

// ===== PDF Generation =====
// Converts a "#rrggbb" hex color string into [r,g,b] floats 0-1, for pdf-lib's rgb().
function hexToRgbTriplet(hex) {
    const clean = (hex || '#888888').replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return [Number.isFinite(r) ? r : 0.5, Number.isFinite(g) ? g : 0.5, Number.isFinite(b) ? b : 0.5];
}

// Simple greedy word-wrap so long notes don't run off the page edge.
function wrapText(str, font, size, maxWidth) {
    const words = str.split(/\s+/);
    const lines = [];
    let current = '';
    words.forEach(word => {
        const trial = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(trial, size) > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = trial;
        }
    });
    if (current) lines.push(current);
    return lines;
}

// Renders the spending breakdown as a pie chart on an offscreen canvas and
// returns a PNG data URL — this gets embedded into the PDF as an image,
// since pdf-lib can't draw filled arcs/pies natively.
function renderPieChartPng(categories) {
    const size = 360;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const cx = size / 2, cy = size / 2, r = size / 2 - 8;
    const total = categories.reduce((s, c) => s + c.actual, 0);

    if (total <= 0) {
        ctx.fillStyle = '#e8e8ea';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#9a9aa0';
        ctx.font = '16px Helvetica, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No spending yet', cx, cy);
        return canvas.toDataURL('image/png');
    }

    let startAngle = -Math.PI / 2;
    categories.filter(c => c.actual > 0).forEach(c => {
        const slice = (c.actual / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, startAngle + slice);
        ctx.closePath();
        ctx.fillStyle = c.color;
        ctx.fill();
        startAngle += slice;
    });

    // donut hole for a cleaner look matching the in-app ring style
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    return canvas.toDataURL('image/png');
}

async function downloadMonthlyPdf() {
    if (!appData.userProfile || !appData.budgetProfile || !appData.expensesProfile) {
        alert('Please finish setting up your profile, income, and expenses first.');
        return;
    }
    if (typeof PDFLib === 'undefined') {
        alert('PDF library failed to load. Check your connection and try again.');
        return;
    }

    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageSize = [595, 842]; // A4
    let page = pdfDoc.addPage(pageSize);
    const { width, height } = page.getSize();
    const margin = 48;
    const contentWidth = width - margin * 2;
    let y = height - margin;

    // ----- Palette -----
    const accent   = rgb(0, 0.68, 0.71);   // app teal
    const accentBg = rgb(0.92, 0.98, 0.98);
    const dark     = rgb(0.12, 0.12, 0.14);
    const grey     = rgb(0.45, 0.45, 0.48);
    const lineCol  = rgb(0.82, 0.82, 0.85);
    const good      = rgb(0.1, 0.6, 0.3);
    const bad       = rgb(0.8, 0.2, 0.2);

    const newPage = () => {
        page = pdfDoc.addPage(pageSize);
        y = height - margin;
        return page;
    };

    const ensureSpace = (needed) => {
        if (y - needed < margin) newPage();
    };

    const text = (str, x, yy, opts = {}) => {
        page.drawText(str, { x, y: yy, size: opts.size ?? 11, font: opts.bold ? fontBold : font, color: opts.color ?? dark });
    };

    const hr = (yy, color = lineCol, thickness = 1) => {
        page.drawLine({ start: { x: margin, y: yy }, end: { x: width - margin, y: yy }, thickness, color });
    };

    const now = new Date();
    const monthLabel = now.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
    const f = appData.pdfPrefs.fields || {};
    const profile = appData.userProfile;
    const gross   = parseFloat(appData.budgetProfile.monthlyGross) || 0;
    const net     = parseFloat(appData.budgetProfile.monthlyNet)   || 0;

    const categories = computeCategoryPlannedActual();
    const totalSpent = categories.reduce((s, c) => s + c.actual, 0);
    const leftover   = net - totalSpent;

    // ============================================================
    // HEADER BAND
    // ============================================================
    // HEADER BAND
    const bandHeight = 92;
    page.drawRectangle({ x: 0, y: height - bandHeight, width, height: bandHeight, color: rgb(0.07, 0.09, 0.1) });
    text('Monthly Spending & Earnings Statement', margin, height - 38, { size: 17, bold: true, color: rgb(1, 1, 1) });
    text(monthLabel, margin, height - 60, { size: 11, color: rgb(0.75, 0.92, 0.92) });
    const genLabel = `Generated ${now.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    const genLabelW = font.widthOfTextAtSize(genLabel, 9);
    text(genLabel, width - margin - genLabelW, height - 38, { size: 9, color: rgb(0.7, 0.7, 0.72) });
    y = height - bandHeight - 26;

    // ============================================================
    // PROFILE TABLE
    // ============================================================
    const profileRows = [];
    if (f.name)      profileRows.push(['Name', profile.name || '—']);
    if (f.jobTitle)  profileRows.push(['Job Title', profile.jobTitle || '—']);
    if (f.company)   profileRows.push(['Company', profile.company || '—']);
    if (f.address)   profileRows.push(['Home Address', profile.address || '—']);
    if (f.payPeriod) profileRows.push(['Pay Period', profile.payPeriod || '—']);

    if (profileRows.length) {
        text('EMPLOYEE INFORMATION', margin, y, { size: 9, bold: true, color: grey });
        y -= 14;
        const colW = contentWidth / 2;
        profileRows.forEach((row, i) => {
            const colX = (i % 2 === 0) ? margin : margin + colW;
            if (i % 2 === 0 && i > 0) y -= 20;
            text(row[0] + ':', colX, y, { size: 10, color: grey });
            text(row[1], colX + 92, y, { size: 10, bold: true });
        });
        y -= 26;
        hr(y);
        y -= 22;
    }

    // ============================================================
    // SUMMARY TABLE (statement / grid style)
    // ============================================================
    text('EARNINGS & SUMMARY', margin, y, { size: 9, bold: true, color: grey });
    y -= 20;

    const summaryRows = [];
    if (f.grossIncome) summaryRows.push(['Income before deductions', formatMoney(gross), dark]);
    if (f.netIncome)   summaryRows.push(['Income after deductions',  formatMoney(net), dark]);
    if (f.expenses)    summaryRows.push(['Total spent this month',   formatMoney(totalSpent), dark]);
    if (f.leftover)    summaryRows.push(['Leftover (saved)',         formatMoney(leftover), leftover >= 0 ? good : bad]);

    const rowH = 26;
    const tableTop = y;
    summaryRows.forEach((row, i) => {
        const rowY = tableTop - i * rowH;
        if (i % 2 === 0) {
            page.drawRectangle({ x: margin, y: rowY - rowH + 16, width: contentWidth, height: rowH, color: accentBg });
        }
        text(row[0], margin + 10, rowY, { size: 11 });
        const valW = fontBold.widthOfTextAtSize(row[1], 12) * 1.05;
        text(row[1], width - margin - 16 - valW, rowY, { size: 12, bold: true, color: row[2] });
    });
    y = tableTop - summaryRows.length * rowH - 6;
    page.drawRectangle({ x: margin, y: tableTop - summaryRows.length * rowH + 16, width: contentWidth, height: summaryRows.length * rowH, borderColor: lineCol, borderWidth: 1 });
    y -= 24;

    // ============================================================
    // PIE CHART + CATEGORY TABLE (side by side)
    // ============================================================
    const spentCategories = categories.filter(c => c.actual > 0 || c.planned > 0);

    if (f.chart && spentCategories.length) {
        ensureSpace(220);
        text('SPENDING BREAKDOWN', margin, y, { size: 9, bold: true, color: grey });
        y -= 14;

        const chartPng = renderPieChartPng(spentCategories);
        const pngImage = await pdfDoc.embedPng(chartPng);
        const chartSize = 150;
        const chartTop = y;
        page.drawImage(pngImage, { x: margin, y: chartTop - chartSize, width: chartSize, height: chartSize });

        // legend to the right of the chart
        const legendX = margin + chartSize + 24;
        let legendY = chartTop - 6;
        spentCategories.slice(0, 8).forEach(c => {
            const [r, g, b] = hexToRgbTriplet(c.color);
            page.drawRectangle({ x: legendX, y: legendY - 8, width: 9, height: 9, color: rgb(r, g, b) });
            text(`${c.label}`, legendX + 14, legendY, { size: 9.5 });
            text(formatMoney(c.actual), width - margin - 10 - font.widthOfTextAtSize(formatMoney(c.actual), 9.5), legendY, { size: 9.5, color: grey });
            legendY -= 16;
        });

        y = chartTop - chartSize - 20;
        hr(y);
        y -= 22;
    }

    // ============================================================
    // CATEGORY DETAIL TABLE
    // ============================================================
    if (spentCategories.length) {
        ensureSpace(60);
        text('CATEGORY DETAIL', margin, y, { size: 9, bold: true, color: grey });
        y -= 16;

        // table header row
        const col1 = margin, col2 = margin + 230, col3 = margin + 340, col4 = width - margin - 60;
        text('Category', col1, y, { size: 9.5, bold: true, color: grey });
        text('Spent', col2, y, { size: 9.5, bold: true, color: grey });
        text('Goal', col3, y, { size: 9.5, bold: true, color: grey });
        text('% Used', col4, y, { size: 9.5, bold: true, color: grey });
        y -= 8;
        hr(y);
        y -= 14;

        spentCategories.forEach((c, i) => {
            ensureSpace(22);
            if (i % 2 === 0) {
                page.drawRectangle({ x: margin, y: y - 6, width: contentWidth, height: 18, color: accentBg });
            }
            const pct = c.planned > 0 ? Math.min((c.actual / c.planned) * 100, 999) : (c.actual > 0 ? 100 : 0);
            text(c.label, col1 + 6, y, { size: 10 });
            text(formatMoney(c.actual), col2, y, { size: 10 });
            text(formatMoney(c.planned), col3, y, { size: 10 });
            text(`${pct.toFixed(0)}%`, col4, y, { size: 10, color: pct > 100 ? bad : dark });
            y -= 18;
        });
        y -= 10;
        hr(y);
        y -= 22;
    }

    // ============================================================
    // NOTES
    // ============================================================
    if (f.notes && profile.notes) {
        ensureSpace(60);
        text('NOTES', margin, y, { size: 9, bold: true, color: grey });
        y -= 14;
        const wrapped = wrapText(profile.notes, font, 10, contentWidth - 12);
        wrapped.forEach(line => {
            ensureSpace(16);
            text(line, margin, y, { size: 10, color: dark });
            y -= 14;
        });
    }

    // ----- Footer on last page -----
    text('Generated by BudgetApp — for personal record-keeping', margin, margin - 10, { size: 8, color: grey });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BudgetApp-Report-${currentMonthKey()}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
