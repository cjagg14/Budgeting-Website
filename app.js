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
        savingsGoals: [],
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
        uiPrefs: {
            theme: 'system'
        },
        categoryGroups: { ...DEFAULT_CATEGORY_GROUPS }
    };
}

const CUSTOM_COLOR_POOL = [
    '#f97316', '#ec4899', '#06b6d4', '#a855f7',
    '#eab308', '#22c55e', '#3b82f6', '#f43f5e'
];

// ===== Icon System =====
// A small hand-authored line-icon set (stroke-based, 24x24, currentColor) used
// everywhere in place of emoji, so every screen shares one consistent visual
// language. Static markup references icons via <span data-icon="name">
// (hydrated on load); JS-rendered templates call icon('name') directly.
const ICONS = {
    'back':          '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    'chevron-down':  '<polyline points="6 9 12 15 18 9"/>',
    'plus':          '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    'close':         '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    'trash':         '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    'check-circle':  '<circle cx="12" cy="12" r="9"/><polyline points="8 12.5 11 15.5 16 9.5"/>',
    'circle':        '<circle cx="12" cy="12" r="9"/>',
    'repeat':        '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    // A sliders/equalizer glyph, not a gear-with-spokes — that shape reads
    // as near-identical to the 'sun' icon below at small sizes.
    'settings':      '<line x1="4" y1="6" x2="20" y2="6"/><circle cx="14" cy="6" r="2"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="8" cy="12" r="2"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="16" cy="18" r="2"/>',
    'house':         '<path d="M4 11.5L12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9"/><path d="M10 20v-6h4v6"/>',
    'cart':          '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 8H6"/>',
    'bolt':          '<polygon points="13 2 4 14 11 14 10 22 20 9 13 9 13 2"/>',
    'phone':         '<rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/>',
    'car':           '<path d="M3 13l1.4-4.4A2 2 0 0 1 6.3 7h11.4a2 2 0 0 1 1.9 1.6L21 13"/><rect x="2.5" y="13" width="19" height="5" rx="1.5"/><circle cx="7" cy="18.5" r="1.5"/><circle cx="17" cy="18.5" r="1.5"/>',
    'piggy-bank':    '<path d="M4 10a5 5 0 0 1 5-5h5a5 5 0 0 1 5 5v1h1.5a1 1 0 0 1 .9 1.5l-1 2a1 1 0 0 1-.9.5H19v1a3 3 0 0 1-3 3v2h-2v-2H9v2H7v-2.3A5 5 0 0 1 4 12z"/><circle cx="15" cy="10" r=".8" fill="currentColor" stroke="none"/><path d="M2 12h2"/>',
    'trending-up':   '<polyline points="3 17 9 11 13 15 21 6"/><polyline points="15 6 21 6 21 12"/>',
    'shuffle':       '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>',
    'box':           '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><line x1="12" y1="13" x2="12" y2="21"/>',
    'document':      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>',
    'warning':       '<path d="M12 2 1 21h22z"/><line x1="12" y1="9" x2="12" y2="14"/><line x1="12" y1="17.5" x2="12" y2="17.6"/>',
    'wallet':        '<path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M2 9V6a2 2 0 0 1 2-2h11"/><circle cx="16.5" cy="14" r="1.3" fill="currentColor" stroke="none"/>',
    'clipboard':     '<rect x="6" y="4" width="12" height="18" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="15" y2="15"/>',
    'receipt':       '<path d="M6 2h12v19l-3-2-3 2-3-2-3 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/>',
    'user':          '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    'log-out':       '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    'pencil':        '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    'refresh':       '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.5 9a9 9 0 0 1 14.7-3.4L23 10M1 14l4.8 4.4A9 9 0 0 0 20.5 15"/>',
    'grid':          '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    'sun':           '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    'moon':          '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    'monitor':       '<rect x="2" y="4" width="20" height="13" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    'target':        '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
    'bar-chart':     '<line x1="5" y1="21" x2="5" y2="12"/><line x1="12" y1="21" x2="12" y2="7"/><line x1="19" y1="21" x2="19" y2="15"/>',
    'download':      '<path d="M12 3v12"/><polyline points="7 11 12 16 17 11"/><path d="M4 19h16"/>',
    'upload':        '<path d="M12 21V9"/><polyline points="7 13 12 8 17 13"/><path d="M4 19h16"/>'
};

