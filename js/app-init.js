        document.addEventListener('DOMContentLoaded', () => {
            const ccSelects = ['cc-login', 'cc-signup'];
            ccSelects.forEach(selectId => { const ccSelect = document.getElementById(selectId); countries.forEach(c => { let o = document.createElement('option'); o.value = c.c; o.innerText = `${c.n} (${c.c})`; if(c.n === "India") o.selected = true; ccSelect.appendChild(o); }); });
            history.replaceState({page: 'home'}, null, '');
            document.body.setAttribute('data-theme', localStorage.getItem('theme') || 'dark');
            const vid = document.getElementById('promo-vid'); if(vid) vid.pause();
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) { await OneSignal.init({ appId: ONESIGNAL_APP_ID, allowLocalhostAsSecureOrigin: true, welcomeNotification: { disable: true } }); });
            loadAppConfig();
            loadPriceConfig();
            document.getElementById('binance-screenshot').addEventListener('change', (e) => { const file = e.target.files[0]; if(file) { const reader = new FileReader(); reader.onload = (event) => { document.getElementById('screenshot-preview').innerHTML = `<img src="${event.target.result}" alt="Preview">`; }; reader.readAsDataURL(file); } });
            db.ref('config/maintenance').on('value', (snap) => { appConfig.maintenance = snap.val() || false; if(appConfig.maintenance) { document.getElementById('maintenance-mode').style.display = 'flex'; document.getElementById('main-app').style.display = 'none'; document.getElementById('auth-screen').style.display = 'none'; document.getElementById('splash').style.display = 'none'; } else { document.getElementById('maintenance-mode').style.display = 'none'; setTimeout(() => { document.getElementById('splash').style.opacity = '0'; setTimeout(() => { document.getElementById('splash').style.display='none'; const id = localStorage.getItem('dt_id'); if(id) app.start(id); else document.getElementById('auth-screen').style.display='flex'; }, 800); }, 2500); } });
            const faqs = [
                {q:"How to add a duty?", a:"Tap on 'Add Today's Duty' on the home screen, or tap any date on the calendar."},
                {q:"How to delete an entry?", a:"Tap on the date you want to delete. In the modal that appears, click the Red 'Delete' button."},
                {q:"How does Advance work?", a:"Go to 'Advance' tab. Enter amount and date. This amount will be automatically deducted from your final Net Payable in the Reports section. (Premium)"},
                {q:"How to check-in/out?", a:"Use the Check-in/Check-out buttons on home screen. (FREE)"},
                {q:"How to pay with Binance?", a:"Send USDT (TRC20) to the wallet and submit screenshot. Admin will verify within 24-48 hours."},
                {q:"How to pay with PayPal?", a:"Click PayPal button. You'll be redirected to PayPal for secure payment."},
                {q:"How to get free premium?", a:"Join our Telegram and WhatsApp channels from the popup after login to get 7 days free premium!"}
            ];
            const fl = document.getElementById('faq-list');
            faqs.forEach(f => { fl.innerHTML += `<div class="faq-item"><div class="faq-q" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display=='block'?'none':'block'">${f.q} <i class="fas fa-chevron-down"></i></div><div class="faq-a">${f.a}</div></div>`; });
            document.getElementById('adv-date').value = new Date().toISOString().split('T')[0];
            reminder.init();
            checkPayPalReturn();
            
            // Clear old API-based translation cache
            for(let k of Object.keys(localStorage)) {
                if(k.startsWith('i18n_cache_')) localStorage.removeItem(k);
            }
            // Initialize i18n here (inside main DOMContentLoaded, after app loads)
            setTimeout(() => i18n.init(), 600);
            
            // Android Back Button Handler
            document.addEventListener('backbutton', function(e) {
                e.preventDefault();
                if(document.getElementById('pin-screen').style.display === 'flex') {
                    pin.cancel();
                } else if(document.getElementById('promo-screen').style.display === 'flex') {
                    promo.close();
                } else if(document.getElementById('legal-modal').style.display === 'block') {
                    ui.closeAll();
                } else if(document.querySelector('.page[style*="display: flex"]')) {
                    ui.closeAll();
                } else {
                    ui.closeAll();
                }
            }, false);
        });

        window.onpopstate = function(event) {
            document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
            document.getElementById('legal-modal').style.display = 'none';
            document.getElementById('promo-screen').style.display = 'none';
            document.getElementById('pay-wall').style.display = 'none';
            document.getElementById('reward-popup').style.display = 'none';
            document.getElementById('pin-screen').style.display = 'none';
            document.getElementById('binance-modal').style.display = 'none';
            if(!event.state || event.state.page === 'home') { document.querySelectorAll('.page').forEach(p=>p.style.display='none'); document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active')); document.querySelectorAll('.nav-btn')[2].classList.add('active'); }
        };

        const app = {
            logout: () => { ui.confirm("Log Out", "Are you sure?", () => { localStorage.removeItem('dt_id'); location.reload(); }); },
            start: (id) => {
                s.uid = id;
                document.getElementById('main-app').style.display = 'flex';
                db.ref('u/'+id).on('value', sn => {
                    const v = sn.val() || {};
                    s.data = v.att || {};
                    s.adv = v.adv || {};
                    s.conf = v.conf || {cur:'₹', sal:0, otr:0, food:0, pf:0, target: 0};
                    s.profile = v.profile || {name: 'User', img: '', email: ''};
                    s.sub = v.subExp || Date.now() + (3*86400000); 
                    s.history = v.history || {};
                    s.pin = v.pin || '';
                    s.checkin = v.checkin || null;
                    s.checkout = v.checkout || null;
                    s.reward = v.reward || { telegram_joined: 0, whatsapp_joined: 0, reward_claimed: 0, reward_expiry_date: null };
                    s.updateActionTaken = v.updateActionTaken || false;
                    if(!v.subExp) db.ref('u/'+id+'/subExp').set(s.sub);
                    if(!v.refCode) ref.gen();
                    else { s.refCode = v.refCode; document.getElementById('my-ref-code').innerText = s.refCode; }
                    document.getElementById('prof-name-disp').innerText = s.profile.name || "User";
                    document.getElementById('prof-id').innerText = id;
                    document.getElementById('prof-email').innerText = s.profile.email || "";
                    if(s.profile.img) { document.getElementById('prof-img-el').src = s.profile.img; document.getElementById('mini-prof-img').src = s.profile.img; toDataURL(s.profile.img, (res) => { s.profBase64 = res; }); }
                    if(s.checkin) document.getElementById('checkin-display').innerText = s.checkin.time;
                    if(s.checkout) document.getElementById('checkout-display').innerText = s.checkout.time;
                    const exD = new Date(s.sub); const daysLeft = Math.ceil((s.sub - Date.now()) / (1000*60*60*24)); const isExp = s.sub < Date.now();
                    if(isExp) { document.getElementById('prof-badge').innerText="EXPIRED"; document.getElementById('prof-badge').style.background="red"; document.getElementById('prof-exp').innerText = "Expired: "+exD.toLocaleDateString(); }
                    else { document.getElementById('prof-badge').innerText="PREMIUM"; document.getElementById('prof-badge').style.background="var(--accent)"; document.getElementById('prof-exp').innerText = `Valid till: ${exD.toLocaleDateString()} (${daysLeft} Days)`; }
                    document.getElementById('set-cur').value = s.conf.cur || '₹'; document.getElementById('set-sal').value = s.conf.sal || ''; document.getElementById('set-food').value = s.conf.food || ''; document.getElementById('set-otr').value = s.conf.otr || ''; document.getElementById('set-pf').value = s.conf.pf || ''; document.getElementById('set-target').value = s.conf.target || ''; document.getElementById('target-val-disp').innerText = s.conf.target || 0;
                    cal.render(); advance.renderList(); graph.updateTodayText(); updateStreakUI();
                    const hl = document.getElementById('hist-list'); hl.innerHTML = ''; const hArr = []; for(let k in s.history) hArr.push(s.history[k]); hArr.reverse(); if(hArr.length === 0) hl.innerHTML = '<div style="text-align:center;color:var(--text-sub);">No payment history found.</div>'; hArr.forEach(h => { hl.innerHTML += `<div class="hist-item"><div><div style="font-weight:bold;">Premium Subscription</div><div class="hist-date">${new Date(h.date).toLocaleString()}</div><div class="hist-date">Via ${h.method}</div></div><div class="hist-amt">${h.currency === 'USD' ? '$' : '₹'}${h.amount}</div></div>`; });
                    checkPremiumAccess();
                    if(document.getElementById('promo-screen').style.display !== 'flex' && document.getElementById('reward-popup').style.display !== 'flex' && s.pin && !pinVerified) { setTimeout(() => { document.getElementById('main-app').style.display = 'none'; pin.init('verify'); }, 500); } else if(!s.pin) { document.getElementById('main-app').style.display = 'flex'; }
                    security.updateAutoLockUI();
                    if(!isExp) { reward.checkAndShow(); }
                    checkForcedUpdate();
                    listenForInAppNotifications();
                    loadBinanceRequests();
                    trackUserActivity(id, 'app_open');
                    db.ref(`adminNotifications/${id}`).on('child_added', (snap) => { const notif = snap.val(); if(notif && notif.title) { if(Notification.permission === "granted") { new Notification(notif.title, { body: notif.body, icon: notif.icon || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }); } showToast(notif.title + ": " + notif.body); if(notif.url) setTimeout(() => window.open(notif.url, '_blank'), 1000); db.ref(`adminNotifications/${id}/${snap.key}`).remove(); } });
                });
            }
        };

        const cal = {
            render: () => { const y=curDate.getFullYear(), m=curDate.getMonth(); document.getElementById('month-display').innerText = new Date(y,m).toLocaleString('default',{month:'long',year:'numeric'}); const g = document.getElementById('calendar-grid'); g.innerHTML=''; const fd = new Date(y,m,1).getDay(), ld = new Date(y,m+1,0).getDate(); const today = new Date().toISOString().split('T')[0]; for(let i=0; i<fd; i++) g.innerHTML += '<div></div>'; for(let i=1; i<=ld; i++) { const iso = `${y}-${String(m+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`; const d = s.data[iso]; const cls = d ? 'bg-'+d.t.replace(' ','') : ''; const el = document.createElement('div'); let holidayClass = ''; if(isPremium() && isHoliday(iso)) holidayClass = 'bg-Holiday'; el.className = `day ${cls} ${holidayClass} ${iso===today?'today':''}`; el.innerHTML = `<span class="day-num">${i}</span>`; if(d) { el.innerHTML += `<span class="day-tag">${d.t}</span>`; if(d.ot) el.innerHTML += `<div class="ot-badge">${d.ot}h</div>`; } else if(isPremium() && isHoliday(iso)) el.innerHTML += `<span class="day-tag">Holiday</span>`; el.onclick = () => data.open(iso); g.appendChild(el); } },
            move: (n) => { curDate.setMonth(curDate.getMonth()+n); cal.render(); }
        };

        const data = {
            open: (d) => { selDate = d; document.getElementById('modal-date').innerText = new Date(d).toDateString(); document.getElementById('att-modal').style.display='block'; history.pushState({page: 'modal'}, null, ''); document.querySelectorAll('.btn-sec').forEach(b => b.classList.remove('active')); const en = s.data[d]; if(en) { document.getElementById('inp-ot').value = en.ot||''; document.getElementById('inp-late').value = en.lt||''; document.getElementById('inp-shift').value = en.shift || 'Morning'; selType = en.t; const btns = document.querySelectorAll('#att-modal .btn-sec'); btns.forEach(btn => { if(btn.innerText === en.t) btn.classList.add('active'); }); } else { document.getElementById('inp-ot').value = ''; document.getElementById('inp-late').value = ''; document.getElementById('inp-shift').value = 'Morning'; selType = null; } },
            set: (t, el) => { selType = t; document.querySelectorAll('.btn-sec').forEach(b => b.classList.remove('active')); if(el) el.classList.add('active'); },
            save: () => { if(!selType && s.data[selDate]) selType = s.data[selDate].t; if(!selType) selType = 'Present'; const p = { t: selType, ot: document.getElementById('inp-ot').value, lt: document.getElementById('inp-late').value, shift: document.getElementById('inp-shift').value }; db.ref(`u/${s.uid}/att/${selDate}`).set(p); ui.closeAll(); showToast("Saved Successfully"); updateStreakUI(); trackUserActivity(s.uid, 'add_duty'); },
            clear: () => { ui.confirm("Delete Entry", "Delete this record?", () => { db.ref(`u/${s.uid}/att/${selDate}`).remove(); ui.closeAll(); updateStreakUI(); trackUserActivity(s.uid, 'delete_duty'); }); }
        };

        const advance = {
            add: () => { if(!isPremium()) { promo.show(); return; } const amt = parseFloat(document.getElementById('adv-amt').value); const dt = document.getElementById('adv-date').value; if(!amt || !dt) return showToast("Enter Amount & Date"); db.ref(`u/${s.uid}/adv`).push({ amt: amt, date: dt, by: document.getElementById('adv-by').value, note: document.getElementById('adv-note').value }); showToast("Advance Added"); document.getElementById('adv-amt').value = ''; advance.renderList(); trackUserActivity(s.uid, 'add_advance'); },
            delete: (key) => { ui.confirm("Delete Advance", "Sure?", () => db.ref(`u/${s.uid}/adv/${key}`).remove()); },
            renderList: () => { const list = document.getElementById('adv-list-container'); if(list) { list.innerHTML = ''; let total = 0; const arr = []; for(let k in s.adv) { arr.push({...s.adv[k], key: k}); } arr.sort((a,b) => new Date(b.date) - new Date(a.date)); arr.forEach(a => { total += parseFloat(a.amt); list.innerHTML += `<div class="adv-item"><div><div style="font-weight:bold;">${s.conf.cur}${a.amt}</div><div style="font-size:12px; color:var(--text-sub);">${a.date} ${a.by?'• '+a.by:''}</div></div><button style="background:none;border:none;color:var(--danger);" onclick="advance.delete('${a.key}')"><i class="fas fa-trash"></i></button></div>`; }); document.getElementById('total-adv-disp').innerText = `Total: ${s.conf.cur}${total}`; } }
        };

        const graph = {
            render: () => { if(!isPremium()) return; const ctx = document.getElementById('dutyChart'); if(!ctx) return; const labels = [], dataPoints = []; for(let i=29; i>=0; i--) { const d = new Date(); d.setDate(new Date().getDate() - i); const iso = d.toISOString().split('T')[0]; labels.push(d.getDate()); const entry = s.data[iso]; let h = 0; if(entry) { if(entry.t === 'Present') h = 8; else if(entry.t === 'Half Day') h = 4; if(entry.ot) h += parseFloat(entry.ot); } dataPoints.push(h); } if(chartInstance) chartInstance.destroy(); chartInstance = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: 'Hours', data: dataPoints, borderColor: '#4361ee', backgroundColor: 'rgba(67, 97, 238, 0.1)', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display:false }, y: { beginAtZero: true } } } }); const target = parseFloat(s.conf.target) || 1; let earned = 0, SAL = parseFloat(s.conf.sal)||0; const m = new Date().getMonth(); for(let k in s.data) { if(new Date(k).getMonth()===m && ['Present','Holiday','Sick'].includes(s.data[k].t)) earned += SAL; } const pct = Math.min(100, (earned / target) * 100).toFixed(1); document.getElementById('target-pct').innerText = pct + '%'; document.getElementById('target-bar').style.width = pct + '%'; },
            setTarget: () => { if(!isPremium()) { promo.show(); return; } db.ref(`u/${s.uid}/conf/target`).set(parseFloat(document.getElementById('set-target').value)); showToast("Goal Updated"); },
            updateTodayText: () => { const t = s.data[new Date().toISOString().split('T')[0]]; document.getElementById('graph-today-hours').innerText = t ? (t.t==='Present'?8:4) + (parseFloat(t.ot)||0) + " Hours" : "0 Hours"; document.getElementById('today-status').innerText = t ? `Marked: ${t.t}` : "No Entry Today"; }
        };

        const ref = {
            gen: () => { const c = Math.random().toString(36).substring(2,8).toUpperCase(); db.ref('refList/'+c).set(s.uid); db.ref(`u/${s.uid}/refCode`).set(c); s.refCode = c; document.getElementById('my-ref-code').innerText = c; },
            share: () => { const t = `Use code ${s.refCode} on Duty Tracker Pro. Get +10 Days Free! Download: https://dutytrackerpro.blogspot.com`; if(navigator.share) navigator.share({title:'Referral', text:t}); else prompt("Copy", s.refCode); },
            redeem: () => { const c = document.getElementById('friend-code').value.toUpperCase().trim(); if(c===s.refCode) return showToast("Own code not allowed"); db.ref(`u/${s.uid}/redeemed`).once('value', sn => { if(sn.exists()) return showToast("Already Redeemed"); db.ref('refList/'+c).once('value', rsn => { if(!rsn.val()) return showToast("Invalid Code"); const rid = rsn.val(); db.ref(`u/${s.uid}/subExp`).set(Math.max(s.sub, Date.now()) + (10*86400000)); db.ref(`u/${s.uid}/redeemed`).set(true); db.ref(`u/${rid}/subExp`).once('value', os => { db.ref(`u/${rid}/subExp`).set(Math.max(os.val()||Date.now(), Date.now()) + (10*86400000)); }); showToast("Success! +10 Days Added"); trackUserActivity(s.uid, 'referral_redeemed'); }); }); }
        };

        const ui = {
            toggleTheme: () => { const b = document.body; const n = b.getAttribute('data-theme')==='light'?'dark':'light'; b.setAttribute('data-theme', n); localStorage.setItem('theme', n); },
            closeAll: () => { 
                document.querySelectorAll('.page').forEach(p=>p.style.display='none'); 
                document.querySelectorAll('.modal').forEach(m=>m.style.display='none');
                document.getElementById('legal-modal').style.display='none';
                document.getElementById('main-app').style.display='flex';
                document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active')); 
                document.querySelectorAll('.nav-btn')[2].classList.add('active');
                if(window.history.length > 1 && document.referrer) window.history.back();
            },
            openPage: (id) => { 
                document.querySelectorAll('.page').forEach(p=>p.style.display='none'); 
                document.getElementById(id).style.display='flex'; 
                history.pushState({page: id}, null, ''); 
            },
            openProfile: () => { ui.openPage('page-profile'); },
            openSettings: () => { ui.openPage('page-settings'); checkPremiumAccess(); },
            openReport: () => { ui.openPage('page-reports'); checkPremiumAccess(); },
            openAdvance: () => { ui.openPage('page-advance'); checkPremiumAccess(); },
            openGraph: () => { ui.openPage('page-graph'); graph.render(); checkPremiumAccess(); },
            confirm: (title, desc, cb) => { document.getElementById('c-title').innerText = title; document.getElementById('c-desc').innerText = desc; const m = document.getElementById('confirm-modal'); m.style.display="flex"; document.getElementById('c-yes-btn').onclick = () => { cb(); m.style.display="none"; }; },
            closeConfirm: () => { document.getElementById('confirm-modal').style.display="none"; },
            sendFeedback: () => { const txt = document.getElementById('fb-text').value; if(txt.length > 5) { window.location.href = `mailto:nitai.grp00@gmail.com?subject=Duty Tracker Pro Feedback&body=${encodeURIComponent(txt)}`; } else showToast("Please write more details"); }
        };

        const profile = {
            upload: async (input) => { if(input.files && input.files[0]) { showToast("Uploading..."); const fd = new FormData(); fd.append('key', IMG_API_KEY); fd.append('image', input.files[0]); try { const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: fd }); const json = await res.json(); if(json.success) { db.ref('u/'+s.uid+'/profile/img').set(json.data.url); showToast("Upload Successful"); } } catch(e) { showToast("Error Uploading"); } } }
        };

        const settings = { save: () => { if(!isPremium()) { promo.show(); return; } db.ref(`u/${s.uid}/conf`).set({ cur: document.getElementById('set-cur').value, sal: parseFloat(document.getElementById('set-sal').value)||0, otr: parseFloat(document.getElementById('set-otr').value)||0, food: parseFloat(document.getElementById('set-food').value)||0, pf: parseFloat(document.getElementById('set-pf').value)||0, target: parseFloat(document.getElementById('set-target').value)||0 }).then(()=>showToast("Saved")); } };

        const reminder = {
            init: () => { setInterval(() => { const n = new Date(); if(n.getHours() === 19 && n.getMinutes() === 0 && !s.data[n.toISOString().split('T')[0]]) { reminder.notify(); if(window.OneSignal) { OneSignal.Notifications.create({ content: "Mark your duty for today!", heading: "Duty Reminder (7 PM)", url: window.location.href }); } } }, 60000); },
            notify: () => { if(Notification.permission === "granted") { new Notification("Duty Reminder", { body: "Mark your duty today!", icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", vibrate: [200, 100, 200] }); const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3'); audio.play().catch(e => console.log('Audio play failed:', e)); } },
            setup: () => { Notification.requestPermission().then(p => { if(p === "granted") showToast("Reminder Set (7 PM with sound)"); else showToast("Permission Denied"); }); }
        };

        const reports = {
            gen: () => { if(!isPremium()) { showToast("Premium feature! Subscribe to access reports."); promo.show(); return; } const d1 = new Date(document.getElementById('r-start').value); d1.setHours(0,0,0,0); const d2 = new Date(document.getElementById('r-end').value); d2.setHours(23,59,59,999); if(isNaN(d1)) return showToast("Select Dates"); if(!s.conf.sal) showToast("Warning: Daily Salary is 0 (Check Utility)"); const SAL_PER_DAY = parseFloat(s.conf.sal)||0, FOOD_PER_DAY = parseFloat(s.conf.food)||0, PF_FIXED = parseFloat(s.conf.pf)||0, OT_RATE = parseFloat(s.conf.otr)||0; let dy=0, bs=0, ot=0, fd=0, totOt=0, totAdv=0; for(let k in s.data) { const dt = new Date(k); dt.setHours(12,0,0,0); if(dt >= d1 && dt <= d2) { const v = s.data[k]; const o = parseFloat(v.ot||0); if(v.t==='Half Day') { dy+=0.5; bs += (SAL_PER_DAY / 2); fd += (FOOD_PER_DAY / 2); } else if(['Present','Holiday','Sick'].includes(v.t)) { dy++; bs += SAL_PER_DAY; fd += FOOD_PER_DAY; } ot += (o * OT_RATE); totOt += o; } } for(let k in s.adv) { const a = s.adv[k]; const adt = new Date(a.date); adt.setHours(12,0,0,0); if(adt >= d1 && adt <= d2) totAdv += parseFloat(a.amt); } const pf_deduction = PF_FIXED, net = (bs + ot + fd) - pf_deduction - totAdv; document.getElementById('report-out').innerHTML = `<div style="background:var(--card); padding:20px; border-radius:20px; margin-top:20px; border:1px solid var(--border);"><div style="display:flex; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid var(--border);"><h3>Net Pay</h3><h2 style="color:var(--success);">${s.conf.cur}${Math.max(0, net).toFixed(0)}</h2></div><p style="display:flex; justify-content:space-between;"><span>Duty (${dy}d)</span><b>${s.conf.cur}${bs.toFixed(0)}</b></p><p style="display:flex; justify-content:space-between;"><span>Food</span><b>${s.conf.cur}${fd.toFixed(0)}</b></p><p style="display:flex; justify-content:space-between;"><span>OT (${totOt}h)</span><b>${s.conf.cur}${ot.toFixed(0)}</b></p><p style="display:flex; justify-content:space-between; color:var(--danger);"><span>PF (Fixed)</span><b>-${s.conf.cur}${pf_deduction.toFixed(0)}</b></p><p style="display:flex; justify-content:space-between; color:var(--danger);"><span>Advance</span><b>-${s.conf.cur}${totAdv}</b></p><button class="btn btn-primary" style="margin-top:20px;" onclick="reports.pdf('${d1.toDateString()}','${d2.toDateString()}',${dy},${bs},${ot},${fd},${pf_deduction},${totAdv},${net})">Download PDF</button></div>`; trackUserActivity(s.uid, 'generate_report'); },
            pdf: (d1,d2,dy,bs,ot,fd,pf,adv,net) => { if(!isPremium()) { promo.show(); return; } const { jsPDF } = window.jspdf; const doc = new jsPDF(); if(s.profBase64) try { doc.addImage(s.profBase64, 'JPEG', 15, 15, 25, 25); } catch(e){} doc.setFontSize(22); doc.setTextColor(67, 97, 238); doc.text("Duty Tracker Pro", 105, 20, null, null, "center"); doc.setFontSize(14); doc.setTextColor(0); doc.text("SALARY SLIP", 105, 30, null, null, "center"); doc.setFontSize(10); doc.setTextColor(100); doc.text(`Period: ${d1} to ${d2}`, 105, 36, null, null, "center"); doc.setFontSize(12); doc.setTextColor(0); doc.text(`Name: ${s.profile.name}`, 15, 50); doc.autoTable({ startY: 65, head: [['Description', 'Amount']], body: [ [`Duty Pay (${dy} days)`, `${s.conf.cur} ${Math.round(bs)}`], ['Food Allowance', `${s.conf.cur} ${Math.round(fd)}`], ['Overtime Pay', `${s.conf.cur} ${Math.round(ot)}`], ['PF Deduction', `- ${s.conf.cur} ${Math.round(pf)}`], ['Advance', `- ${s.conf.cur} ${adv}`], [{content:'NET PAYABLE', styles:{fillColor:[67, 97, 238], textColor:255, fontStyle:'bold'}}, `${s.conf.cur} ${Math.round(net)}`] ] }); doc.save(`Salary_${Date.now()}.pdf`); db.ref('stats/pdf_downloads').transaction(current => (current || 0) + 1); trackUserActivity(s.uid, 'download_pdf'); }
        };

        const countries = [{n:"India",c:"+91"},{n:"Afghanistan",c:"+93"},{n:"Albania",c:"+355"},{n:"Algeria",c:"+213"},{n:"Andorra",c:"+376"},{n:"Angola",c:"+244"},{n:"Argentina",c:"+54"},{n:"Armenia",c:"+374"},{n:"Australia",c:"+61"},{n:"Austria",c:"+43"},{n:"Azerbaijan",c:"+994"},{n:"Bahrain",c:"+973"},{n:"Bangladesh",c:"+880"},{n:"Belarus",c:"+375"},{n:"Belgium",c:"+32"},{n:"Belize",c:"+501"},{n:"Benin",c:"+229"},{n:"Bhutan",c:"+975"},{n:"Bolivia",c:"+591"},{n:"Bosnia",c:"+387"},{n:"Botswana",c:"+267"},{n:"Brazil",c:"+55"},{n:"Brunei",c:"+673"},{n:"Bulgaria",c:"+359"},{n:"Cambodia",c:"+855"},{n:"Cameroon",c:"+237"},{n:"Canada",c:"+1"},{n:"Chile",c:"+56"},{n:"China",c:"+86"},{n:"Colombia",c:"+57"},{n:"Comoros",c:"+269"},{n:"Congo",c:"+242"},{n:"Costa Rica",c:"+506"},{n:"Croatia",c:"+385"},{n:"Cuba",c:"+53"},{n:"Cyprus",c:"+357"},{n:"Czech Republic",c:"+420"},{n:"Denmark",c:"+45"},{n:"Djibouti",c:"+253"},{n:"Dominica",c:"+1767"},{n:"Dominican Republic",c:"+1809"},{n:"Ecuador",c:"+593"},{n:"Egypt",c:"+20"},{n:"El Salvador",c:"+503"},{n:"Estonia",c:"+372"},{n:"Ethiopia",c:"+251"},{n:"Fiji",c:"+679"},{n:"Finland",c:"+358"},{n:"France",c:"+33"},{n:"Gabon",c:"+241"},{n:"Gambia",c:"+220"},{n:"Georgia",c:"+995"},{n:"Germany",c:"+49"},{n:"Ghana",c:"+233"},{n:"Greece",c:"+30"},{n:"Grenada",c:"+1473"},{n:"Guatemala",c:"+502"},{n:"Guinea",c:"+224"},{n:"Guyana",c:"+592"},{n:"Haiti",c:"+509"},{n:"Honduras",c:"+504"},{n:"Hong Kong",c:"+852"},{n:"Hungary",c:"+36"},{n:"Iceland",c:"+354"},{n:"Indonesia",c:"+62"},{n:"Iran",c:"+98"},{n:"Iraq",c:"+964"},{n:"Ireland",c:"+353"},{n:"Israel",c:"+972"},{n:"Italy",c:"+39"},{n:"Jamaica",c:"+1876"},{n:"Japan",c:"+81"},{n:"Jordan",c:"+962"},{n:"Kazakhstan",c:"+7"},{n:"Kenya",c:"+254"},{n:"Kiribati",c:"+686"},{n:"Kuwait",c:"+965"},{n:"Kyrgyzstan",c:"+996"},{n:"Laos",c:"+856"},{n:"Latvia",c:"+371"},{n:"Lebanon",c:"+961"},{n:"Lesotho",c:"+266"},{n:"Liberia",c:"+231"},{n:"Libya",c:"+218"},{n:"Liechtenstein",c:"+423"},{n:"Lithuania",c:"+370"},{n:"Luxembourg",c:"+352"},{n:"Macedonia",c:"+389"},{n:"Madagascar",c:"+261"},{n:"Malawi",c:"+265"},{n:"Malaysia",c:"+60"},{n:"Maldives",c:"+960"},{n:"Mali",c:"+223"},{n:"Malta",c:"+356"},{n:"Mauritania",c:"+222"},{n:"Mauritius",c:"+230"},{n:"Mexico",c:"+52"},{n:"Moldova",c:"+373"},{n:"Monaco",c:"+377"},{n:"Mongolia",c:"+976"},{n:"Montenegro",c:"+382"},{n:"Morocco",c:"+212"},{n:"Mozambique",c:"+258"},{n:"Myanmar",c:"+95"},{n:"Namibia",c:"+264"},{n:"Nauru",c:"+674"},{n:"Nepal",c:"+977"},{n:"Netherlands",c:"+31"},{n:"New Zealand",c:"+64"},{n:"Nicaragua",c:"+505"},{n:"Niger",c:"+227"},{n:"Nigeria",c:"+234"},{n:"North Korea",c:"+850"},{n:"Norway",c:"+47"},{n:"Oman",c:"+968"},{n:"Pakistan",c:"+92"},{n:"Palau",c:"+680"},{n:"Panama",c:"+507"},{n:"Papua New Guinea",c:"+675"},{n:"Paraguay",c:"+595"},{n:"Peru",c:"+51"},{n:"Philippines",c:"+63"},{n:"Poland",c:"+48"},{n:"Portugal",c:"+351"},{n:"Qatar",c:"+974"},{n:"Romania",c:"+40"},{n:"Russia",c:"+7"},{n:"Rwanda",c:"+250"},{n:"Samoa",c:"+685"},{n:"San Marino",c:"+378"},{n:"Saudi Arabia",c:"+966"},{n:"Senegal",c:"+221"},{n:"Serbia",c:"+381"},{n:"Seychelles",c:"+248"},{n:"Sierra Leone",c:"+232"},{n:"Singapore",c:"+65"},{n:"Slovakia",c:"+421"},{n:"Slovenia",c:"+386"},{n:"Solomon Islands",c:"+677"},{n:"Somalia",c:"+252"},{n:"South Africa",c:"+27"},{n:"South Korea",c:"+82"},{n:"Spain",c:"+34"},{n:"Sri Lanka",c:"+94"},{n:"Sudan",c:"+249"},{n:"Suriname",c:"+597"},{n:"Sweden",c:"+46"},{n:"Switzerland",c:"+41"},{n:"Syria",c:"+963"},{n:"Taiwan",c:"+886"},{n:"Tajikistan",c:"+992"},{n:"Tanzania",c:"+255"},{n:"Thailand",c:"+66"},{n:"Togo",c:"+228"},{n:"Tonga",c:"+676"},{n:"Trinidad & Tobago",c:"+1868"},{n:"Tunisia",c:"+216"},{n:"Turkey",c:"+90"},{n:"Turkmenistan",c:"+993"},{n:"Tuvalu",c:"+688"},{n:"Uganda",c:"+256"},{n:"Ukraine",c:"+380"},{n:"UAE",c:"+971"},{n:"UK",c:"+44"},{n:"USA",c:"+1"},{n:"Uruguay",c:"+598"},{n:"Uzbekistan",c:"+998"},{n:"Vanuatu",c:"+678"},{n:"Venezuela",c:"+58"},{n:"Vietnam",c:"+84"},{n:"Yemen",c:"+967"},{n:"Zambia",c:"+260"},{n:"Zimbabwe",c:"+263"}];

        function toDataURL(url, callback) { var xhr = new XMLHttpRequest(); xhr.onload = function() { var reader = new FileReader(); reader.onloadend = function() { callback(reader.result); }; reader.readAsDataURL(xhr.response); }; xhr.open('GET', url); xhr.responseType = 'blob'; xhr.send(); }
