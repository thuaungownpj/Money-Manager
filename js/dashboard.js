import { supabase } from './supabase-config.js';
import { getLanguage, setLanguage, applyTranslations } from './i18n.js';

const appContent = document.getElementById('app-content');
const pageTitle = document.getElementById('page-title');
const topbarActions = document.getElementById('topbar-actions');
const menuItems = document.querySelectorAll('.menu-item');
const logoutBtn = document.getElementById('logout-btn');

// အလံ Element များ
const btnEn = document.getElementById('btn-en');
const btnMm = document.getElementById('btn-mm');

let allTransactions = []; 

// အလံများကို ရွေးချယ်ထားသော ဘာသာစကားအလိုက် လင်း/မှိန် ပြုလုပ်ခြင်း
function updateFlagUI() {
    const lang = getLanguage();
    if(lang === 'en') {
        btnEn.style.opacity = '1';
        btnEn.style.transform = 'scale(1.1)';
        btnEn.style.filter = 'grayscale(0%)';
        
        btnMm.style.opacity = '0.4';
        btnMm.style.transform = 'scale(0.9)';
        btnMm.style.filter = 'grayscale(80%)';
    } else {
        btnMm.style.opacity = '1';
        btnMm.style.transform = 'scale(1.1)';
        btnMm.style.filter = 'grayscale(0%)';
        
        btnEn.style.opacity = '0.4';
        btnEn.style.transform = 'scale(0.9)';
        btnEn.style.filter = 'grayscale(80%)';
    }
}

// ဘာသာစကားပြောင်းပေးမည့် Function
function switchLanguage(newLang) {
    if(getLanguage() === newLang) return; // ရွေးထားပြီးသားဆိုရင် ဘာမှမလုပ်ပါ
    
    setLanguage(newLang);
    updateFlagUI(); 
    
    const activeMenu = document.querySelector('.menu-item.active');
    if (activeMenu) {
        const spanTag = activeMenu.querySelector('span:nth-child(2)');
        if(spanTag) {
            const i18nKey = spanTag.getAttribute('data-i18n');
            if(i18nKey) pageTitle.setAttribute('data-i18n', i18nKey);
        }
    }
    applyTranslations(); 
}

async function initApp() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    applyTranslations();
    updateFlagUI();

    // အလံတစ်ခုချင်းစီကို Click လုပ်သည့်အခါ
    btnEn.addEventListener('click', () => switchLanguage('en'));
    btnMm.addEventListener('click', () => switchLanguage('mm'));

    loadView('dashboard'); 
}

// --- 3. SPA Router (Fetch HTML files) ---
async function loadView(viewName) {
    appContent.innerHTML = '<p class="text-center text-muted" style="margin-top: 50px;">Loading...</p>';
    topbarActions.innerHTML = ''; 
    
    try {
        let response;
        switch (viewName) {
            case 'dashboard':
                pageTitle.setAttribute('data-i18n', 'menu_dashboard');
                response = await fetch('views/dashboard-view.html');
                appContent.innerHTML = await response.text();
                setupDateFilter(initDashboardLogic);
                break;

            case 'income-category':
                pageTitle.setAttribute('data-i18n', 'menu_income_cat');
                response = await fetch('views/income-category.html');
                appContent.innerHTML = await response.text();
                initIncomeCategoryLogic();
                break;

            case 'expense-category':
                pageTitle.setAttribute('data-i18n', 'menu_expense_cat');
                response = await fetch('views/expense-category.html');
                appContent.innerHTML = await response.text();
                initExpenseCategoryLogic();
                break;

            case 'total-income':
                pageTitle.setAttribute('data-i18n', 'menu_total_income');
                response = await fetch('views/total-income.html');
                appContent.innerHTML = await response.text();
                setupDateFilter(initTotalIncomeLogic);
                break;

            case 'total-expense':
                pageTitle.setAttribute('data-i18n', 'menu_total_expense');
                response = await fetch('views/total-expense.html');
                appContent.innerHTML = await response.text();
                setupDateFilter(initTotalExpenseLogic);
                break;
                
            default:
                throw new Error("View not found");
        }
        // View အသစ်ရောက်တိုင်း ဘာသာစကား ထပ်မံစစ်ဆေးပေးမည်
        applyTranslations();
    } catch (error) {
        console.error("Error loading view:", error);
        appContent.innerHTML = '<p class="text-center text-danger" style="margin-top: 50px;">Error loading view.</p>';
    }
}

