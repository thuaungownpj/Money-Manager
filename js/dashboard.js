import { supabase } from './supabase-config.js';
import { getLanguage, setLanguage, applyTranslations } from './i18n.js';

const appContent = document.getElementById('app-content');
const pageTitle = document.getElementById('page-title');
const topbarActions = document.getElementById('topbar-actions');
const menuItems = document.querySelectorAll('.menu-item');
const logoutBtn = document.getElementById('logout-btn');

const btnEn = document.getElementById('btn-en');
const btnMm = document.getElementById('btn-mm');

const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

let trendChartInstance = null;
let categoryChartInstance = null;
let allTransactions = []; 

function getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

if (mobileMenuBtn && sidebar && sidebarOverlay) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.add('show');
        sidebarOverlay.classList.add('show');
    });

    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('show');
        sidebarOverlay.classList.remove('show');
    });
}

function updateFlagUI() {
    const lang = getLanguage();
    if(lang === 'en') {
        btnEn.style.opacity = '1'; btnEn.style.transform = 'scale(1.1)'; btnEn.style.filter = 'grayscale(0%)';
        btnMm.style.opacity = '0.4'; btnMm.style.transform = 'scale(0.9)'; btnMm.style.filter = 'grayscale(80%)';
    } else {
        btnMm.style.opacity = '1'; btnMm.style.transform = 'scale(1.1)'; btnMm.style.filter = 'grayscale(0%)';
        btnEn.style.opacity = '0.4'; btnEn.style.transform = 'scale(0.9)'; btnEn.style.filter = 'grayscale(80%)';
    }
}

function switchLanguage(newLang) {
    if(getLanguage() === newLang) return; 
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

    btnEn.addEventListener('click', () => switchLanguage('en'));
    btnMm.addEventListener('click', () => switchLanguage('mm'));

    loadView('dashboard'); 
}

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
        applyTranslations(); 
    } catch (error) {
        appContent.innerHTML = '<p class="text-center text-danger" style="margin-top: 50px;">Error loading view.</p>';
    }
}

menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        menuItems.forEach(i => i.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        if (window.innerWidth <= 768 && sidebar && sidebarOverlay) {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
        }

        const view = e.currentTarget.getAttribute('data-view');
        loadView(view);
    });
});

function setupDateFilter(callbackFunction) {
    // 💡 UPDATE: Flex-wrap: nowrap ထည့်သွင်းပြီး အစဉ်လိုက် ပြန်လည်စီစဉ်ထားသည်
    topbarActions.innerHTML = `
        <div class="date-filter-container" style="display: flex; align-items: center; justify-content: flex-end; gap: 12px; flex-wrap: nowrap; overflow-x: auto; padding-bottom: 2px;">
            
            <select id="date-preset" class="date-input" style="padding: 8px 12px; border-radius: 8px; cursor: pointer; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border); outline: none; font-size: 14px;">
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="1month">Last 1 Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="1year">Last 1 Year</option>
                <option value="custom">Custom</option>
            </select>
            
            <div id="custom-date-fields" style="display: none; align-items: center; gap: 8px;">
                <input type="date" id="filter-start" class="date-input" style="padding: 7px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-main);">
                <span class="date-separator">to</span>
                <input type="date" id="filter-end" class="date-input" style="padding: 7px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-main);">
                <button id="filter-btn" class="btn-filter" style="padding: 7px 12px; border-radius: 6px; background: var(--primary); color: white; border: none; cursor: pointer;">Filter</button>
            </div>

            <!-- EXPORT BUTTON -->
            <button id="topbar-export-btn" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); border: none; color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px rgba(59,130,246,0.3); transition: 0.3s; font-size: 14px; outline: none; white-space: nowrap;">
                <span style="font-size: 16px;">📤</span> Export
            </button>
            
        </div>
    `;
    
    const presetSelect = document.getElementById('date-preset');
    const customFields = document.getElementById('custom-date-fields');
    const filterStart = document.getElementById('filter-start');
    const filterEnd = document.getElementById('filter-end');
    const filterBtn = document.getElementById('filter-btn');

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

        if (preset === 'today') { start = today; } 
        else if (preset === '7days') { start.setDate(today.getDate() - 7); } 
        else if (preset === '1month') { start.setMonth(today.getMonth() - 1); } 
        else if (preset === '3months') { start.setMonth(today.getMonth() - 3); } 
        else if (preset === '1year') { start.setFullYear(today.getFullYear() - 1); }

        filterStart.value = getLocalDateString(start);
        filterEnd.value = getLocalDateString(end);
        callbackFunction(); 
    }

    presetSelect.addEventListener('change', applyPreset);
    filterBtn.addEventListener('click', callbackFunction);
    applyPreset(); 
}

