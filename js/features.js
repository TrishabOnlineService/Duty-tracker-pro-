// ============================================================
// FEATURES.JS — New Features: Biometric, Overtime, Salary Slip,
//               Offline Sync, Holiday Calendar, WhatsApp Share
// ============================================================

// ===== 1. BIOMETRIC LOGIN =====
const biometric = {
    async isSupported() {
        if (!window.PublicKeyCredential) return false;
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    },

    async register(userId) {
        try {
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: { name: "Duty Tracker Pro" },
                    user: {
                        id: new TextEncoder().encode(userId),
                        name: userId,
                        displayName: "User"
                    },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required"
                    },
                    timeout: 60000
                }
            });
            if (credential) {
                localStorage.setItem('biometric_id', userId);
                localStorage.setItem('biometric_credential_id', btoa(String.fromCharCode(...new Uint8Array(credential.rawId))));
                db.ref(`u/${userId}/biometric`).set(true);
                showToast("✅ Biometric registered!");
                biometric.updateUI();
            }
        } catch (e) {
            showToast("❌ Biometric setup failed: " + e.message);
        }
    },

    async verify() {
        try {
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);
            const credIdStr = localStorage.getItem('biometric_credential_id');
            const allowCredentials = credIdStr ? [{
                id: Uint8Array.from(atob(credIdStr), c => c.charCodeAt(0)),
                type: "public-key"
            }] : [];
            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge,
                    userVerification: "required",
                    allowCredentials,
                    timeout: 60000
                }
            });
            if (credential) {
                document.getElementById('pin-screen').style.display = 'none';
                const storedId = localStorage.getItem('dt_id');
                if (storedId) app.start(storedId);
                showToast("✅ Biometric verified!");
            }
        } catch (e) {
            showToast("Use PIN instead");
        }
    },

    async updateUI() {
        const supported = await biometric.isSupported();
        const registered = !!localStorage.getItem('biometric_credential_id');
        const bioBtn = document.getElementById('biometric-login-btn');
        const bioSetupBtn = document.getElementById('biometric-setup-btn');
        if (bioBtn) bioBtn.style.display = (supported && registered) ? 'flex' : 'none';
        if (bioSetupBtn) bioSetupBtn.style.display = supported ? 'block' : 'none';
        if (bioSetupBtn) bioSetupBtn.innerText = registered ? '🔐 Biometric: ON' : '🔐 Enable Biometric';
    },

    remove() {
        localStorage.removeItem('biometric_credential_id');
        if (s.uid) db.ref(`u/${s.uid}/biometric`).set(false);
        showToast("Biometric removed");
        biometric.updateUI();
    }
};

// ===== 2. OVERTIME CALCULATOR =====
const overtime = {
    calculate(uid) {
        if (!uid) return null;
        const conf = s.conf || {};
        const dailySalary = (conf.sal || 0) / 26;
        const regularHours = 8;
        const otRate = conf.otr || 1.5; // overtime multiplier

        let totalOT = 0;
        let otDays = 0;
        const month = new Date().toISOString().substring(0, 7);

        Object.entries(s.data || {}).forEach(([date, val]) => {
            if (!date.startsWith(month)) return;
            if (val.ci && val.co) {
                const inTime = new Date(`${date}T${val.ci}`);
                const outTime = new Date(`${date}T${val.co}`);
                let hours = (outTime - inTime) / 3600000;
                if (hours > regularHours) {
                    const otHours = hours - regularHours;
                    const hourlyRate = dailySalary / regularHours;
                    totalOT += otHours * hourlyRate * otRate;
                    otDays++;
                }
            }
        });

        return {
            totalOT: Math.round(totalOT),
            otDays,
            currency: conf.cur || '₹'
        };
    },

    showModal() {
        const result = overtime.calculate(s.uid);
        if (!result) return showToast("No data available");
        const html = `
            <div style="text-align:center; padding:20px;">
                <div style="font-size:48px; margin-bottom:10px;">⏰</div>
                <h3 style="margin-bottom:16px;">Overtime This Month</h3>
                <div style="background:var(--card-bg); border-radius:12px; padding:16px; margin-bottom:12px;">
                    <div style="font-size:28px; font-weight:700; color:var(--accent);">${result.currency}${result.totalOT}</div>
                    <div style="font-size:13px; color:var(--text-muted); margin-top:4px;">Total Overtime Earnings</div>
                </div>
                <div style="background:var(--card-bg); border-radius:12px; padding:12px;">
                    <div style="font-size:20px; font-weight:600;">${result.otDays} Days</div>
                    <div style="font-size:13px; color:var(--text-muted);">with overtime worked</div>
                </div>
                <p style="font-size:12px; color:var(--text-muted); margin-top:12px;">Based on ${result.otRate || 1.5}x overtime rate & 8hr regular shift</p>
            </div>`;
        document.getElementById('c-title').innerText = '';
        document.getElementById('c-desc').innerHTML = html;
        document.getElementById('c-yes-btn').style.display = 'none';
        document.getElementById('confirm-modal').style.display = 'flex';
    }
};