// Menu နှိပ်တိုင်း အလုပ်လုပ်ရန်
menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        menuItems.forEach(i => i.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const view = e.currentTarget.getAttribute('data-view');
        loadView(view);
    });
});

// --- Date Filter UI Setup (Dropdown System) ---
function setupDateFilter(callbackFunction) {
    topbarActions.innerHTML = `
        <div class="date-filter-container" style="display: flex; align-items: center; gap: 10px;">
            <select id="date-preset" class="date-input" style="padding: 6px 10px; border-radius: 6px; cursor: pointer; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border); outline: none;">
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="1month">Last 1 Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="1year">Last 1 Year</option>
                <option value="custom">Custom</option>
            </select>
            
            <div id="custom-date-fields" style="display: none; align-items: center; gap: 8px;">
                <input type="date" id="filter-start" class="date-input">
                <span class="date-separator">to</span>
                <input type="date" id="filter-end" class="date-input">
                <button id="filter-btn" class="btn-filter">Filter</button>
            </div>
        </div>
    `;
    
    const presetSelect = document.getElementById('date-preset');
    const customFields = document.getElementById('custom-date-fields');
    const filterStart = document.getElementById('filter-start');
    const filterEnd = document.getElementById('filter-end');
    const filterBtn = document.getElementById('filter-btn');

    function formatDate(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function applyPreset() {
        const preset = presetSelect.value;
        const today = new Date();
        let start = new Date();
        let end = new Date(); 

        if (preset === 'custom') {
            customFields.style.display = 'flex'; 
            return; 
        } else {
            customFields.style.display = 'none'; 
        }

        if (preset === 'today') {
            start = today;
        } else if (preset === '7days') {
            start.setDate(today.getDate() - 7);
        } else if (preset === '1month') {
            start.setMonth(today.getMonth() - 1);
        } else if (preset === '3months') {
            start.setMonth(today.getMonth() - 3);
        } else if (preset === '1year') {
            start.setFullYear(today.getFullYear() - 1);
        }

        filterStart.value = formatDate(start);
        filterEnd.value = formatDate(end);
        
        callbackFunction(); 
    }

    presetSelect.addEventListener('change', applyPreset);
    filterBtn.addEventListener('click', callbackFunction);

    applyPreset(); 
}

async function fetchTransactions() {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

    if (!error && data) {
        allTransactions = data;
    }
}

// ==========================================
// 4. Dashboard Logic
// ==========================================
async function initDashboardLogic() {
    await fetchTransactions();
    
    const filterStart = document.getElementById('filter-start').value;
    const filterEnd = document.getElementById('filter-end').value;
    
    let filtered = allTransactions;
    if (filterStart) filtered = filtered.filter(t => t.transaction_date >= filterStart);
    if (filterEnd) filtered = filtered.filter(t => t.transaction_date <= filterEnd);

    let tInc = 0, tExp = 0;
    filtered.forEach(t => {
        if (t.type === 'income') tInc += Number(t.amount);
        if (t.type === 'expense') tExp += Number(t.amount);
    });

    const format = amt => new Intl.NumberFormat('en-US').format(amt) + ' Ks';
    const diff = tInc - tExp;

    if(document.getElementById('card-income')) {
        document.getElementById('card-income').textContent = format(tInc);
        document.getElementById('card-expense').textContent = format(tExp);
        document.getElementById('card-profit').textContent = format(diff > 0 ? diff : 0);
        document.getElementById('card-loss').textContent = format(diff < 0 ? Math.abs(diff) : 0);
    }

    const list = document.getElementById('transaction-list');
    if(!list) return;

    list.innerHTML = '';
    if (filtered.length === 0) {
        list.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No transactions found.</td></tr>';
        return;
    }
    
    filtered.forEach(t => {
        const tr = document.createElement('tr');
        let badge = t.type === 'income' ? 'badge-income' : (t.type === 'expense' ? 'badge-expense' : 'badge-saving');
        tr.innerHTML = `
            <td>${t.transaction_date}</td>
            <td>${t.category}</td>
            <td><span class="type-badge ${badge}">${t.type}</span></td>
            <td>${new Intl.NumberFormat('en-US').format(t.amount)} Ks</td>
            <td><button class="btn-delete" data-id="${t.id}">Delete</button></td>
        `;
        list.appendChild(tr);
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm('Are you sure you want to delete?')) {
                const id = e.target.getAttribute('data-id');
                await supabase.from('transactions').delete().eq('id', id);
                initDashboardLogic(); 
            }
        });
    });
}