async function fetchTransactions() {
    const { data, error } = await supabase.from('transactions').select('*').order('transaction_date', { ascending: false });
    if (!error && data) allTransactions = data;
}

function setupActionButtons(type, refreshLogic) {
    document.querySelectorAll('.btn-edit-tx').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const txType = e.currentTarget.getAttribute('data-type');
            const date = e.currentTarget.getAttribute('data-date');
            const cat = e.currentTarget.getAttribute('data-cat');
            const amt = e.currentTarget.getAttribute('data-amount');

            const modal = document.getElementById('edit-transaction-modal');
            document.getElementById('edit-tx-id').value = id;
            document.getElementById('edit-tx-type').value = txType;
            document.getElementById('edit-tx-date').value = date;
            document.getElementById('edit-tx-amount').value = amt;

            const catSelect = document.getElementById('edit-tx-category');
            const { data: cats } = await supabase.from('categories').select('*').eq('type', txType);
            catSelect.innerHTML = cats && cats.length > 0
                ? cats.map(c => `<option value="${c.icon} ${c.name}">${c.icon} ${c.name}</option>`).join('')
                : '<option value="Other">Other</option>';
            catSelect.value = cat;

            modal.style.display = 'flex';
        });
    });

    document.querySelectorAll('.btn-del-tx').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm('Are you sure you want to delete this record?')) {
                const id = e.currentTarget.getAttribute('data-id');
                await supabase.from('transactions').delete().eq('id', id);
                refreshLogic();
            }
        });
    });
}

function setupEditModalForm(refreshLogic) {
    const editForm = document.getElementById('edit-transaction-form');
    const closeBtn = document.getElementById('close-edit-modal');
    const modal = document.getElementById('edit-transaction-modal');

    if(closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');

    if(editForm) {
        const newForm = editForm.cloneNode(true);
        editForm.parentNode.replaceChild(newForm, editForm);
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = newForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;

            const id = document.getElementById('edit-tx-id').value;
            const record = {
                transaction_date: document.getElementById('edit-tx-date').value,
                category: document.getElementById('edit-tx-category').value,
                amount: document.getElementById('edit-tx-amount').value
            };

            await supabase.from('transactions').update(record).eq('id', id);
            
            submitBtn.disabled = false;
            modal.style.display = 'none';
            refreshLogic();
        });
    }
}

