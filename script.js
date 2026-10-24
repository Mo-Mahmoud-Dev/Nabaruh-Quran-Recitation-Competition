const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

if (menuToggle && navLinks) {
    // فتح وإغلاق القائمة عند الضغط على الهامبرغر
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // إغلاق القائمة تلقائياً بمجرد الضغط على أي رابط
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
}

/* ==========================================================================
   الصورة: إجبارية للذكور فقط - اختيارية للإناث
   ========================================================================== */
const genderSelect = document.getElementById('gender');
const attachmentInput = document.getElementById('attachment');
const attachmentLabel = document.getElementById('attachmentLabel');
const form = document.getElementById('registerForm');
const idDocInput = document.getElementById('idDoc');

function updatePhotoRequirement() {
    if (!genderSelect || !attachmentInput || !attachmentLabel) return;

    if (genderSelect.value === 'أنثى') {
        attachmentInput.required = false;
        attachmentLabel.textContent = 'صورة شخصية (اختياري)';
    } else if (genderSelect.value === 'ذكر') {
        attachmentInput.required = true;
        attachmentLabel.textContent = 'صورة شخصية (إجبارية) *';
    } else {
        attachmentInput.required = false;
        attachmentLabel.textContent = 'صورة شخصية';
    }
}
if (genderSelect) {
    genderSelect.addEventListener('change', updatePhotoRequirement);
    updatePhotoRequirement();
}

/* ==========================================================================
   Popup (نافذة منبثقة بدل alert الخاصة بالمتصفح)
   ========================================================================== */
const POPUP_TYPES = {
    success: { icon: "✓", color: "#0a5a46", title: "تم بنجاح" },
    warning: { icon: "!", color: "#c77b24", title: "تنبيه" },
    error:   { icon: "✕", color: "#c0392b", title: "حدث خطأ" }
};

(function injectPopupStyles() {
    const css = `
    .np-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;
        padding:16px;z-index:100000;opacity:0;transition:opacity .2s ease;direction:rtl;font-family:'Cairo',Tahoma,Arial,sans-serif;}
    .np-overlay.np-show{opacity:1;}
    .np-box{background:#fff;color:#222;width:100%;max-width:420px;border-radius:16px;padding:28px 22px 22px;text-align:center;
        box-shadow:0 20px 50px rgba(0,0,0,.3);transform:translateY(20px) scale(.96);transition:transform .2s ease;}
    .np-overlay.np-show .np-box{transform:none;}
    .np-icon{width:64px;height:64px;border-radius:50%;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;
        font-size:34px;font-weight:700;color:#fff;line-height:1;}
    .np-title{font-size:20px;font-weight:800;margin:0 0 10px;}
    .np-msg{font-size:16px;line-height:1.9;color:#444;margin:0 0 22px;white-space:pre-line;word-break:break-word;}
    .np-btn{border:0;border-radius:10px;padding:11px 36px;font-size:16px;font-weight:700;color:#fff;cursor:pointer;font-family:inherit;}
    .np-btn:focus-visible{outline:3px solid rgba(0,0,0,.25);outline-offset:2px;}`;
    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
})();

// بترجع Promise بتتحل لما المستخدم يقفل النافذة
function showPopup(type, message, title) {
    return new Promise(resolve => {
        const t = POPUP_TYPES[type] || POPUP_TYPES.warning;
        const cleanMsg = String(message || "").replace(/\s*[❌✅]\s*/g, " ").replace(/ +\n/g, "\n").trim();

        const overlay = document.createElement('div');
        overlay.className = 'np-overlay';
        overlay.innerHTML = `
            <div class="np-box" role="dialog" aria-modal="true" aria-labelledby="npTitle" aria-describedby="npMsg">
                <div class="np-icon" style="background:${t.color}">${t.icon}</div>
                <h3 class="np-title" id="npTitle">${escapeHtml(title || t.title)}</h3>
                <p class="np-msg" id="npMsg">${escapeHtml(cleanMsg)}</p>
                <button type="button" class="np-btn" style="background:${t.color}">حسناً</button>
            </div>`;
        document.body.appendChild(overlay);

        const btn = overlay.querySelector('.np-btn');
        const prevFocus = document.activeElement;
        let closed = false;

        function close() {
            if (closed) return;
            closed = true;
            document.removeEventListener('keydown', onKey, true);
            overlay.classList.remove('np-show');
            setTimeout(() => {
                overlay.remove();
                if (prevFocus && prevFocus.focus) prevFocus.focus();
                resolve();
            }, 200);
        }
        function onKey(ev) {
            if (ev.key === 'Escape' || ev.key === 'Enter') { ev.preventDefault(); close(); }
        }

        btn.addEventListener('click', close);
        overlay.addEventListener('click', ev => { if (ev.target === overlay) close(); });
        document.addEventListener('keydown', onKey, true);

        requestAnimationFrame(() => { overlay.classList.add('np-show'); btn.focus(); });
    });
}