// ==========================================
// 5. Total Income Report Logic & Form
// ==========================================
async function initTotalIncomeLogic() {
    const categorySelect = document.getElementById('inc-category');
    const dateInput = document.getElementById('inc-date');
    const addForm = document.getElementById('add-income-form');
    
    dateInput.value = new Date().toISOString().split('T')[0];
    
    let incomeCats = JSON.parse(localStorage.getItem('app_income_categories')) || [];
    categorySelect.innerHTML = incomeCats.length > 0 
        ? incomeCats.map(c => `<option value="${c.icon} ${c.name}">${c.icon} ${c.name}</option>`).join('')
        : '<option value="Other">No category found</option>';

    const newForm = addForm.cloneNode(true);
    addForm.parentNode.replaceChild(newForm, addForm);
    
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = newForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        const record = {
            transaction_date: document.getElementById('inc-date').value,
            category: document.getElementById('inc-category').value,
            type: 'income',
            amount: document.getElementById('inc-amount').value
        };

        const { error } = await supabase.from('transactions').insert([record]);
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Income';

        if (error) {
            alert("Error saving data: " + error.message);
        } else {
            document.getElementById('inc-amount').value = ''; 
            initTotalIncomeLogic(); 
        }
    });

    await fetchTransactions(); 
    const filterStart = document.getElementById('filter-start').value;
    const filterEnd = document.getElementById('filter-end').value;
    
    let incomes = allTransactions.filter(t => t.type === 'income');
    if (filterStart) incomes = incomes.filter(t => t.transaction_date >= filterStart);
    if (filterEnd) incomes = incomes.filter(t => t.transaction_date <= filterEnd);

    let total = 0;
    incomes.forEach(t => total += Number(t.amount));
    document.getElementById('report-total-income').textContent = new Intl.NumberFormat('en-US').format(total) + ' Ks';

    const list = document.getElementById('income-report-list');
    list.innerHTML = '';
    
    if(incomes.length === 0) {
        list.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No income found for this period.</td></tr>';
        return;
    }

    incomes.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.transaction_date}</td>
            <td><span class="type-badge badge-income">${t.category}</span></td>
            <td style="color: #10b981; font-weight: 500;">+ ${new Intl.NumberFormat('en-US').format(t.amount)} Ks</td>
        `;
        list.appendChild(tr);
    });
}

// ==========================================
// 6. Total Expense Report Logic & Form
// ==========================================
async function initTotalExpenseLogic() {
    const categorySelect = document.getElementById('exp-category');
    const dateInput = document.getElementById('exp-date');
    const addForm = document.getElementById('add-expense-form');
    
    dateInput.value = new Date().toISOString().split('T')[0];
    
    let expenseCats = JSON.parse(localStorage.getItem('app_expense_categories')) || [];
    categorySelect.innerHTML = expenseCats.length > 0 
        ? expenseCats.map(c => `<option value="${c.icon} ${c.name}">${c.icon} ${c.name}</option>`).join('')
        : '<option value="Other">No category found</option>';

    const newForm = addForm.cloneNode(true);
    addForm.parentNode.replaceChild(newForm, addForm);
    
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = newForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        const record = {
            transaction_date: document.getElementById('exp-date').value,
            category: document.getElementById('exp-category').value,
            type: 'expense',
            amount: document.getElementById('exp-amount').value
        };

        const { error } = await supabase.from('transactions').insert([record]);
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Expense';

        if (error) {
            alert("Error saving data: " + error.message);
        } else {
            document.getElementById('exp-amount').value = ''; 
            initTotalExpenseLogic(); 
        }
    });

    await fetchTransactions(); 
    const filterStart = document.getElementById('filter-start').value;
    const filterEnd = document.getElementById('filter-end').value;
    
    let expenses = allTransactions.filter(t => t.type === 'expense');
    if (filterStart) expenses = expenses.filter(t => t.transaction_date >= filterStart);
    if (filterEnd) expenses = expenses.filter(t => t.transaction_date <= filterEnd);

    let total = 0;
    expenses.forEach(t => total += Number(t.amount));
    document.getElementById('report-total-expense').textContent = new Intl.NumberFormat('en-US').format(total) + ' Ks';

    const list = document.getElementById('expense-report-list');
    list.innerHTML = '';
    
    if(expenses.length === 0) {
        list.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No expenses found for this period.</td></tr>';
        return;
    }

    expenses.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.transaction_date}</td>
            <td><span class="type-badge badge-expense">${t.category}</span></td>
            <td style="color: var(--danger); font-weight: 500;">- ${new Intl.NumberFormat('en-US').format(t.amount)} Ks</td>
        `;
        list.appendChild(tr);
    });
}