// ==========================================
// Dashboard Logic
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
        if (trendChartInstance) trendChartInstance.destroy();
        if (categoryChartInstance) categoryChartInstance.destroy();
    } else {
        filtered.forEach(t => {
            const tr = document.createElement('tr');
            let badge = t.type === 'income' ? 'badge-income' : (t.type === 'expense' ? 'badge-expense' : 'badge-saving');
            tr.innerHTML = `
                <td>${t.transaction_date}</td>
                <td>${t.category}</td>
                <td><span class="type-badge ${badge}">${t.type}</span></td>
                <td>${new Intl.NumberFormat('en-US').format(t.amount)} Ks</td>
                <td class="action-column" style="text-align: center;">
                    <button class="btn-edit-tx" data-id="${t.id}" data-type="${t.type}" data-date="${t.transaction_date}" data-cat="${t.category}" data-amount="${t.amount}" style="background: rgba(59,130,246,0.1); color: #3b82f6; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 13px; margin-right: 5px;">Edit</button>
                    <button class="btn-del-tx" data-id="${t.id}" style="background: rgba(239,68,68,0.1); color: var(--danger); border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 13px;">Del</button>
                </td>
            `;
            list.appendChild(tr);
        });
        setupActionButtons('dashboard', initDashboardLogic);
    }
    
    setupEditModalForm(initDashboardLogic);

    // ==========================================
    // 📤 Export Modal Logic 
    // ==========================================
    const topbarExportBtn = document.getElementById('topbar-export-btn');
    const exportModal = document.getElementById('export-selection-modal');
    const closeExportModalBtn = document.getElementById('close-export-modal');

    if(topbarExportBtn) {
        topbarExportBtn.addEventListener('mouseenter', () => topbarExportBtn.style.transform = 'translateY(-2px)');
        topbarExportBtn.addEventListener('mouseleave', () => topbarExportBtn.style.transform = 'translateY(0)');
        
        topbarExportBtn.addEventListener('click', () => {
            if(exportModal) {
                exportModal.style.display = 'flex';
                setTimeout(() => {
                    exportModal.style.opacity = '1';
                    exportModal.querySelector('.widget-card').style.transform = 'translateY(0)';
                }, 10);
            }
        });
    }

    function closeExportModal() {
        if(exportModal) {
            exportModal.style.opacity = '0';
            exportModal.querySelector('.widget-card').style.transform = 'translateY(20px)';
            setTimeout(() => exportModal.style.display = 'none', 300);
        }
    }

    if(closeExportModalBtn) closeExportModalBtn.addEventListener('click', closeExportModal);
    if(exportModal) exportModal.addEventListener('click', (e) => {
        if(e.target === exportModal) closeExportModal();
    });

    // 📤 Export Functions (CSV, Excel, Image)
    const btnCsv = document.getElementById('btn-export-csv');
    const btnExcel = document.getElementById('btn-export-excel');
    const btnImage = document.getElementById('btn-export-image');
    
    const reportName = `MoneyManager_Report_${getLocalDateString()}`;

    if(btnCsv) {
        btnCsv.onclick = () => {
            let csv = "Date,Category,Type,Amount (Ks)\n";
            filtered.forEach(t => csv += `${t.transaction_date},${t.category},${t.type},${t.amount}\n`);
            csv += `\nTotal Income,,,${tInc}\n`;
            csv += `Total Expense,,,${tExp}\n`;
            csv += `Net Balance,,,${diff}\n`;
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportName}.csv`;
            a.click();
            closeExportModal();
        };
    }

    if(btnExcel) {
        btnExcel.onclick = () => {
            if(typeof XLSX === 'undefined') return alert("Excel Library not loaded yet.");
            const wsData = [
                ["Money Manager - Financial Report"],
                ["Export Date:", getLocalDateString(), "Date Range:", `${filterStart || 'All'} to ${filterEnd || 'All'}`],
                [],
                ["Summary"],
                ["Total Income", tInc + " Ks"],
                ["Total Expense", tExp + " Ks"],
                ["Net Balance", diff + " Ks"],
                [],
                ["Transaction Details"],
                ["Date", "Category", "Type", "Amount (Ks)"]
            ];
            filtered.forEach(t => wsData.push([t.transaction_date, t.category, t.type, Number(t.amount)]));
            
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Report");
            XLSX.writeFile(wb, `${reportName}.xlsx`);
            closeExportModal();
        };
    }

    if(btnImage) {
        btnImage.onclick = () => {
            if(typeof html2canvas === 'undefined') return alert("Image Library not loaded yet.");
            closeExportModal();
            
            setTimeout(() => {
                const captureArea = document.getElementById('export-capture-area');
                const actionColumns = document.querySelectorAll('.action-column');
                
                actionColumns.forEach(col => col.style.display = 'none');
                
                html2canvas(captureArea, { scale: 2, backgroundColor: '#18181b' }).then(canvas => {
                    const link = document.createElement('a');
                    link.download = `${reportName}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    
                    actionColumns.forEach(col => col.style.display = '');
                });
            }, 350); 
        };
    }

    // Chart.js Logic
    const trendCtx = document.getElementById('trendChart');
    const catCtx = document.getElementById('categoryChart');
    
    if(trendCtx && catCtx) {
        if (trendChartInstance) trendChartInstance.destroy();
        if (categoryChartInstance) categoryChartInstance.destroy();

        let incomeTotal = 0, expenseTotal = 0;
        let expenseByCategory = {};

        filtered.forEach(t => {
            if (t.type === 'income') incomeTotal += Number(t.amount);
            if (t.type === 'expense') {
                expenseTotal += Number(t.amount);
                expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + Number(t.amount);
            }
        });

        trendChartInstance = new Chart(trendCtx, {
            type: 'bar',
            data: {
                labels: ['Total Income', 'Total Expense'],
                datasets: [{
                    label: 'Amount (Ks)',
                    data: [incomeTotal, expenseTotal],
                    backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });

        const catLabels = Object.keys(expenseByCategory);
        const catData = Object.values(expenseByCategory);
        
        categoryChartInstance = new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: catLabels.length ? catLabels : ['No Expenses'],
                datasets: [{
                    data: catData.length ? catData : [1],
                    backgroundColor: catData.length ? [
                        '#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6'
                    ] : ['#374151'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#9ca3af', font: { size: 11 } } }
                },
                cutout: '70%'
            }
        });
    }
}

// ==========================================
// Total Income Report Logic
// ==========================================
async function initTotalIncomeLogic() {
    const categorySelect = document.getElementById('inc-category');
    const dateInput = document.getElementById('inc-date');
    const addForm = document.getElementById('add-income-form');
    
    dateInput.value = getLocalDateString();
    
    const { data: incomeCats } = await supabase.from('categories').select('*').eq('type', 'income');
    categorySelect.innerHTML = incomeCats && incomeCats.length > 0 
        ? incomeCats.map(c => `<option value="${c.icon} ${c.name}">${c.icon} ${c.name}</option>`).join('')
        : '<option value="Other">No category found (Add from Settings)</option>';

    const newForm = addForm.cloneNode(true);
    addForm.parentNode.replaceChild(newForm, addForm);
    
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = newForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        const record = {
            transaction_date: document.getElementById('inc-date').value,
            category: document.getElementById('inc-category').value,
            type: 'income',
            amount: document.getElementById('inc-amount').value
        };
        const { error } = await supabase.from('transactions').insert([record]);
        
        submitBtn.disabled = false;
        if (error) alert("Error saving data: " + error.message);
        else { document.getElementById('inc-amount').value = ''; initTotalIncomeLogic(); }
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
        list.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No income found.</td></tr>';
        return;
    }

    incomes.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.transaction_date}</td>
            <td><span class="type-badge badge-income">${t.category}</span></td>
            <td style="color: #10b981; font-weight: 500;">+ ${new Intl.NumberFormat('en-US').format(t.amount)} Ks</td>
            <td style="text-align: center;">
                <button class="btn-edit-tx" data-id="${t.id}" data-type="${t.type}" data-date="${t.transaction_date}" data-cat="${t.category}" data-amount="${t.amount}" style="background: rgba(59,130,246,0.1); color: #3b82f6; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 13px; margin-right: 5px;">Edit</button>
                <button class="btn-del-tx" data-id="${t.id}" style="background: rgba(239,68,68,0.1); color: var(--danger); border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 13px;">Del</button>
            </td>
        `;
        list.appendChild(tr);
    });

    setupActionButtons('income', initTotalIncomeLogic);
    setupEditModalForm(initTotalIncomeLogic);
}

// ==========================================
// Total Expense Report Logic
// ==========================================
async function initTotalExpenseLogic() {
    const categorySelect = document.getElementById('exp-category');
    const dateInput = document.getElementById('exp-date');
    const addForm = document.getElementById('add-expense-form');
    
    dateInput.value = getLocalDateString();
    
    const { data: expenseCats } = await supabase.from('categories').select('*').eq('type', 'expense');
    categorySelect.innerHTML = expenseCats && expenseCats.length > 0 
        ? expenseCats.map(c => `<option value="${c.icon} ${c.name}">${c.icon} ${c.name}</option>`).join('')
        : '<option value="Other">No category found (Add from Settings)</option>';

    const newForm = addForm.cloneNode(true);
    addForm.parentNode.replaceChild(newForm, addForm);
    
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = newForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        const record = {
            transaction_date: document.getElementById('exp-date').value,
            category: document.getElementById('exp-category').value,
            type: 'expense',
            amount: document.getElementById('exp-amount').value
        };
        const { error } = await supabase.from('transactions').insert([record]);
        
        submitBtn.disabled = false;
        if (error) alert("Error saving data: " + error.message);
        else { document.getElementById('exp-amount').value = ''; initTotalExpenseLogic(); }
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
        list.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No expenses found.</td></tr>';
        return;
    }
    expenses.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.transaction_date}</td>
            <td><span class="type-badge badge-expense">${t.category}</span></td>
            <td style="color: var(--danger); font-weight: 500;">- ${new Intl.NumberFormat('en-US').format(t.amount)} Ks</td>
            <td style="text-align: center;">
                <button class="btn-edit-tx" data-id="${t.id}" data-type="${t.type}" data-date="${t.transaction_date}" data-cat="${t.category}" data-amount="${t.amount}" style="background: rgba(59,130,246,0.1); color: #3b82f6; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 13px; margin-right: 5px;">Edit</button>
                <button class="btn-del-tx" data-id="${t.id}" style="background: rgba(239,68,68,0.1); color: var(--danger); border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 13px;">Del</button>
            </td>
        `;
        list.appendChild(tr);
    });

    setupActionButtons('expense', initTotalExpenseLogic);
    setupEditModalForm(initTotalExpenseLogic);
}