/* ==========================================================================
   منع المتسابقين السابقين / إجبار رفع الفئة (blockUser.json)
   ========================================================================== */
let blockedData = null;

async function loadBlockedData() {
    if (blockedData) return blockedData;
    const res = await fetch("blockUser.json", { cache: "no-store" });
    if (!res.ok) throw new Error("تعذر التحقق من بيانات المتسابقين، حاول مرة أخرى");
    blockedData = await res.json();
    return blockedData;
}

// توحيد الاسم: إزالة التشكيل والتطويل وتوحيد الهمزات والياء والتاء المربوطة والمسافات
function normalizeName(name) {
    return String(name)
        .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
        .replace(/[أإآٱ]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/ؤ/g, "و")
        .replace(/ئ/g, "ي")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

// إزالة كل المسافات والرموز بعد التوحيد (عشان "عبد اللطيف" = "عبداللطيف")
function squashName(name) {
    return normalizeName(name).replace(/[^\u0621-\u063A\u0641-\u064Aa-z]/g, "");
}

// تطابق الاسم بدون اعتبار المسافات:
// - الاسم المكتوب يبدأ بالاسم المسجّل (يعني كتب اسم أطول، مثلاً رباعي)
// - أو الاسم المسجّل يبدأ بالاسم المكتوب (لو المكتوب 10 حروف أو أكثر)
function namesMatch(listed, entered) {
    const l = squashName(listed);
    const e = squashName(entered);
    if (!l || !e) return false;
    return e.startsWith(l) || (e.length >= 10 && l.startsWith(e));
}

function isInList(list, name) {
    return (list || []).some(n => namesMatch(n, name));
}

// ترتيب الفئات: 4 = كامل مع تفسير سورة النور، 3 = كامل، 2 = نصف، 1 = ربع، 0 = غير ذلك (الأربعون النووية والمنتقي الفقهي)
function getLevelRank(value) {
    if (value.includes("تفسير")) return 4;
    if (value.includes("كاملاً")) return 3;
    if (value.includes("نصف القرآن")) return 2;
    if (value.includes("ربع القرآن")) return 1;
    return 0;
}

// التحقق من أن العنوان لمدينة نبروة (يقبل نبروة / نبروه)
function isNabroaAddress(address) {
    return squashName(address).includes("نبروه");
}

// ترجع رسالة المنع، أو null لو مسموح له بالتسجيل
async function checkRegistrationAllowed(fullName, selectedLevel, age) {
    const db = await loadBlockedData();
    const rank = getLevelRank(selectedLevel);

    // فئة ربع القرآن: مسموحة فقط لمن عمره 15 سنة أو أقل
    if (rank === 1 && Number(age) > 15) {
        return "فئة ربع القرآن الكريم مخصصة للمتسابقين حتى سن 15 سنة فقط، يرجى اختيار فئة أخرى ❌";
    }

    if (isInList(db.full, fullName) && rank < 4) {
        return "لقد شاركت العام الماضي في فئة القرآن الكريم كاملاً، ويمكنك المشاركة هذا العام فقط في فئة القرآن الكريم كاملاً مع تفسير سورة النور وحفظ معاني كلمات السورة ❌";
    }
    if (isInList(db.half, fullName) && rank < 3) {
        return "لقد شاركت العام الماضي في فئة نصف القرآن، ويجب عليك اختيار فئة القرآن الكريم كاملاً ❌";
    }
    if (isInList(db.quarter, fullName) && rank < 2) {
        return "لقد شاركت العام الماضي في فئة ربع القرآن، ويجب عليك اختيار فئة أعلى (نصف القرآن أو القرآن كاملاً) ❌";
    }
    return null;
}

/* ==========================================================================
   Back-End Don't Touch
   ========================================================================== */
const FORMSUBMIT_URL = "https://formsubmit.co/1f0ec18135b944137e9e9a2ff2b4253e";

// لوجو المسابقة (مضمّن داخل الكود لتفادي مشاكل تحميل الصور داخل الـ PDF)
const LOGO_DATA_URI = "data:image/jpeg;base64,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CPJNaGFWlzO6Pi7J2kZ4PWu3+EHgu48Z+L7WEwk6Xaus17KR8oQHOzPq2MY9MntXvlt+z/4MilV5G1SdQfuSXIAP12qD+temaDoum6BpyWGjWUNnaJyI4lxk+pPUn3PNdFfM4uDjSWrJhQd7yL6qFUKoAUDAA6AUtFFeKdIUUUUAFFFFABUdxBFcRNFcRJLE3DI6hgfqDUlFAHnXif4N+Dte3uNO/s65bnzbE+Xz7r90/lXn9j8K/GPw919NY8FXtvqsI+WW1lPkvNH3RgTtPscgg9q+haK6I4qpFct7rsyHCL1GQszwxtIhjdlBZCc7T6Zp9FFc5YUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAGaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAM0UUUAf/2Q==";
/* ==========================================================================
   معالجة الصور
   ========================================================================== */

// ضغط الصورة المرفوعة لتقليل حجم الـ PDF (يرجع الرابط + الأبعاد الفعلية)
function compressImage(file, maxSize = 600, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.width * ratio));
            canvas.height = Math.max(1, Math.round(img.height * ratio));
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve({ url: canvas.toDataURL('image/jpeg', quality), w: canvas.width, h: canvas.height });
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('تعذر قراءة الصورة، تأكد أنها بصيغة JPG أو PNG')); };
        img.src = url;
    });
}

