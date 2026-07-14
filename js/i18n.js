// js/i18n.js
export const translations = {
    en: {
        "app_name": "Money Manager",
        "menu_dashboard": "Dashboard",
        "menu_reports": "Reports",
        "menu_total_income": "Total Income",
        "menu_total_expense": "Total Expense",
        "menu_settings": "Settings",
        "menu_income_cat": "Income Category",
        "menu_expense_cat": "Expense Category",
        "logout": "Logout",
        
        // Income Categories
        "cat_inc_dev": "👨‍💻 Developer",
        "cat_inc_yt": "📺 YouTube",
        "cat_inc_fb": "📘 Facebook",
        "cat_inc_pass": "🛂 Passport",
        "cat_inc_vpn": "🔑 VPN Key",
        "cat_inc_app": "📱 Applications",
        "cat_inc_web": "🌐 Website",
        "cat_inc_admob": "📢 Admob",
        "cat_inc_adsense": "💵 Adsense",
        "cat_inc_freelance": "💼 Freelance",
        "cat_inc_other": "🧩 Others",

        // Expense Categories
        "cat_exp_work": "💼 Work",
        "cat_exp_family": "👨‍👩‍👧‍👦 Family",
        "cat_exp_health": "🏥 Health",
        "cat_exp_home": "🏡 Home",
        "cat_exp_shop": "🛍️ Shopping",
        "cat_exp_rent": "📄 Rent & Bills",
        "cat_exp_food": "🍔 Food",
        "cat_exp_edu": "🎓 Education",
        "cat_exp_trans": "🚗 Transportation",
        "cat_exp_travel": "✈️ Travel",
        "cat_exp_other": "🧩 Others"
    },
    mm: {
        "app_name": "ငွေစာရင်းမန်နေဂျာ",
        "menu_dashboard": "အဓိကစာမျက်နှာ",
        "menu_reports": "အစီရင်ခံစာများ",
        "menu_total_income": "စုစုပေါင်း ဝင်ငွေ",
        "menu_total_expense": "စုစုပေါင်း ထွက်ငွေ",
        "menu_settings": "ဆက်တင်များ",
        "menu_income_cat": "ဝင်ငွေ အမျိုးအစား",
        "menu_expense_cat": "ထွက်ငွေ အမျိုးအစား",
        "logout": "ထွက်မည်",

        // Income Categories (Myanmar)
        "cat_inc_dev": "👨‍💻 ပရိုဂရမ်မာ",
        "cat_inc_yt": "📺 ယူကျု",
        "cat_inc_fb": "📘 ဖေ့စ်ဘွတ်ခ်",
        "cat_inc_pass": "🛂 ပတ်စ်ပို့",
        "cat_inc_vpn": "🔑 VPN ကီး",
        "cat_inc_app": "📱 အက်ပ်",
        "cat_inc_web": "🌐 ဝက်ဘ်ဆိုက်",
        "cat_inc_admob": "📢 Admob",
        "cat_inc_adsense": "💵 Adsense",
        "cat_inc_freelance": "💼 အလွတ်တန်း",
        "cat_inc_other": "🧩 အခြား",

        // Expense Categories (Myanmar)
        "cat_exp_work": "💼 အလုပ်",
        "cat_exp_family": "👨‍👩‍👧‍👦 မိသားစုစရိတ်",
        "cat_exp_health": "🏥 ကျန်းမာရေး",
        "cat_exp_home": "🏡 အိမ်အသုံးစရိတ်",
        "cat_exp_shop": "🛍️ ပစ္စည်းဝယ်",
        "cat_exp_rent": "📄 အိမ်လခနှင့် ဘေလ်များ",
        "cat_exp_food": "🍔 အစားအသောက်",
        "cat_exp_edu": "🎓 ပညာရေး",
        "cat_exp_trans": "🚗 လမ်းစရိတ်",
        "cat_exp_travel": "✈️ ခရီးသွား",
        "cat_exp_other": "🧩 အခြား"
    }
};

export function getLanguage() {
    return localStorage.getItem('app_lang') || 'en';
}

export function setLanguage(lang) {
    localStorage.setItem('app_lang', lang);
    applyTranslations();
}

export function applyTranslations() {
    const lang = getLanguage();
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            // Dropdown option များအတွက်ပါ အလုပ်လုပ်စေရန်
            el.textContent = translations[lang][key]; 
        }
    });
}