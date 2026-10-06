// ⭐ FUNCTION ກວດສອບ ແລະ ສ້າງ BRAND BADGES (WECHAT, ALIPAY, PROMPTPAY, UNIONPAY, MASTERCARD)
function getBrandBadgesHtml(title, category) {
    var text = `${title} ${category}`.toLowerCase();
    var badges = [];

    // 1. WeChat Pay (ສີຂຽວ)
    if (text.includes('wechat') || text.includes('ວີແຊັດ') || text.includes('ວິແຊັດ')) {
        badges.push(`
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                <span class="material-symbols-outlined text-[14px]">qr_code_2</span> WeChat Pay
            </span>
        `);
    }

    // 2. Alipay (ສີຟ້າ)
    if (text.includes('alipay') || text.includes('ອາລີເພ')) {
        badges.push(`
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 shadow-xs">
                <span class="material-symbols-outlined text-[14px]">contactless</span> Alipay
            </span>
        `);
    }

    // 3. PromptPay (ສີຟ້າເຂັ້ມ/ກົມມະທ່າ)
    if (text.includes('promptpay') || text.includes('promtpay') || text.includes('ພຣອມເພ')) {
        badges.push(`
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-xs">
                <span class="material-symbols-outlined text-[14px]">qr_code_scanner</span> PromptPay
            </span>
        `);
    }

    // 4. UnionPay (ສີແດງ-ຟ້າ)
    if (text.includes('unionpay') || text.includes('ຢູນຽນເພ') || text.includes('cup')) {
        badges.push(`
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 shadow-xs">
                <span class="material-symbols-outlined text-[14px]">credit_card</span> UnionPay
            </span>
        `);
    }

    // 5. Mastercard (ສີສົ້ມ)
    if (text.includes('mastercard') || text.includes('master card') || text.includes('ມາສເຕີ')) {
        badges.push(`
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
                <span class="material-symbols-outlined text-[14px]">credit_card</span> Mastercard
            </span>
        `);
    }

    // 6. Visa (ສີຟ້າຄາມ)
    if (text.includes('visa') || text.includes('ວີຊາ')) {
        badges.push(`
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-xs">
                <span class="material-symbols-outlined text-[14px]">credit_card</span> VISA
            </span>
        `);
    }

    // ຖ້າບໍ່ມີແບຣນຂ້າງເທິງ ໃຫ້ໃຊ້ໄອຄອນຕາມໝວດໝູ່ທົ່ວໄປ
    if (badges.length === 0) {
        if (text.includes('ໂອນ')) {
            badges.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700"><span class="material-symbols-outlined text-[13px]">currency_exchange</span> ໂອນເງິນ</span>`);
        } else if (text.includes('ບັດ')) {
            badges.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700"><span class="material-symbols-outlined text-[13px]">credit_card</span> ສູນບັດ</span>`);
        }
    }

    return badges.join(' ');
}
