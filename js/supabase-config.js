// ================= ⭐ SUPABASE DATABASE CONFIGURATION =================

// ⚠️ ປ່ຽນແທນ URL ແລະ ANON_KEY ຂອງ Project ຂອງທ່ານທີ່ນີ້:
var SUPABASE_URL = "https://xnpixluzdvwoabejblgh.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.A3WqJo5p0_-qhyfdu33fmd2YG6MjM5nle84iTy8sQXM";

// ສ້າງ Supabase Client
window.supabaseClient = null;
if (typeof supabase !== 'undefined' && SUPABASE_URL && !SUPABASE_URL.includes('your-project-ref')) {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("⚡ Supabase Database Connected Successfully!");
} else {
    console.log("💾 LocalStorage Mode Active (No Supabase keys provided).");
}
