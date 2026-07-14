// js/auth.js
import { supabase } from './supabase-config.js';
import { getLanguage, setLanguage, applyTranslations } from './i18n.js';

// --- Modal Elements ---
const authModal = document.getElementById('auth-modal');
const navLoginBtn = document.getElementById('nav-login-btn');
const heroStartBtn = document.getElementById('hero-start-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

// --- Form Elements ---
const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');
const authForm = document.getElementById('auth-form');
const submitBtn = document.getElementById('submit-btn');
const switchBtn = document.getElementById('switch-btn');
const switchText = document.getElementById('switch-text');
const alertMessage = document.getElementById('alert-message'); // Custom Alert Box
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('remember');
const rememberContainer = document.getElementById('remember-me-container');
const togglePasswordBtn = document.getElementById('toggle-password');
const googleLoginBtn = document.getElementById('google-login-btn');

// --- Lang Elements ---
const btnEn = document.getElementById('btn-en');
const btnMm = document.getElementById('btn-mm');

let isLogin = true; 

// --- Alert Helper Function ---
function showAlert(msg, type) {
    alertMessage.innerHTML = type === 'success' ? `✅ ${msg}` : `⚠️ ${msg}`;
    alertMessage.className = `alert-msg alert-${type}`;
    alertMessage.style.display = 'flex';
}

// ==========================================
// 1. Modal Open / Close Logic
// ==========================================
function openModal(modeIsLogin) {
    isLogin = modeIsLogin;
    updateAuthUI();
    authModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Scroll မရအောင်ပိတ်မည်
}

function closeModal() {
    authModal.classList.remove('active');
    document.body.style.overflow = 'auto'; // Scroll ပြန်ဖွင့်မည်
    alertMessage.style.display = 'none';
    passwordInput.value = '';
}

// Nav က Login ကို နှိပ်လျှင် (Login Mode ဖြင့် ဖွင့်မည်)
navLoginBtn.addEventListener('click', () => openModal(true));

// အလယ်က Get Started ကို နှိပ်လျှင် (Sign Up Mode ဖြင့် ဖွင့်မည်)
heroStartBtn.addEventListener('click', () => openModal(false));

// X ခလုတ် နှိပ်လျှင် ပိတ်မည်
closeModalBtn.addEventListener('click', closeModal);

// အပြင်ဘက်အမည်းရောင်ကို နှိပ်လျှင် ပိတ်မည်
authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeModal();
});


// ==========================================
// 2. Language Switcher Logic
// ==========================================
function updateFlagUI() {
    const lang = getLanguage();
    if(lang === 'en') {
        btnEn.classList.add('active');
        btnMm.classList.remove('active');
    } else {
        btnMm.classList.add('active');
        btnEn.classList.remove('active');
    }
}

function switchLanguage(newLang) {
    if(getLanguage() === newLang) return; 
    setLanguage(newLang);
    updateFlagUI(); 
    updateAuthUI();
}

btnEn.addEventListener('click', () => switchLanguage('en'));
btnMm.addEventListener('click', () => switchLanguage('mm'));


// ==========================================
// 3. Auth Init & Switch UI Logic
// ==========================================
async function initAuth() {
    applyTranslations();
    updateFlagUI();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) { window.location.href = 'dashboard.html'; return; }

    const savedEmail = localStorage.getItem('money_manager_email');
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberCheckbox.checked = true;
    }
}
initAuth();

togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePasswordBtn.textContent = type === 'password' ? '👁️' : '🙈';
});

function updateAuthUI() {
    const lang = getLanguage();
    import('./i18n.js').then(module => {
        const t = module.translations[lang];
        if (isLogin) {
            formTitle.textContent = t.login_title;
            formSubtitle.textContent = t.login_sub;
            submitBtn.textContent = t.btn_login;
            switchText.textContent = t.no_account;
            switchBtn.textContent = t.btn_signup;
            rememberContainer.style.display = 'flex'; 
        } else {
            formTitle.textContent = t.signup_title;
            formSubtitle.textContent = t.signup_sub;
            submitBtn.textContent = t.btn_signup;
            switchText.textContent = t.have_account;
            switchBtn.textContent = t.btn_login;
            rememberContainer.style.display = 'none'; 
        }
    });
}

switchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    alertMessage.style.display = 'none';
    passwordInput.value = '';
    updateAuthUI();
});

// ==========================================
// 4. Submit & Google Login Logic
// ==========================================
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertMessage.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        if (isLogin) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            if (rememberCheckbox.checked) localStorage.setItem('money_manager_email', email);
            else localStorage.removeItem('money_manager_email');
            window.location.href = 'dashboard.html'; 
        } else {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            
            // Success Message ကို မြန်မာ/အင်္ဂလိပ် ခွဲခြားပြသခြင်း
            const lang = getLanguage();
            const successMsg = lang === 'mm' 
                ? 'အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။ ယခု အကောင့်ဝင်နိုင်ပါပြီ။' 
                : 'Account created successfully! You can now log in.';
            
            showAlert(successMsg, 'success');
            isLogin = true;
            passwordInput.value = '';
            updateAuthUI(); 
        }
    } catch (error) {
        let errorMessage = error.message;

        // Supabase မှလာသော Error များကို ဖမ်း၍ စိတ်ကြိုက်စာသားဖြင့် ပြောင်းလဲခြင်း
        if (errorMessage === 'Invalid login credentials') {
            const lang = getLanguage();
            errorMessage = lang === 'mm' 
                ? 'အီးမေးလ် (သို့) စကားဝှက် မှားယွင်းနေပါသည်။ ပြန်စစ်ကြည့်ပါ။' 
                : 'Incorrect email or password. Please try again.';
        } else if (errorMessage === 'Email not confirmed') {
            const lang = getLanguage();
            errorMessage = lang === 'mm'
                ? 'အီးမေးလ်ကို အတည်ပြုပေးရန် လိုအပ်ပါသည်။ သင့် Inbox ကို စစ်ဆေးပါ။'
                : 'Please verify your email address to continue.';
        } else if (errorMessage === 'User already registered') {
            const lang = getLanguage();
            errorMessage = lang === 'mm'
                ? 'ဤအီးမေးလ်ဖြင့် အကောင့်ဖွင့်ပြီးသား ဖြစ်နေပါသည်။'
                : 'User already registered with this email.';
        }

        // Show Beautiful Error Message
        showAlert(errorMessage, 'error');
    } finally {
        // Button စာသားကို မူလအတိုင်း ပြန်ထားပေးခြင်း
        const lang = getLanguage();
        import('./i18n.js').then(module => {
            submitBtn.textContent = isLogin ? module.translations[lang].btn_login : module.translations[lang].btn_signup;
        });
        submitBtn.disabled = false;
    }
});

if(googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '/dashboard.html' }
        });
        if (error) {
            showAlert(error.message, 'error');
        }
    });
}