// ===== 3. SALARY SLIP GENERATOR =====
const salarySlip = {
    generate() {
        if (!isPremium()) { promo.show(); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const conf = s.conf || {};
        const profile = s.profile || {};
        const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

        const sal = conf.sal || 0;
        const food = conf.food || 0;
        const pf = conf.pf || 0;
        const otResult = overtime.calculate(s.uid) || { totalOT: 0 };
        const gross = sal + food + otResult.totalOT;
        const net = gross - pf;
        const cur = conf.cur || '₹';

        // Header
        doc.setFillColor(67, 97, 238);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('SALARY SLIP', 105, 18, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Duty Tracker Pro', 105, 28, { align: 'center' });
        doc.text(`Pay Period: ${month}`, 105, 36, { align: 'center' });

        // Employee Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Employee Details', 14, 55);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Name: ${profile.name || 'Employee'}`, 14, 65);
        doc.text(`Employee ID: ${s.uid || 'N/A'}`, 14, 73);
        doc.text(`Email: ${profile.email || 'N/A'}`, 14, 81);

        // Salary Table
        doc.autoTable({
            startY: 92,
            head: [['Earnings', 'Amount', 'Deductions', 'Amount']],
            body: [
                ['Basic Salary', `${cur}${sal}`, 'Provident Fund', `${cur}${pf}`],
                ['Food Allowance', `${cur}${food}`, '', ''],
                ['Overtime', `${cur}${otResult.totalOT}`, '', ''],
                ['', '', '', ''],
                [{ content: 'Gross Salary', styles: { fontStyle: 'bold' } }, { content: `${cur}${gross}`, styles: { fontStyle: 'bold' } },
                 { content: 'Net Payable', styles: { fontStyle: 'bold' } }, { content: `${cur}${net}`, styles: { fontStyle: 'bold', textColor: [67, 97, 238] } }]
            ],
            theme: 'grid',
            headStyles: { fillColor: [67, 97, 238], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 247, 255] }
        });

        // Footer
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('This is a computer generated salary slip. Powered by Duty Tracker Pro.', 105, finalY, { align: 'center' });

        doc.save(`Salary_Slip_${month.replace(' ', '_')}.pdf`);
        showToast("✅ Salary slip downloaded!");
    }
};

// ===== 4. OFFLINE SYNC (IndexedDB) =====
const offlineSync = {
    db: null,

    async init() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('DutyTrackerOffline', 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('pending')) {
                    db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
                }
            };
            req.onsuccess = (e) => { offlineSync.db = e.target.result; resolve(); };
            req.onerror = () => reject(req.error);
        });
    },

    async savePending(date, type, checkIn, checkOut) {
        const tx = offlineSync.db.transaction('pending', 'readwrite');
        tx.objectStore('pending').add({ date, type, checkIn, checkOut, uid: s.uid, savedAt: Date.now() });
        showToast("📴 Saved offline — will sync when online");
    },

    async syncAll() {
        if (!navigator.onLine || !s.uid) return;
        const tx = offlineSync.db.transaction('pending', 'readwrite');
        const store = tx.objectStore('pending');
        const all = await new Promise(resolve => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
        });
        if (!all.length) return;
        const updates = {};
        all.forEach(item => {
            updates[`u/${item.uid}/att/${item.date}`] = {
                t: item.type,
                ci: item.checkIn || null,
                co: item.checkOut || null
            };
        });
        await firebase.database().ref().update(updates);
        // Clear pending
        all.forEach(item => store.delete(item.id));
        showToast(`✅ ${all.length} offline records synced!`);
    }
};