// تجهيز الصورة مسبقاً بمجرد اختيارها (عشان وقت الضغط ما يتحسبش وقت الإرسال)
const preparedImages = new WeakMap();
function prepareImage(file, maxSize, quality) {
    if (!file) return Promise.resolve(null);
    const key = maxSize + "_" + quality;
    let byKey = preparedImages.get(file);
    if (!byKey) { byKey = {}; preparedImages.set(file, byKey); }
    if (!byKey[key]) {
        byKey[key] = compressImage(file, maxSize, quality);
        byKey[key].catch(() => { delete byKey[key]; });
    }
    return byKey[key];
}

const PHOTO_OPTS = [500, 0.7];
const ID_OPTS = [900, 0.7];

if (attachmentInput) {
    attachmentInput.addEventListener('change', () => {
        prepareImage(attachmentInput.files[0], ...PHOTO_OPTS).catch(() => {});
    });
}
if (idDocInput) {
    idDocInput.addEventListener('change', (e) => {
        prepareImage(e.target.files[0], ...ID_OPTS).catch(() => {});
    });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// حساب مقاس الصورة داخل صندوق أقصى مع الحفاظ على النسبة
function fitBox(w, h, maxW, maxH) {
    const r = Math.min(maxW / w, maxH / h, 1);
    return { w: Math.round(w * r), h: Math.round(h * r) };
}

/* ==========================================================================
   بناء الـ PDF
   الفكرة: النصوص العربية تتحول لصورة بـ html2canvas (لأن jsPDF مش بيدعم العربي)،
   أما الصور (اللوجو/الشخصية/البطاقة) فبتتحط مباشرة بـ pdf.addImage
   في أماكن محجوزة (data-slot) - كده مفيش أي اعتماد على تحميل الصور داخل html2canvas.
   ========================================================================== */

function buildPdfHtml(d, photoBox) {
    const today = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    const row = (label, value) => `
        <div style="display:flex;border-bottom:1px solid #ddd;min-height:52px;align-items:center;">
            <div style="width:32%;padding:10px 14px;font-weight:700;color:#222;">${label}</div>
            <div style="width:68%;padding:10px 14px;color:#555;">${escapeHtml(value)}</div>
        </div>`;

    const photoBlock = photoBox
        ? `<div style="display:flex;justify-content:center;padding:18px 0;">
             <div data-slot="photo" style="width:${photoBox.w}px;height:${photoBox.h}px;border:2px solid #0a5a46;box-sizing:content-box;"></div>
           </div>`
        : `<div style="text-align:center;padding:18px 0;color:#888;">لم يتم إرفاق صورة</div>`;

    return `
    <div style="width:794px;min-height:1123px;background:#fff;padding:40px 44px;box-sizing:border-box;
                font-family:'Cairo',Tahoma,Arial,sans-serif;direction:rtl;color:#222;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="text-align:right;">
                <div style="font-size:26px;font-weight:700;color:#0a5a46;line-height:1.7;">مسابقة نبروة الكبرى</div>
                <div style="font-size:20px;line-height:1.7;">للقرآن الكريم والسنة النبوية</div>
                <div style="font-size:18px;font-weight:700;color:#c77b24;line-height:1.7;">استمارة تسجيل متسابق</div>
                <div style="font-size:13px;color:#666;margin-top:6px;">تاريخ الطباعة : ${today}</div>
            </div>
            <div data-slot="logo" style="width:130px;height:130px;"></div>
        </div>

        <div style="margin-top:30px;border-top:1px solid #ddd;"></div>
        <div style="text-align:center;font-weight:800;font-size:18px;padding:14px 0;border-bottom:2px solid #ddd;">بيانات المتسابق</div>

        ${row('الاسم بالكامل رباعي', d.full_name)}
        ${row('العمر', d.age)}
        ${row('الجنس', d.gender)}
        ${row('رقم الهاتف', d.phone)}
        ${row('المستوي المراد الإشتراك فيه', d.memorized_parts)}
        ${row('العنوان', d.address)}
        ${row('اسم الشيخ المحفظ', d.sheikh_name)}
        ${row('تاريخ التسجيل', today)}

        <div style="text-align:center;font-weight:800;font-size:18px;padding:14px 0;border-top:2px solid #ddd;border-bottom:1px solid #ddd;margin-top:10px;">الصورة الشخصية</div>
        ${photoBlock}

        <div style="margin-top:20px;border-top:1px solid #ddd;padding-top:18px;display:flex;justify-content:space-between;font-size:14px;color:#444;">
            <div>أقر أنا بأن جميع البيانات صحيحة</div>
            <div style="font-weight:700;">التوقيع : ..............................</div>
        </div>
        <div style="margin-top:30px;text-align:center;color:#3a6b2a;font-weight:700;">نسأل الله له التوفيق والسداد</div>
    </div>`;
}

// صفحة ثانية في الـ PDF: صورة البطاقة / شهادة الميلاد
function buildIdPageHtml(d, idBox) {
    return `
    <div style="width:794px;min-height:1123px;background:#fff;padding:40px 44px;box-sizing:border-box;
                font-family:'Cairo',Tahoma,Arial,sans-serif;direction:rtl;color:#222;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="text-align:right;">
                <div style="font-size:26px;font-weight:700;color:#0a5a46;line-height:1.7;">مسابقة نبروة الكبرى</div>
                <div style="font-size:18px;font-weight:700;color:#c77b24;line-height:1.7;">مرفقات المتسابق: ${escapeHtml(d.full_name)}</div>
            </div>
            <div data-slot="logo" style="width:110px;height:110px;"></div>
        </div>
        <div style="margin-top:20px;border-top:1px solid #ddd;"></div>
        <div style="text-align:center;font-weight:800;font-size:18px;padding:14px 0;border-bottom:1px solid #ddd;">صورة البطاقة / شهادة الميلاد</div>
        <div style="display:flex;justify-content:center;padding:24px 0;">
            <div data-slot="id" style="width:${idBox.w}px;height:${idBox.h}px;border:2px solid #0a5a46;box-sizing:content-box;"></div>
        </div>
    </div>`;
}

// تصوير صفحة HTML (النصوص فقط) + قياس أماكن الصور المحجوزة
async function captureHtmlPage(html) {
    const holder = document.createElement('div');
    // مهم: الصفحة داخل الشاشة (left:0) ومخفية خلف المحتوى - مش خارج الشاشة بـ -10000px
    holder.style.cssText = 'position:fixed;left:0;top:0;z-index:-9999;pointer-events:none;';
    holder.innerHTML = html;
    document.body.appendChild(holder);
    try {
        const root = holder.firstElementChild;
        root.getBoundingClientRect(); // إجبار المتصفح على عمل layout قبل انتظار الخطوط
        if (document.fonts && document.fonts.ready) await document.fonts.ready;

        const rootRect = root.getBoundingClientRect();
        const slots = {};
        root.querySelectorAll('[data-slot]').forEach(el => {
            const r = el.getBoundingClientRect();
            slots[el.dataset.slot] = {
                x: r.left - rootRect.left + el.clientLeft,
                y: r.top - rootRect.top + el.clientTop,
                w: el.clientWidth,
                h: el.clientHeight
            };
        });

        const canvas = await html2canvas(root, {
            scale: 1.3,
            backgroundColor: '#ffffff',
            logging: false,
            scrollX: 0,
            scrollY: 0
        });
        return {
            imgData: canvas.toDataURL('image/jpeg', 0.8),
            cw: canvas.width,
            ch: canvas.height,
            rootW: rootRect.width,
            slots
        };
    } finally {
        holder.remove();
    }
}

async function generatePdfBlob(d, photo, idImg) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
    const pageW = 210, pageH = 297;

    const photoBox = photo ? fitBox(photo.w, photo.h, 220, 260) : null;
    const idBox = idImg ? fitBox(idImg.w, idImg.h, 680, 880) : null;

    // تصوير الصفحتين في نفس الوقت
    const [p1, p2] = await Promise.all([
        captureHtmlPage(buildPdfHtml(d, photoBox)),
        idImg ? captureHtmlPage(buildIdPageHtml(d, idBox)) : Promise.resolve(null)
    ]);

    function placePage(page, images, isFirst) {
        let w = pageW, h = (page.ch * w) / page.cw;
        if (h > pageH) { h = pageH; w = (page.cw * h) / page.ch; }
        const x0 = (pageW - w) / 2;
        const k = w / page.rootW; // mm لكل 1px
        if (!isFirst) pdf.addPage();
        pdf.addImage(page.imgData, 'JPEG', x0, 0, w, h);
        for (const [name, dataUrl] of Object.entries(images)) {
            const s = page.slots[name];
            if (!s || !dataUrl) continue;
            pdf.addImage(dataUrl, 'JPEG', x0 + s.x * k, s.y * k, s.w * k, s.h * k, name === 'logo' ? 'logo' : undefined);
        }
    }

    placePage(p1, { logo: LOGO_DATA_URI, photo: photo && photo.url }, true);
    if (p2) placePage(p2, { logo: LOGO_DATA_URI, id: idImg.url }, false);

    return pdf.output('blob');
}

