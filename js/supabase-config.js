// js/supabase-config.js

// CDN ကနေ Supabase JS ကို လှမ်းခေါ်ပါမယ်
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ကိုသုအောင် ပေးထားတဲ့ Credentials များ
const supabaseUrl = 'https://heogzhwzzcjkxjqxcmsz.supabase.co'; 
const supabaseKey = 'sb_publishable_ZWIWr1vxqUXpjaWL_ngP7Q_qCUt7VHk';

// Supabase Client ကို Export လုပ်ပြီး ကျန်တဲ့ js ဖိုင်တွေမှာ လှမ်းသုံးပါမယ်
export const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Supabase Client Initialized!");