function icon(name, extraClass) {
    const inner = ICONS[name] || ICONS.box;
    return `<svg class="icon${extraClass ? ' ' + extraClass : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

// Static HTML uses <span data-icon="name"></span> placeholders so every icon
// (static or JS-rendered) is sourced from the same ICONS map above.
function hydrateStaticIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach(el => {
        el.innerHTML = icon(el.getAttribute('data-icon'));
    });
}

// ===== Theme System (light / dark / system) =====
// The authoritative preference lives in Firestore (appData.uiPrefs.theme),
// reconciled once loadAllDataFromFirestore() completes. A tiny inline script
// in index.html's <head> applies a localStorage-cached guess before first
// paint so there's no flash while auth/data are still loading.
const THEME_STORAGE_KEY = 'budgetapp-theme';
let systemThemeMql = null;

function resolveTheme(pref) {
    if (pref === 'dark' || pref === 'light') return pref;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}

function applyTheme(pref) {
    const resolved = resolveTheme(pref);
    document.documentElement.setAttribute('data-theme', resolved);
    try { localStorage.setItem(THEME_STORAGE_KEY, pref); } catch (e) {}

    const meta = document.getElementById('themeColorMeta');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0a0f0c' : '#f3f7f4');

    if (systemThemeMql) {
        systemThemeMql.removeEventListener('change', onSystemThemeChange);
        systemThemeMql = null;
    }
    if (pref === 'system' && window.matchMedia) {
        systemThemeMql = window.matchMedia('(prefers-color-scheme: dark)');
        systemThemeMql.addEventListener('change', onSystemThemeChange);
    }
}

function onSystemThemeChange() { applyTheme('system'); }

async function setThemePreference(pref) {
    appData.uiPrefs.theme = pref;
    applyTheme(pref);
    restoreThemeSettingsUI();
    await saveUiPrefsToFirestore();
}

function restoreThemeSettingsUI() {
    const current = appData.uiPrefs?.theme || 'system';
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === current);
    });
}

async function saveUiPrefsToFirestore() {
    if (!currentUser) return;
    try {
        await db.collection('users').doc(currentUser.uid).collection('budget').doc('uiPrefs')
            .set(appData.uiPrefs, { merge: true });
    } catch (e) { console.error('saveUiPrefs:', e); }
}

let appData = freshAppData();
let currentUser = null;

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    hydrateStaticIcons();
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
    if (screenId === 'settingsScreen') { restorePdfPrefsToSettingsUI(); restoreThemeSettingsUI(); }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// ===== Modal scroll lock =====
// Every modal (Log Spending, PDF reminder, new goal, add funds) sits on top
// of the page as a fixed overlay, but nothing stopped the page underneath
// from still scrolling while one was open. Locked/unlocked from each
// modal's own open/close functions below.
function lockBodyScroll() {
    document.documentElement.classList.add('modal-open-lock');
}
function unlockBodyScroll() {
    // Only unlock once no other modal is still open (defensive — in normal
    // use only one modal is ever open at a time).
    if (!document.querySelector('.modal.active')) {
        document.documentElement.classList.remove('modal-open-lock');
    }
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
                <button class="delete-button" onclick="removeCustomDeduction(${id})">${icon('close')}</button>
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
                <button class="delete-button" onclick="removeCustomExpense(${id})">${icon('close')}</button>
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
            <button class="delete-button" onclick="removeCustomDeduction(${id})">${icon('close')}</button>
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
            <button class="delete-button" onclick="removeCustomExpense(${id})">${icon('close')}</button>
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
    const totalSpent      = currentMonthTransactions().reduce((s, tx) => s + tx.amount, 0);
    const walletRemaining = netIncome - totalSpent;

    document.getElementById('netIncome').textContent       = formatMoney(netIncome);
    document.getElementById('plannedExpenses').textContent = formatMoney(plannedExpenses);
    document.getElementById('totalSpent').textContent      = formatMoney(totalSpent);

    const walletEl = document.getElementById('walletRemaining');
    walletEl.textContent = formatMoney(walletRemaining);
    walletEl.className   = 'summary-amount' + (walletRemaining < 0 ? ' negative' : '');

    renderOverspendBanner();
    renderBudgetGroups();
    renderSavingsGoals();
    renderTransactionLog();
    populateLogCategorySelect();
    // Keeps the Log Spending modal's category snapshot (progress bar + list)
    // in sync whenever data changes — e.g. deleting a row from that list,
    // or an undo — even though the modal itself may still be open.
    renderCategoryDetailInModal();

    // Always kept in sync: on mobile it's just off-screen behind the tab
    // switcher, but at desktop widths both panels show side by side (see
    // the dashboard-columns responsive rule in styles.css), so it can't be
    // rendered lazily only when its tab becomes "active".
    renderSpendingChart();
    renderMonthlyTrends();
}

// Small dismissible-per-render banner listing any categories currently over
// their planned amount this month. Uses computeCategoryPlannedActual(),
// which is already month-scoped via currentMonthTransactions().
function renderOverspendBanner() {
    const container = document.getElementById('overspendBanner');
    if (!container) return;

    const over = computeCategoryPlannedActual().filter(c => c.planned > 0 && c.actual > c.planned);
    if (over.length === 0) {
        container.innerHTML = '';
        return;
    }

    const names = over.map(c => c.label).join(', ');
    container.innerHTML = `
        <div class="overspend-banner">
            ${icon('warning')}
            <span class="overspend-banner-text">
                <strong>${over.length === 1 ? '1 category is' : over.length + ' categories are'}</strong> over budget this month: ${names}
            </span>
        </div>`;
}

function renderBudgetGroups() {
    const container = document.getElementById('budgetGroupsContainer');

    const EXCLUDED_KEYS = new Set(['totalExpenses', 'customExpenses', 'updatedAt', 'savedAt']);

    const categoryMeta = {
        rent:           { label: 'Rent / Mortgage',    icon: 'house',       color: '#10b981' },
        groceries:      { label: 'Groceries',          icon: 'cart',        color: '#f59e0b' },
        utilities:      { label: 'Utilities',          icon: 'bolt',        color: '#8b5cf6' },
        phoneBill:      { label: 'Phone Bill',         icon: 'phone',       color: '#0ea5e9' },
        savings:        { label: 'Savings Target',     icon: 'piggy-bank',  color: '#14b8a6' },
        investments:    { label: 'Investments',        icon: 'trending-up', color: '#6366f1' },
        misc:           { label: 'Miscellaneous',      icon: 'shuffle',     color: '#94a3b8' },
        transportation: { label: 'Transit / Gas',      icon: 'car',         color: '#f43f5e' }
    };

    const groupTitles = {
        fixed:    { title: 'Fixed Bills',       subtitle: 'Rent, insurance, and recurring obligations' },
        everyday: { title: 'Everyday Spending', subtitle: 'Flexible monthly costs you track often' },
        goals:    { title: 'Financial Goals',   subtitle: 'Savings and structural active assets' },
        custom:   { title: 'Custom Expenses',   subtitle: 'Additional personalized configurations' }
    };

    // Build per-key actual spend map (current month only)
    const actualSpend = {};
    currentMonthTransactions().forEach(tx => {
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
        const meta   = categoryMeta[key] || { label: key, icon: 'box', color: '#8e8e93' };
        groups[groupKey].items.push({ key, ...meta, target, actual });
        groups[groupKey].planned += target;
        groups[groupKey].spent   += actual;
    });

    // Custom expenses from customExpenses array
    const customExpenses = appData.expensesProfile.customExpenses || [];
    const customColors   = ['#f97316', '#ec4899', '#06b6d4', '#a855f7', '#eab308', '#22c55e'];
    const customIcons    = ['box'];
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
                    <span class="group-chevron ${isCollapsed ? '' : 'open'}">${icon('chevron-down')}</span>
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
            const recurringTag = isRecurring(item.key) ? `<span class="budget-recurring-badge">${icon('repeat')}</span>` : '';

            html += `
            <div class="budget-item" role="button" tabindex="0" data-budget-key="${item.key}" onclick="openLogModal('${item.key}')" onkeydown="if(event.key==='Enter'||event.key===' '){openLogModal('${item.key}');}">
                <div class="budget-item-top">
                    <div class="budget-item-left">
                        <span class="budget-icon-badge" style="background:${item.color}26; color:${item.color};">${icon(item.icon)}</span>
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
    currentMonthTransactions().forEach(tx => {
        const amt = parseFloat(tx.amount);
        if (!Number.isFinite(amt) || amt <= 0) return;
        actual[tx.key] = (actual[tx.key] || 0) + amt;
    });

    // unify labels (planned keys + actual keys)
    const keys = Array.from(new Set([...Object.keys(planned), ...Object.keys(actual)]));

    // meta (icon/colors) for known keys
    const metaByKey = {
        rent:           { label: 'Rent/Mortgage',      icon: 'house',       color: '#10b981' },
        groceries:      { label: 'Groceries',          icon: 'cart',        color: '#f59e0b' },
        utilities:      { label: 'Utilities',          icon: 'bolt',        color: '#8b5cf6' },
        phoneBill:      { label: 'Phone Bill',         icon: 'phone',       color: '#0ea5e9' },
        savings:        { label: 'Savings Target',     icon: 'piggy-bank',  color: '#14b8a6' },
        investments:    { label: 'Investments',        icon: 'trending-up', color: '#6366f1' },
        misc:           { label: 'Misc',               icon: 'shuffle',     color: '#94a3b8' },
        transportation: { label: 'Transit/Gas',        icon: 'car',         color: '#f43f5e' }
    };

    // Return the mapped and sorted array
    return keys
        .map(key => ({
            key,
            label: metaByKey[key]?.label || key,
            planned: planned[key] || 0,
            actual: actual[key] || 0,
            icon: metaByKey[key]?.icon || 'box',
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

    // ----- Inner fill: same slice geometry, each slice's color sweeps in
    // from its start edge to fillRatio of its width; rest stays transparent
    // so the thin outline sliver shows through. -----
    acc = 0;
    const fillParts = [];
    categories.forEach(c => {
        if (c.planned <= 0) return;
        const pct = c.planned / (totalPlanned || 1);
        const start = acc * 100;
        const fillRatio = Math.min(c.actual / c.planned, 1);
        const filledEnd = acc + pct * fillRatio;
        const end = acc + pct;
        if (fillRatio > 0) fillParts.push(`${c.color} ${start}%, ${c.color} ${filledEnd * 100}%`);
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
        const recurringTag = isRecurring(c.key) ? `<span class="legend-recurring">${icon('repeat')}</span>` : '';

        legendEl.insertAdjacentHTML('beforeend', `
            <button class="legend-row" onclick="openLogModal('${c.key}')">
                <span class="legend-swatch" style="background:${c.color}"></span>
                <span class="legend-main">
                    <span class="legend-top-row">
                        <span class="legend-label">${icon(c.icon, 'legend-icon')} ${c.label} ${recurringTag}</span>
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

// ===== Multi-Month Trends =====
// The transaction log keeps every month's history forever (only the current
// month's dashboard view filters it via currentMonthTransactions()), so we
// can group the full log by month to build a simple trend view. There's no
// historical snapshot of past budgets, so "planned" for every bar is the
// *current* plan total — a reasonable approximation, called out in the UI
// copy rather than presented as more precise than it is.
function computeMonthlyHistory(monthsBack = 6) {
    const now = new Date();
    const months = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label: d.toLocaleDateString('en-US', { month: 'short' })
        });
    }

    const plannedTotal = appData.expensesProfile ? parseFloat(appData.expensesProfile.totalExpenses) || 0 : 0;

    const totalsByMonth = {};
    (appData.transactionLog || []).forEach(tx => {
        const mk = monthKeyOf(tx);
        totalsByMonth[mk] = (totalsByMonth[mk] || 0) + (parseFloat(tx.amount) || 0);
    });

    const thisMonthKey = currentMonthKey();
    return months.map(m => ({
        ...m,
        actual: totalsByMonth[m.monthKey] || 0,
        planned: plannedTotal,
        isCurrent: m.monthKey === thisMonthKey
    }));
}

function renderMonthlyTrends() {
    const container = document.getElementById('monthlyTrendsContainer');
    if (!container) return;

    const months = computeMonthlyHistory(6);
    const maxVal = Math.max(...months.map(m => Math.max(m.actual, m.planned)), 1);

    container.innerHTML = months.map(m => {
        const pct = Math.min((m.actual / maxVal) * 100, 100);
        const plannedPct = Math.min((m.planned / maxVal) * 100, 100);
        const over = m.planned > 0 && m.actual > m.planned;
        return `
        <div class="trend-col ${m.isCurrent ? 'is-current' : ''}" title="${m.label}: ${formatMoney(m.actual)} of ${formatMoney(m.planned)} planned">
            <div class="trend-bar-track" style="--planned-pct:${plannedPct}%">
                <div class="trend-bar-fill ${over ? 'is-over' : ''}" style="height:${pct}%"></div>
            </div>
            <div class="trend-month-label">${m.label}</div>
        </div>`;
    }).join('');
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

    const monthTx = currentMonthTransactions();
    if (monthTx.length === 0) {
        container.innerHTML = '<p class="empty-state">No transactions logged this month yet.</p>';
        return;
    }

    const iconNames = {
        rent: 'house', groceries: 'cart', utilities: 'bolt', phoneBill: 'phone',
        savings: 'piggy-bank', investments: 'trending-up', misc: 'shuffle', transportation: 'car'
    };
    const labels = {
        rent: 'Rent', groceries: 'Groceries', utilities: 'Utilities', phoneBill: 'Phone Bill',
        savings: 'Savings', investments: 'Investments', misc: 'Misc', transportation: 'Transit / Gas'
    };

    let html = '';
    // show newest first, but keep stable indices (within the full log) for delete
    const reversed = monthTx.slice().reverse();
    reversed.forEach((tx) => {
        const txIndex = appData.transactionLog.indexOf(tx);
        const date = new Date(tx.date || tx.timestamp).toLocaleDateString('en-CA', {
            month: 'short', day: 'numeric'
        });
        const recurringTag = tx.recurring ? `<span class="budget-recurring-badge">${icon('repeat')} Recurring</span>` : '';

        html += `
        <div class="transaction-item" role="button" tabindex="0" onclick="openEditTransactionModal(${txIndex})" onkeydown="if(event.key==='Enter'||event.key===' '){openEditTransactionModal(${txIndex});}">
            <div class="transaction-icon-badge">${icon(iconNames[tx.key] || 'box')}</div>
            <div class="transaction-info">
                <div class="transaction-category">${labels[tx.key] || tx.key} ${recurringTag}</div>
                <div class="transaction-meta">${tx.note || 'No note'} · ${date}</div>
            </div>
            <div class="transaction-actions">
                <div class="transaction-amount">−${formatMoney(tx.amount)}</div>
                <button class="tx-delete-btn" type="button" onclick="event.stopPropagation(); deleteTransaction(${txIndex})" aria-label="Delete transaction">${icon('trash')}</button>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

let logModalRecurringState = false;
// null while adding a new transaction; set to an index into
// appData.transactionLog while editing an existing one (see
// openEditTransactionModal / saveTransaction / closeLogModal below).
let editingTxIndex = null;

// ===== Calculator (Log Spending amount field) =====
// A small four-function calculator replaces the native number keyboard for
// this field entirely — digit-only mobile keyboards have no multiply/divide
// keys, so there's no way to do "split this 3 ways" or "add these two
// receipts" without leaving the app to do the math first.
let calcState = { current: '0', previous: null, operator: null, resetOnNextDigit: false };

function calcOpSymbol(op) {
    return { '+': '+', '-': '−', '*': '×', '/': '÷' }[op] || '';
}

function calcCompute(a, b, op) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return b === 0 ? 0 : a / b;
        default:  return b;
    }
}

// Trims floating-point noise (e.g. 0.1 + 0.2) for display while typing;
// the amount actually logged still goes through formatMoney's toFixed(2)
// at save time, same as every other dollar figure in the app.
function calcFormat(n) {
    return String(Math.round(n * 100000) / 100000);
}

function calcRender() {
    const exprEl = document.getElementById('calcExpression');
    const dispEl = document.getElementById('calcDisplay');
    const amountInput = document.getElementById('logAmount');
    if (!exprEl || !dispEl) return;
    exprEl.textContent = calcState.operator ? `${calcState.previous} ${calcOpSymbol(calcState.operator)}` : ' ';
    dispEl.textContent = calcState.current;
    // Keeps the (readonly) Amount field showing the live value, same as if
    // it had been typed directly — placeholder shows through until you
    // actually enter something.
    if (amountInput) amountInput.value = calcState.current === '0' ? '' : calcState.current;
}

function openCalcKeypad() {
    document.getElementById('calcKeypadPanel')?.classList.add('active');
}

function closeCalcKeypad() {
    document.getElementById('calcKeypadPanel')?.classList.remove('active');
}

function calcReset(seedValue) {
    calcState = { current: seedValue != null ? String(seedValue) : '0', previous: null, operator: null, resetOnNextDigit: false };
    calcRender();
}

function calcCurrentValue() {
    return parseFloat(calcState.current) || 0;
}

function calcInputDigit(digit) {
    if (calcState.resetOnNextDigit) {
        calcState.current = digit;
        calcState.resetOnNextDigit = false;
    } else {
        calcState.current = calcState.current === '0' ? digit : calcState.current + digit;
    }
    calcRender();
}

function calcInputDecimal() {
    if (calcState.resetOnNextDigit) {
        calcState.current = '0.';
        calcState.resetOnNextDigit = false;
        calcRender();
        return;
    }
    if (!calcState.current.includes('.')) calcState.current += '.';
    calcRender();
}

function calcBackspace() {
    if (calcState.resetOnNextDigit) return;
    calcState.current = calcState.current.length > 1 ? calcState.current.slice(0, -1) : '0';
    calcRender();
}

function calcClear() {
    calcReset('0');
}

function calcSetOperator(nextOp) {
    const inputValue = calcCurrentValue();

    if (calcState.operator && calcState.resetOnNextDigit) {
        // No new digits typed since the last operator — just swap it.
        calcState.operator = nextOp;
        calcRender();
        return;
    }

    if (calcState.previous == null) {
        calcState.previous = inputValue;
    } else if (calcState.operator) {
        calcState.previous = calcCompute(calcState.previous, inputValue, calcState.operator);
        calcState.current = calcFormat(calcState.previous);
    }

    calcState.operator = nextOp;
    calcState.resetOnNextDigit = true;
    calcRender();
}

function calcEquals() {
    if (calcState.operator == null || calcState.previous == null) return;
    const inputValue = calcCurrentValue();
    calcState.current = calcFormat(calcCompute(calcState.previous, inputValue, calcState.operator));
    calcState.previous = null;
    calcState.operator = null;
    calcState.resetOnNextDigit = true;
    calcRender();
}

function openLogModal(categoryValue = '') {
    editingTxIndex = null;
    document.getElementById('logModalTitle').textContent = 'Log Spending';
    document.getElementById('logModalPrimaryBtn').textContent = 'Log Transaction';
    document.getElementById('deleteFromModalBtn').style.display = 'none';
    closeCalcKeypad();

    // ensure select options are populated
    populateLogCategorySelect();

    if (categoryValue) {
        document.getElementById('logCategory').value = categoryValue;
    } else {
        document.getElementById('logCategory').value = '';
    }
    document.getElementById('logNote').value = '';
    calcReset('0');

    logModalRecurringState = categoryValue ? isRecurring(categoryValue) : false;
    renderRecurringToggle();
    renderCategoryDetailInModal();

    document.getElementById('logSpendingModal').classList.add('active');
    lockBodyScroll();
}

// Tapping a transaction row (renderTransactionLog, or the category detail
// list below) opens the same modal pre-filled, so a mistake can be fixed
// directly instead of only being deletable. Tapping a budget category still
// goes through openLogModal() above and always starts a blank "add new" entry.
function openEditTransactionModal(txIndex) {
    const tx = appData.transactionLog[txIndex];
    if (!tx) return;
    editingTxIndex = txIndex;
    closeCalcKeypad();

    document.getElementById('logModalTitle').textContent = 'Edit Transaction';
    document.getElementById('logModalPrimaryBtn').textContent = 'Save Changes';
    document.getElementById('deleteFromModalBtn').style.display = 'flex';

    populateLogCategorySelect();
    document.getElementById('logCategory').value = tx.key;
    document.getElementById('logNote').value = tx.note || '';
    calcReset(tx.amount);

    logModalRecurringState = !!tx.recurring;
    renderRecurringToggle();
    renderCategoryDetailInModal(); // hides itself since editingTxIndex is now set

    document.getElementById('logSpendingModal').classList.add('active');
    lockBodyScroll();
}

async function deleteFromEditModal() {
    if (editingTxIndex == null) return;
    const txIndex = editingTxIndex;
    await deleteTransaction(txIndex);
    resetToAddModeForCurrentCategory();
}

function closeLogModal() {
    document.getElementById('logSpendingModal').classList.remove('active');
    unlockBodyScroll();
    closeCalcKeypad();
    document.getElementById('logCategory').value = '';
    document.getElementById('logNote').value     = '';
    calcReset('0');
    logModalRecurringState = false;
    editingTxIndex = null;
}

// Used after saving or deleting from within the category detail view — the
// popup stays open on that category (per your call) so you can keep
// reviewing/fixing entries instead of it closing after every single action.
function resetToAddModeForCurrentCategory() {
    editingTxIndex = null;
    document.getElementById('logModalTitle').textContent = 'Log Spending';
    document.getElementById('logModalPrimaryBtn').textContent = 'Log Transaction';
    document.getElementById('deleteFromModalBtn').style.display = 'none';
    document.getElementById('logNote').value = '';
    calcReset('0');
    closeCalcKeypad();

    const category = document.getElementById('logCategory').value;
    logModalRecurringState = category ? isRecurring(category) : false;
    renderRecurringToggle();
    renderCategoryDetailInModal();
}

// Category snapshot shown inside the Log Spending modal: planned vs. spent
// this month, plus every transaction already logged for that category
// (tap to edit, trash to delete) — hidden until a category is chosen and
// while a single entry is being edited.
function renderCategoryDetailInModal() {
    const section = document.getElementById('categoryDetailSection');
    if (!section) return;
    const category = document.getElementById('logCategory').value;

    if (editingTxIndex != null || !category) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';

    const catData = computeCategoryPlannedActual().find(c => c.key === category) || { planned: 0, actual: 0 };
    const pct = catData.planned > 0 ? Math.min((catData.actual / catData.planned) * 100, 100) : 0;
    const over = catData.planned > 0 && catData.actual > catData.planned;

    document.getElementById('categoryDetailSpent').textContent = formatMoney(catData.actual);
    document.getElementById('categoryDetailPlanned').textContent = formatMoney(catData.planned);
    const fill = document.getElementById('categoryDetailFill');
    fill.style.width = pct + '%';
    fill.style.background = over ? 'var(--danger)' : 'var(--primary)';

    const txList = document.getElementById('categoryDetailTxList');
    const txs = currentMonthTransactions().filter(tx => tx.key === category);

    if (txs.length === 0) {
        txList.innerHTML = '<p class="category-detail-empty">Nothing logged for this category yet.</p>';
        return;
    }

    txList.innerHTML = txs.slice().reverse().map(tx => {
        const txIndex = appData.transactionLog.indexOf(tx);
        const date = new Date(tx.date || tx.timestamp).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
        return `
        <div class="category-detail-row" onclick="openEditTransactionModal(${txIndex})">
            <div class="category-detail-row-info">
                <div class="category-detail-row-note">${tx.note || 'No note'}</div>
                <div class="category-detail-row-date">${date}</div>
            </div>
            <div class="category-detail-row-amount">${formatMoney(tx.amount)}</div>
            <button class="tx-delete-btn" type="button" onclick="event.stopPropagation(); deleteTransaction(${txIndex})" aria-label="Delete transaction">${icon('trash')}</button>
        </div>`;
    }).join('');
}

function onLogCategoryChange() {
    const category = document.getElementById('logCategory').value;
    logModalRecurringState = category ? isRecurring(category) : false;
    renderRecurringToggle();
    renderCategoryDetailInModal();
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
        ? `<span class="recurring-icon">${icon('repeat')}</span>
           <span class="recurring-text">
               <span class="recurring-title">Recurring payment — On</span>
               <span class="recurring-sub">This category auto-fills every month</span>
           </span>
           <span class="recurring-check">${icon('check-circle')}</span>`
        : `<span class="recurring-icon">${icon('repeat')}</span>
           <span class="recurring-text">
               <span class="recurring-title">Make this a recurring payment</span>
               <span class="recurring-sub">Skip logging it manually each month</span>
           </span>
           <span class="recurring-check">${icon('circle')}</span>`;
}


async function saveTransaction() {
    const category = document.getElementById('logCategory').value;
    const amount   = calcCurrentValue();
    const note     = document.getElementById('logNote').value;

    if (!category || !amount) {
        alert('Please select a category and enter an amount.');
        return;
    }

    if (editingTxIndex != null) {
        const tx = appData.transactionLog[editingTxIndex];
        if (!tx) { closeLogModal(); return; }
        tx.key = category;
        tx.amount = amount;
        tx.note = note;
        tx.recurring = logModalRecurringState;
        // date/monthKey/timestamp stay as originally logged — editing fixes
        // what was spent, not when it happened.
    } else {
        appData.transactionLog.push({
            key:       category,
            amount,
            note,
            recurring: logModalRecurringState,
            monthKey:  currentMonthKey(),
            date:      new Date().toISOString(),
            timestamp: new Date().toISOString()
        });
    }

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
    updateDashboard();
    // Stays open on this category (per your call) instead of closing, so
    // logging several expenses in a row or fixing a mistake doesn't mean
    // reopening the popup each time — tap "Done" when you're finished.
    resetToAddModeForCurrentCategory();
}

function populateLogCategorySelect() {
    // Rebuilding the options wipes the current selection unless we restore
    // it — this now matters because the modal stays open across saves/
    // deletes (see resetToAddModeForCurrentCategory), each of which calls
    // updateDashboard() -> populateLogCategorySelect() while a category may
    // still be selected.
    const select = document.getElementById('logCategory');
    const previousValue = select.value;

    // <option> elements can't render SVG, so these stay plain text.
    const labels = {
        rent: 'Rent', groceries: 'Groceries', utilities: 'Utilities',
        phoneBill: 'Phone Bill', savings: 'Savings', investments: 'Investments',
        misc: 'Miscellaneous', transportation: 'Transit / Gas'
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

    select.innerHTML = options;
    if (previousValue) select.value = previousValue;
}

// ===== Undo Toast =====
// Optimistic-delete pattern used by deleteTransaction() and clearTransactions()
// below: remove locally + re-render immediately, then only actually persist
// the deletion to Firestore after `timeout` ms — unless the user clicks
// Undo first, in which case local state is restored and no write happens
// at all. Replaces the old blocking confirm() + instantly-permanent delete.
let undoToastTimer = null;
let undoToastPending = null;

function showUndoToast(message, { onUndo, onCommit, timeout = 6000 }) {
    const toast = document.getElementById('undoToast');
    if (!toast) { onCommit(); return; }

    // A second delete while a toast is already showing commits the first
    // one immediately (it's already off-screen/gone from the list) so only
    // one undo can ever be pending, and nothing is silently lost.
    if (undoToastTimer) {
        clearTimeout(undoToastTimer);
        const prev = undoToastPending;
        undoToastPending = null;
        if (prev) prev.onCommit();
    }

    document.getElementById('undoToastMessage').textContent = message;
    toast.classList.add('active');
    undoToastPending = { onUndo, onCommit };
    undoToastTimer = setTimeout(() => {
        undoToastTimer = null;
        const pending = undoToastPending;
        undoToastPending = null;
        toast.classList.remove('active');
        if (pending) pending.onCommit();
    }, timeout);
}

function handleUndoToastClick() {
    if (!undoToastTimer) return;
    clearTimeout(undoToastTimer);
    undoToastTimer = null;
    const pending = undoToastPending;
    undoToastPending = null;
    document.getElementById('undoToast').classList.remove('active');
    if (pending) pending.onUndo();
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
    // Only this month's transactions — matches the button's own label.
    // (Previously this wiped appData.transactionLog entirely, silently
    // deleting every prior month's history along with it.)
    const monthKey = currentMonthKey();
    const removed = [];
    appData.transactionLog = appData.transactionLog.filter(tx => {
        if (monthKeyOf(tx) !== monthKey) return true;
        removed.push(tx);
        return false;
    });

    if (removed.length === 0) {
        alert('No transactions logged this month yet.');
        return;
    }

    updateDashboard();
    showUndoToast(`Cleared ${removed.length} transaction${removed.length === 1 ? '' : 's'} from this month.`, {
        onUndo: () => {
            appData.transactionLog.push(...removed);
            updateDashboard();
        },
        onCommit: () => saveTransactionLogToFirestore()
    });
}

async function factoryReset() {
    if (confirm('This will permanently delete all your data and cannot be undone. Are you sure?')) {
        try {
            const uid = currentUser.uid;
            appData = freshAppData();
            // Every doc this app writes under budget/ — previously this list
            // was missing userProfile and pdfPrefs (so "Factory Reset" didn't
            // actually wipe your name/job-title or PDF layout choices despite
            // its own label promising to), plus the two new uiPrefs/
            // savingsGoals docs added alongside this fix.
            const docIds = ['userProfile', 'profile', 'expenses', 'transactions', 'recurring', 'pdfPrefs', 'uiPrefs', 'savingsGoals'];
            await Promise.all(docIds.map(id => db.collection('users').doc(uid).collection('budget').doc(id).delete()));
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
    // txIndex refers to the index in appData.transactionLog
    if (txIndex < 0 || txIndex >= appData.transactionLog.length) return;

    const [removed] = appData.transactionLog.splice(txIndex, 1);
    updateDashboard();

    showUndoToast('Transaction deleted.', {
        onUndo: () => {
            appData.transactionLog.splice(txIndex, 0, removed);
            updateDashboard();
        },
        onCommit: () => saveTransactionLogToFirestore()
    });
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
        const [userProfileSnap, budgetSnap, expensesSnap, txSnap, recurringSnap, pdfPrefsSnap, uiPrefsSnap, goalsSnap] = await Promise.all([
            userDoc.collection('budget').doc('userProfile').get(),
            userDoc.collection('budget').doc('profile').get(),
            userDoc.collection('budget').doc('expenses').get(),
            userDoc.collection('budget').doc('transactions').get(),
            userDoc.collection('budget').doc('recurring').get(),
            userDoc.collection('budget').doc('pdfPrefs').get(),
            userDoc.collection('budget').doc('uiPrefs').get(),
            userDoc.collection('budget').doc('savingsGoals').get()
        ]);
        if (userProfileSnap.exists) appData.userProfile     = userProfileSnap.data();
        if (budgetSnap.exists)      appData.budgetProfile   = budgetSnap.data();
        if (expensesSnap.exists)    appData.expensesProfile = expensesSnap.data();
        if (txSnap.exists)          appData.transactionLog  = txSnap.data().log || [];
        if (recurringSnap.exists)   appData.recurringPayments = recurringSnap.data().items || [];
        if (goalsSnap.exists)       appData.savingsGoals    = goalsSnap.data().goals || [];
        if (pdfPrefsSnap.exists) {
            const savedPrefs = pdfPrefsSnap.data();
            appData.pdfPrefs = {
                ...appData.pdfPrefs,
                ...savedPrefs,
                fields: { ...appData.pdfPrefs.fields, ...(savedPrefs.fields || {}) }
            };
        }
        if (uiPrefsSnap.exists) {
            appData.uiPrefs = { ...appData.uiPrefs, ...uiPrefsSnap.data() };
        }
        applyTheme(appData.uiPrefs.theme);

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

// Older transactions saved before monthKey existed fall back to their date.
function monthKeyOf(tx) {
    if (tx.monthKey) return tx.monthKey;
    const d = new Date(tx.date || tx.timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// The dashboard, budget bars, spending chart, and PDF all reflect the
// current month only — history stays in Firestore but isn't summed into
// "this month's" totals, so a recurring category resets to $0 each month
// instead of accumulating every prior month's charge on top of it.
function currentMonthTransactions() {
    const monthKey = currentMonthKey();
    return appData.transactionLog.filter(tx => monthKeyOf(tx) === monthKey);
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

// ===== Savings Goals =====
// Deliberately separate from the monthly recurring "Savings Target" budget
// category above — goals are longer-term ("Trip to Japan by December") and
// don't touch the monthly income/expense math at all.
let activeContributeGoalId = null;

function renderSavingsGoals() {
    const container = document.getElementById('savingsGoalsContainer');
    if (!container) return;

    const goals = appData.savingsGoals || [];
    if (goals.length === 0) {
        container.innerHTML = '<p class="empty-state">No savings goals yet — set one for something you\'re saving toward.</p>';
        return;
    }

    container.innerHTML = goals.map(g => {
        const target = parseFloat(g.targetAmount) || 0;
        const current = parseFloat(g.currentAmount) || 0;
        const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
        const complete = target > 0 && current >= target;
        const milestones = [25, 50, 75].map(m =>
            `<span class="goal-milestone ${pct >= m ? 'reached' : ''}" style="left:${m}%"></span>`
        ).join('');

        let daysBadge = '';
        if (g.targetDate) {
            const daysLeft = Math.ceil((new Date(g.targetDate) - new Date()) / 86400000);
            daysBadge = daysLeft < 0
                ? `<span class="goal-days-badge is-due">Past due</span>`
                : `<span class="goal-days-badge ${daysLeft <= 30 ? 'is-due' : ''}">${daysLeft} day${daysLeft === 1 ? '' : 's'} left</span>`;
        }

        return `
        <div class="goal-card">
            <div class="goal-card-top">
                <div>
                    <div class="goal-name">${g.name}${complete ? ' ' + icon('check-circle', 'legend-icon') : ''}</div>
                    <div class="goal-meta">${pct.toFixed(0)}% saved</div>
                </div>
                <div class="goal-amounts">
                    <div class="goal-saved">${formatMoney(current)}</div>
                    <div class="goal-target">of ${formatMoney(target)}</div>
                </div>
            </div>
            <div class="goal-track">
                <div class="goal-fill" style="width:${pct}%; background:${g.color};"></div>
                ${milestones}
            </div>
            <div class="goal-footer">
                ${daysBadge}
                <div style="display:flex; gap:6px; margin-left:auto;">
                    <button class="goal-add-btn" onclick="openContributeModal('${g.id}')">${icon('plus')} Add Funds</button>
                    <button class="goal-delete-btn" onclick="deleteGoal('${g.id}')" aria-label="Delete goal">${icon('trash')}</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function openNewGoalModal() {
    document.getElementById('goalName').value = '';
    document.getElementById('goalTarget').value = '';
    document.getElementById('goalStarting').value = '';
    document.getElementById('goalDate').value = '';
    document.getElementById('newGoalModal').classList.add('active');
    lockBodyScroll();
}

function closeNewGoalModal() {
    document.getElementById('newGoalModal').classList.remove('active');
    unlockBodyScroll();
}

async function saveNewGoal() {
    const name       = document.getElementById('goalName').value.trim();
    const target     = parseFloat(document.getElementById('goalTarget').value) || 0;
    const starting   = parseFloat(document.getElementById('goalStarting').value) || 0;
    const targetDate = document.getElementById('goalDate').value || null;

    if (!name || target <= 0) {
        alert('Please enter a goal name and a target amount greater than $0.');
        return;
    }

    appData.savingsGoals.push({
        id: `goal_${Date.now()}`,
        name,
        targetAmount: target,
        currentAmount: Math.max(0, starting),
        targetDate,
        color: CUSTOM_COLOR_POOL[appData.savingsGoals.length % CUSTOM_COLOR_POOL.length],
        createdAt: new Date().toISOString()
    });

    await saveSavingsGoalsToFirestore();
    closeNewGoalModal();
    renderSavingsGoals();
}

function openContributeModal(goalId) {
    const goal = appData.savingsGoals.find(g => g.id === goalId);
    if (!goal) return;
    activeContributeGoalId = goalId;
    document.getElementById('contributeGoalName').textContent =
        `Adding to "${goal.name}" — ${formatMoney(goal.currentAmount)} of ${formatMoney(goal.targetAmount)} saved so far.`;
    document.getElementById('contributeAmount').value = '';
    document.getElementById('contributeGoalModal').classList.add('active');
    lockBodyScroll();
}

function closeContributeModal() {
    document.getElementById('contributeGoalModal').classList.remove('active');
    unlockBodyScroll();
    activeContributeGoalId = null;
}

async function saveContribution() {
    const amount = parseFloat(document.getElementById('contributeAmount').value) || 0;
    if (!activeContributeGoalId || amount <= 0) {
        alert('Please enter an amount greater than $0.');
        return;
    }
    const goal = appData.savingsGoals.find(g => g.id === activeContributeGoalId);
    if (!goal) return;

    goal.currentAmount = (parseFloat(goal.currentAmount) || 0) + amount;
    await saveSavingsGoalsToFirestore();
    closeContributeModal();
    renderSavingsGoals();
}

async function deleteGoal(id) {
    if (!confirm('Delete this savings goal? This cannot be undone.')) return;
    appData.savingsGoals = appData.savingsGoals.filter(g => g.id !== id);
    await saveSavingsGoalsToFirestore();
    renderSavingsGoals();
}

async function saveSavingsGoalsToFirestore() {
    if (!currentUser) return;
    try {
        await db.collection('users').doc(currentUser.uid).collection('budget').doc('savingsGoals')
            .set({ goals: appData.savingsGoals, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) { console.error('saveSavingsGoals:', e); }
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
    lockBodyScroll();
}

async function dismissPdfReminder() {
    appData.pdfPrefs.lastDismissedMonthKey = currentMonthKey();
    await savePdfPrefsToFirestore();
    document.getElementById('pdfReminderModal').classList.remove('active');
    unlockBodyScroll();
}

async function confirmPdfReminder() {
    document.getElementById('pdfReminderModal').classList.remove('active');
    unlockBodyScroll();
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

// ===== Data Export / Import =====
// Same Blob + <a download> pattern downloadMonthlyPdf() uses above — no new
// download mechanism needed. Note for standalone/installed home-screen apps:
// this works reliably on desktop and installed Android PWAs; standalone iOS
// home-screen apps have a known OS-level quirk where downloads sometimes
// open in a new tab instead of saving — that's a platform limitation, not
// something fixable from inside the page.
function triggerDownload(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function csvEscape(value) {
    const str = String(value ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function exportTransactionsCsv() {
    if (!appData.transactionLog.length) {
        alert('No transactions to export yet.');
        return;
    }
    const header = ['Date', 'Category', 'Amount', 'Note', 'Recurring'];
    const rows = appData.transactionLog.map(tx => [
        new Date(tx.date || tx.timestamp).toLocaleDateString('en-CA'),
        tx.key,
        (parseFloat(tx.amount) || 0).toFixed(2),
        tx.note || '',
        tx.recurring ? 'Yes' : 'No'
    ]);
    const csv = [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');
    triggerDownload(csv, `BudgetApp-Transactions-${currentMonthKey()}.csv`, 'text/csv');
}

function downloadFullBackup() {
    const backup = { exportedAt: new Date().toISOString(), version: 1, data: appData };
    triggerDownload(JSON.stringify(backup, null, 2), `BudgetApp-Backup-${currentMonthKey()}.json`, 'application/json');
}

function triggerRestoreFilePicker() {
    document.getElementById('restoreFileInput').click();
}

async function handleRestoreFile(event) {
    const file = event.target.files[0];
    event.target.value = ''; // allow re-selecting the same file again later
    if (!file) return;

    let parsed;
    try {
        parsed = JSON.parse(await file.text());
    } catch (e) {
        alert('That file could not be read as a valid BudgetApp backup (invalid JSON).');
        return;
    }

    const incoming = parsed.data || parsed; // tolerate a raw appData dump too
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
        alert('That file does not look like a BudgetApp backup.');
        return;
    }

    if (!confirm('This will replace ALL of your current data (profile, budget, transactions, goals, settings) with the contents of this backup. This cannot be undone. Continue?')) {
        return;
    }

    const fresh = freshAppData();
    appData = {
        ...fresh,
        ...incoming,
        pdfPrefs: { ...fresh.pdfPrefs, ...(incoming.pdfPrefs || {}), fields: { ...fresh.pdfPrefs.fields, ...(incoming.pdfPrefs?.fields || {}) } },
        uiPrefs:  { ...fresh.uiPrefs, ...(incoming.uiPrefs || {}) }
    };

    await Promise.all([
        saveUserProfileToFirestore(),
        saveBudgetToFirestore(),
        saveExpensesToFirestore(),
        saveTransactionLogToFirestore(),
        saveRecurringPaymentsToFirestore(),
        saveSavingsGoalsToFirestore(),
        savePdfPrefsToFirestore(),
        saveUiPrefsToFirestore()
    ]);

    applyTheme(appData.uiPrefs.theme);
    alert('Backup restored successfully.');
    checkAuthStatus();
}