/* ==========================================================================
   قياس وقت التحميل وطباعته في الكونسول
   ========================================================================== */
function createTimer(label) {
    const start = performance.now();
    let last = start;
    const steps = [];
    const extras = {};
    const fmt = (ms) => (ms / 1000).toFixed(2) + " ث";
    return {
        // سجّل نهاية مرحلة (بيحسب المدة من آخر مرحلة)
        mark(name) {
            const now = performance.now();
            steps.push({ "المرحلة": name, "المدة": fmt(now - last), "الإجمالي لحد هنا": fmt(now - start) });
            last = now;
        },
        // معلومة إضافية تتطبع مع الجدول (زي حجم الملف)
        info(name, value) { extras[name] = value; },
        // اطبع كل حاجة في الكونسول
        print() {
            console.group("⏱ " + label + " — الإجمالي: " + fmt(performance.now() - start));
            console.table(steps);
            Object.keys(extras).forEach(k => console.log(k + ":", extras[k]));
            console.groupEnd();
        }
    };
}

// وقت تحميل الصفحة نفسها
window.addEventListener("load", () => {
    setTimeout(() => {
        const nav = performance.getEntriesByType("navigation")[0];
        if (!nav) return;
        console.log(
            "⏱ تحميل الصفحة:",
            ((nav.loadEventEnd || performance.now()) / 1000).toFixed(2) + " ث",
            "| أول استجابة من السيرفر:", (nav.responseStart / 1000).toFixed(2) + " ث"
        );
    }, 0);
});

