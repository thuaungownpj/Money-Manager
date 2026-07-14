// js/auth.js
import { supabase } from './supabase-config.js';

const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');
const authForm = document.getElementById('auth-form');
const submitBtn = document.getElementById('submit-btn');
const switchBtn = document.getElementById('switch-btn');
const switchText = document.getElementById('switch-text');
const errorMessage = document.getElementById('error-message');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const rememberCheckbox = document.getElementById('remember');
const rememberContainer = document.getElementById('remember-me-container');

let isLogin = true; 

// Session ရှိ/မရှိ စစ်ဆေးရန် နှင့် Remember ထားသော Email ရှိလျှင် ထည့်ပေးရန်
async function initAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Money Manager အတွက် Email မှတ်ထားတာ ရှိ/မရှိ စစ်ရန်
    const savedEmail = localStorage.getItem('money_manager_email');
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberCheckbox.checked = true;
    }
}
initAuth();

// Login နှင့် Register Form ကို အကူးအပြောင်းလုပ်ရန်
switchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    errorMessage.textContent = '';
    passwordInput.value = '';

    if (isLogin) {
        formTitle.textContent = 'Welcome Back';
        formSubtitle.textContent = 'Login to manage your finances';
        submitBtn.textContent = 'Login';
        switchText.textContent = "Don't have an account?";
        switchBtn.textContent = 'Sign Up';
        rememberContainer.style.display = 'flex'; 
    } else {
        formTitle.textContent = 'Create Account';
        formSubtitle.textContent = 'Start tracking your finances today';
        submitBtn.textContent = 'Sign Up';
        switchText.textContent = 'Already have an account?';
        switchBtn.textContent = 'Login';
        rememberContainer.style.display = 'none'; 
    }
});

// Form Submit လုပ်သည့်အခါ
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        if (isLogin) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
            if (error) throw error;

            // Remember me အမှန်ခြစ်ထားရင် သိမ်းမည်၊ မခြစ်ထားရင် ဖျက်မည်
            if (rememberCheckbox.checked) {
                localStorage.setItem('money_manager_email', email);
            } else {
                localStorage.removeItem('money_manager_email');
            }

            window.location.href = 'dashboard.html'; 
        } else {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
            });
            if (error) throw error;
            alert('အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။ ယခု Login ဝင်နိုင်ပါပြီ။');
            switchBtn.click(); 
        }
    } catch (error) {
        errorMessage.textContent = error.message;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isLogin ? 'Login' : 'Sign Up';
    }
});