// ==========================================
// Cloud Category Logic (Income & Expense)
// ==========================================
function initIncomeCategoryLogic() {
    const form = document.getElementById('income-category-form');
    renderIncomeCategoriesList(); 
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const record = {
            type: 'income',
            icon: document.getElementById('inc-cat-icon').value,
            name: document.getElementById('inc-cat-name').value.trim()
        };
        await supabase.from('categories').insert([record]);
        document.getElementById('inc-cat-name').value = ''; 
        renderIncomeCategoriesList(); 
    });
}

async function renderIncomeCategoriesList() {
    const list = document.getElementById('income-category-list');
    if(!list) return;
    list.innerHTML = '<p class="text-muted">Loading...</p>';
    const { data: cats } = await supabase.from('categories').select('*').eq('type', 'income');
    list.innerHTML = cats && cats.length ? cats.map(c => `<div class="category-item"><div class="cat-info"><div class="cat-icon-display">${c.icon}</div><div class="cat-name-display">${c.name}</div></div><button class="btn-delete-cat" onclick="deleteCategory(${c.id}, 'income')">🗑️</button></div>`).join('') : '<p class="text-muted">No data.</p>';
}

function initExpenseCategoryLogic() {
    const form = document.getElementById('expense-category-form');
    renderExpenseCategoriesList(); 
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const record = {
            type: 'expense',
            icon: document.getElementById('exp-cat-icon').value,
            name: document.getElementById('exp-cat-name').value.trim()
        };
        await supabase.from('categories').insert([record]);
        document.getElementById('exp-cat-name').value = ''; 
        renderExpenseCategoriesList(); 
    });
}

async function renderExpenseCategoriesList() {
    const list = document.getElementById('expense-category-list');
    if(!list) return;
    list.innerHTML = '<p class="text-muted">Loading...</p>';
    const { data: cats } = await supabase.from('categories').select('*').eq('type', 'expense');
    list.innerHTML = cats && cats.length ? cats.map(c => `<div class="category-item"><div class="cat-info"><div class="cat-icon-display" style="color:var(--danger); background:rgba(239,68,68,0.1)">${c.icon}</div><div class="cat-name-display">${c.name}</div></div><button class="btn-delete-cat" onclick="deleteCategory(${c.id}, 'expense')">🗑️</button></div>`).join('') : '<p class="text-muted">No data.</p>';
}

window.deleteCategory = async function(id, type) {
    if(confirm('Are you sure you want to delete this category?')){ 
        await supabase.from('categories').delete().eq('id', id);
        if (type === 'income') renderIncomeCategoriesList();
        else renderExpenseCategoriesList();
    }
}

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

initApp();