// تحميل بيانات المنع مقدماً أول ما الصفحة تفتح (توفير وقت وقت الإرسال)
if (form) {
    loadBlockedData().catch(() => {});
}

// أقصى مدة انتظار للإرسال (60 ثانية)
const SEND_TIMEOUT_MS = 60000;

if (form) {
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const submitBtn = form.querySelector("button[type='submit']");
        const setStatus = (text) => { submitBtn.innerText = text; };

        submitBtn.disabled = true;
        setStatus("جاري التحقق من البيانات...");

        const timer = createTimer("إرسال التسجيل");

        try {
            const data = {
                full_name: form.full_name.value.trim(),
                age: form.age.value,
                gender: form.gender.value,
                memorized_parts: form.memorized_parts.value,
                phone: form.phone.value.trim(),
                address: form.address.value.trim(),
                sheikh_name: form.sheikh_name.value.trim()
            };

            const file = attachmentInput && attachmentInput.files ? attachmentInput.files[0] : null;
            const idFile = idDocInput && idDocInput.files ? idDocInput.files[0] : null;

        // الفحوصات السريعة الأول (من غير أي طلب شبكة)
        if (data.gender === 'ذكر' && !file) {
            await showPopup('warning', "الصورة الشخصية إجبارية للمتسابقين الذكور");
            return;
        }
        if (!isNabroaAddress(data.address)) {
            await showPopup('warning', "التسجيل متاح فقط لسكان مدينة نبروة، يرجى كتابة العنوان متضمناً اسم المدينة (نبروة)");
            return;
        }
        if (!idFile) {
            await showPopup('warning', "صورة البطاقة أو شهادة الميلاد إجبارية");
            return;
        }

        // التحقق من المتسابقين السابقين (قبل أي إرسال)
        const blockMsg = await checkRegistrationAllowed(data.full_name, data.memorized_parts, data.age);
        if (blockMsg) {
            await showPopup('warning', blockMsg);
            return;
        }

        timer.mark("التحقق من البيانات");

        // الصور غالباً جاهزة من وقت اختيارها، وإلا بتتضغط الآن بالتوازي
        setStatus("جاري تجهيز الملف...");
        const [photo, idImg] = await Promise.all([
            prepareImage(file, ...PHOTO_OPTS),
            prepareImage(idFile, ...ID_OPTS)
        ]);

        timer.mark("تجهيز وضغط الصور");
        const pdfBlob = await generatePdfBlob(data, photo, idImg);
        timer.mark("توليد ملف PDF");
        const pdfFile = new File([pdfBlob], "registration.pdf", { type: "application/pdf" });
        timer.info("حجم الـ PDF", Math.round(pdfFile.size / 1024) + " KB");

        const fd = new FormData();
        fd.append("_subject", "متسابق جديد: " + data.full_name);
        fd.append("_template", "table");
        fd.append("_captcha", "false");
        fd.append("الاسم", data.full_name);
        fd.append("العمر", data.age);
        fd.append("الجنس", data.gender);
        fd.append("المستوى المراد الاشتراك فيه", data.memorized_parts);
        fd.append("رقم الهاتف", data.phone);
        fd.append("العنوان", data.address);
        fd.append("اسم الشيخ المحفظ", data.sheikh_name);
        fd.append("صورة البطاقة أو شهادة الميلاد", "مرفقة داخل ملف PDF (الصفحة 2)");
        fd.append("الصورة", file ? "مرفقة داخل ملف PDF" : "لم تُرفق (اختيارية)");
        fd.append("attachment", pdfFile, "registration.pdf");

        setStatus("جاري الإرسال إنتظر دقيقة ...");

        // الرابط العادي مع no-cors: بيدعم المرفقات (الـ ajax مش بيدعمها)
        // ملحوظة: مع no-cors مش بنقدر نقرأ الرد، فنجاح الإرسال = عدم حدوث خطأ شبكة
        const controller = new AbortController();
        const abortTimer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
        try {
            await fetch(FORMSUBMIT_URL, {
                method: "POST",
                mode: "no-cors",
                body: fd,
                signal: controller.signal
            });
        } catch (err) {
            if (err && err.name === "AbortError") {
                throw new Error("انتهت مهلة الإرسال، تأكد من الاتصال بالإنترنت وحاول مرة أخرى");
            }
            throw err;
        } finally {
            clearTimeout(abortTimer);
        }

        timer.mark("الإرسال للسيرفر");
        timer.print();

        form.reset();
        updatePhotoRequirement();
        await showPopup('success', "تم تسجيل بياناتك بنجاح، بارك الله فيك ونسأل الله لك التوفيق", "تم التسجيل");
    } catch (error) {
        console.error("Send Error:", error);
        timer.mark("توقف بسبب خطأ");
        timer.print();
        const reason = (error && error.message) || "";
        await showPopup('error', "حدث خطأ أثناء الإرسال\n" + reason);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "تأكيد التسجيل";
    }
    });
}