window.addEventListener('online', () => offlineSync.syncAll());

// ===== 5. HOLIDAY CALENDAR (India + User Country) =====
const holidayCalendar = {
    holidays: {
        "2026-01-01": "🎆 New Year's Day",
        "2026-01-14": "🌾 Makar Sankranti",
        "2026-01-26": "🇮🇳 Republic Day",
        "2026-03-17": "🎨 Holi",
        "2026-04-02": "✝️ Good Friday",
        "2026-04-14": "🌸 Dr. Ambedkar Jayanti",
        "2026-04-21": "🌙 Eid ul-Fitr",
        "2026-05-01": "👷 Labour Day",
        "2026-06-28": "🌙 Eid ul-Adha",
        "2026-08-15": "🇮🇳 Independence Day",
        "2026-08-22": "🐘 Ganesh Chaturthi",
        "2026-10-02": "✌️ Gandhi Jayanti",
        "2026-10-20": "💡 Dussehra",
        "2026-11-04": "🪔 Diwali",
        "2026-11-05": "🪔 Govardhan Puja",
        "2026-11-15": "🙏 Guru Nanak Jayanti",
        "2026-12-25": "🎄 Christmas"
    },

    isHoliday(date) {
        return !!this.holidays[date];
    },

    getName(date) {
        return this.holidays[date] || null;
    },

    showUpcoming() {
        const today = new Date().toISOString().split('T')[0];
        const upcoming = Object.entries(this.holidays)
            .filter(([d]) => d >= today)
            .slice(0, 6);

        const rows = upcoming.map(([date, name]) => {
            const d = new Date(date);
            const dayStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
            const isPast = date < today;
            return `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border);">
                <div>
                    <div style="font-size:14px; font-weight:600;">${name}</div>
                    <div style="font-size:12px; color:var(--text-muted);">${dayStr}</div>
                </div>
                <span style="background:var(--accent); color:#fff; padding:4px 10px; border-radius:20px; font-size:11px;">Holiday</span>
            </div>`;
        }).join('');

        document.getElementById('c-title').innerText = '📅 Upcoming Holidays';
        document.getElementById('c-desc').innerHTML = `<div style="margin-top:8px;">${rows}</div>`;
        document.getElementById('c-yes-btn').style.display = 'none';
        document.getElementById('confirm-modal').style.display = 'flex';
    }
};

// ===== 6. ENHANCED WHATSAPP SHARE =====
function shareToWhatsAppEnhanced() {
    if (!isPremium()) { promo.show(); return; }
    const conf = s.conf || {};
    const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const data = s.data || {};
    const monthKey = new Date().toISOString().substring(0, 7);

    let present = 0, absent = 0, halfDay = 0, leave = 0;
    Object.entries(data).forEach(([date, val]) => {
        if (!date.startsWith(monthKey)) return;
        if (val.t === 'P') present++;
        else if (val.t === 'A') absent++;
        else if (val.t === 'H') halfDay++;
        else if (val.t === 'L') leave++;
    });

    const sal = conf.sal || 0;
    const earned = Math.round((sal / 26) * present);
    const otResult = overtime.calculate(s.uid) || { totalOT: 0 };

    const text = `📊 *Duty Tracker Report*
📅 Month: ${month}
👤 Name: ${s.profile?.name || 'Employee'}

✅ Present: ${present} days
❌ Absent: ${absent} days
🌓 Half Day: ${halfDay} days
🏖️ Leave: ${leave} days

💰 Est. Salary: ${conf.cur || '₹'}${earned}
⏰ Overtime: ${conf.cur || '₹'}${otResult.totalOT}
💵 Total: ${conf.cur || '₹'}${earned + otResult.totalOT}

📱 Powered by Duty Tracker Pro
🔗 https://dutytrackerpro.blogspot.com`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

// Init offline sync on load
document.addEventListener('DOMContentLoaded', async () => {
    await offlineSync.init();
    biometric.updateUI();
});