// ==========================================
// 7. Income & Expense Categories Logic
// ==========================================
function initIncomeCategoryLogic() {
    const form = document.getElementById('income-category-form');
    renderIncomeCategoriesList(); 
    
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let cats = JSON.parse(localStorage.getItem('app_income_categories')) || [];
        cats.push({ id: Date.now(), icon: document.getElementById('inc-cat-icon').value, name: document.getElementById('inc-cat-name').value.trim() });
        localStorage.setItem('app_income_categories', JSON.stringify(cats));
        document.getElementById('inc-cat-name').value = ''; 
        renderIncomeCategoriesList(); 
    });
}

function renderIncomeCategoriesList() {
    const list = document.getElementById('income-category-list');
    if(!list) return;
    let cats = JSON.parse(localStorage.getItem('app_income_categories')) || [];
    list.innerHTML = cats.length ? cats.map(c => `<div class="category-item"><div class="cat-info"><div class="cat-icon-display">${c.icon}</div><div class="cat-name-display">${c.name}</div></div><button class="btn-delete-cat" onclick="deleteIncCat(${c.id})">🗑️</button></div>`).join('') : '<p class="text-muted">No data.</p>';
}

window.deleteIncCat = function(id) {
    if(confirm('Are you sure you want to delete this category?')){ 
        let cats = JSON.parse(localStorage.getItem('app_income_categories')); 
        localStorage.setItem('app_income_categories', JSON.stringify(cats.filter(c=>c.id!==id))); 
        renderIncomeCategoriesList();
    }
}

function initExpenseCategoryLogic() {
    const form = document.getElementById('expense-category-form');
    renderExpenseCategoriesList(); 
    
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let cats = JSON.parse(localStorage.getItem('app_expense_categories')) || [];
        cats.push({ id: Date.now(), icon: document.getElementById('exp-cat-icon').value, name: document.getElementById('exp-cat-name').value.trim() });
        localStorage.setItem('app_expense_categories', JSON.stringify(cats));
        document.getElementById('exp-cat-name').value = ''; 
        renderExpenseCategoriesList(); 
    });
}

function renderExpenseCategoriesList() {
    const list = document.getElementById('expense-category-list');
    if(!list) return;
    let cats = JSON.parse(localStorage.getItem('app_expense_categories')) || [];
    list.innerHTML = cats.length ? cats.map(c => `<div class="category-item"><div class="cat-info"><div class="cat-icon-display" style="color:var(--danger); background:rgba(239,68,68,0.1)">${c.icon}</div><div class="cat-name-display">${c.name}</div></div><button class="btn-delete-cat" onclick="deleteExpCat(${c.id})">🗑️</button></div>`).join('') : '<p class="text-muted">No data.</p>';
}

window.deleteExpCat = function(id) {
    if(confirm('Are you sure you want to delete this category?')){ 
        let cats = JSON.parse(localStorage.getItem('app_expense_categories')); 
        localStorage.setItem('app_expense_categories', JSON.stringify(cats.filter(c=>c.id!==id))); 
        renderExpenseCategoriesList();
    }
}

// ==========================================
// 8. Logout Function
// ==========================================
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

// Start Application
initApp();