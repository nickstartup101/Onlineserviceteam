// ================= ⭐ SUPABASE CONFIGURATION =================

// ✅ 1. ຕັດ /rest/v1/ ອອກ ໃຫ້ເຫຼືອພຽງ Root URL:
var SUPABASE_URL = "https://xnpixluzdvwoabejblgh.supabase.co";

// ✅ 2. ໃສ່ Anon Key ທີ່ຕັດສ່ວນຊ້ຳອອກແລ້ວ:
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhucGl4bHV6ZHZ3b2FiZWpibGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MjA1MTAsImV4cCI6MjEwMzM5NjUxMH0.A3WqJo5p0_-qhyfdu33fmd2YG6MjM5nle84iTy8sQXM";

// ສ້າງ Supabase Client
window.supabaseClient = null;
if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("⚡ Supabase Database Connected Successfully!");
}
