        function showToast(msg) { let t=document.getElementById('toast'); t.innerText=msg; t.className='show'; setTimeout(()=>t.className='',3000); }
        function isPremium() { return s.sub > Date.now(); }

        const attendance = {
            checkin: () => { if(!s.uid) return; const now = new Date(); const time = now.toLocaleTimeString(); const checkinData = { time: time, timestamp: now.getTime(), date: now.toISOString().split('T')[0] }; db.ref(`u/${s.uid}/checkin`).set(checkinData); s.checkin = checkinData; document.getElementById('checkin-display').innerText = time; showToast("✅ Checked In at " + time); trackUserActivity(s.uid, 'checkin'); },
            checkout: () => { if(!s.uid) return; const now = new Date(); const time = now.toLocaleTimeString(); const checkoutData = { time: time, timestamp: now.getTime(), date: now.toISOString().split('T')[0] }; db.ref(`u/${s.uid}/checkout`).set(checkoutData); s.checkout = checkoutData; document.getElementById('checkout-display').innerText = time; showToast("✅ Checked Out at " + time); trackUserActivity(s.uid, 'checkout'); }
        };

        function shareToWhatsApp() { if(!isPremium()) { promo.show(); return; } const text = `📊 Duty Tracker Pro Report\nDate: ${new Date().toDateString()}\nStatus: ${s.data[new Date().toISOString().split('T')[0]]?.t || 'Not marked'}\nDownload: https://dutytrackerpro.blogspot.com`; window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); }

        function calculateStreak() { let streak = 0; let currentDate = new Date(); for(let i = 0; i < 365; i++) { const date = new Date(currentDate); date.setDate(currentDate.getDate() - i); const iso = date.toISOString().split('T')[0]; const entry = s.data[iso]; if(entry && (entry.t === 'Present' || entry.t === 'Holiday' || entry.t === 'Sick')) { streak++; } else if(i === 0 && !entry) { streak = 0; break; } else if(i > 0 && (!entry || !['Present','Holiday','Sick'].includes(entry.t))) { break; } } return streak; }
        function updateStreakUI() { const streak = calculateStreak(); if(streak >= 3) { document.getElementById('streak-badge').style.display = 'inline-flex'; document.getElementById('streak-count').innerText = streak; } else { document.getElementById('streak-badge').style.display = 'none'; } }

        const govtHolidays = ["2026-01-26", "2026-08-15", "2026-10-02", "2026-12-25"];
        function isHoliday(date) { return govtHolidays.includes(date); }

        function checkForcedUpdate() { db.ref('config/forcedUpdate').once('value', (snap) => { const updateConfig = snap.val(); if (updateConfig && updateConfig.status === true && s.uid) { appConfig.forcedUpdate = { ...appConfig.forcedUpdate, ...updateConfig }; db.ref(`u/${s.uid}/updateActionTaken`).once('value', (actionSnap) => { const actionTaken = actionSnap.val(); if (!actionTaken || actionTaken === false) { showUpdatePopup(); } }); } }); }
        function showUpdatePopup() { if (s.updateActionTaken) return; const popup = document.getElementById('update-popup'); document.getElementById('update-title').innerText = appConfig.forcedUpdate.title; document.getElementById('update-message').innerText = appConfig.forcedUpdate.message; document.getElementById('update-telegram-btn').onclick = () => { window.open(appConfig.forcedUpdate.telegramLink, '_blank'); if(s.uid) db.ref(`u/${s.uid}/updateActionTaken`).set({ action:'telegram', timestamp:Date.now(), completed:true }); popup.style.display = 'none'; showToast("Thank you!"); }; document.getElementById('update-download-btn').onclick = () => { window.open(appConfig.forcedUpdate.downloadLink, '_blank'); if(s.uid) db.ref(`u/${s.uid}/updateActionTaken`).set({ action:'download', timestamp:Date.now(), completed:true }); popup.style.display = 'none'; showToast("Download started!"); }; document.getElementById('update-later-btn').onclick = () => { popup.style.display = 'none'; if(s.uid) db.ref(`u/${s.uid}/updateActionTaken`).set({ action:'later', timestamp:Date.now(), completed:false }); showToast("You can update later"); }; popup.style.display = 'flex'; }

        function checkPremiumAccess() { const premium = isPremium(); ['advance', 'graph', 'reports', 'settings'].forEach(sec => { const restriction = document.getElementById(`premium-restriction-${sec}`); const content = document.getElementById(`${sec}-premium-content`); if(restriction && content) { if(!premium) { content.style.display = 'none'; restriction.style.display = 'block'; } else { content.style.display = 'block'; restriction.style.display = 'none'; } } }); }

        function loadAppConfig() {
            db.ref('config/maintenance').on('value', (snap) => { appConfig.maintenance = snap.val() || false; updateMaintenanceUI(); });
            db.ref('config/maintenanceMessage').on('value', (snap) => { appConfig.maintenanceMessage = snap.val() || "We're currently performing scheduled maintenance..."; document.getElementById('maintenance-message').innerText = appConfig.maintenanceMessage; });
            db.ref('config/maintenanceTime').on('value', (snap) => { appConfig.maintenanceTime = snap.val() || "Approximately 30 minutes"; document.getElementById('maintenance-time').innerText = appConfig.maintenanceTime; });
            db.ref('config/forcedUpdate').on('value', (snap) => { const updateConfig = snap.val(); if(updateConfig) appConfig.forcedUpdate = { ...appConfig.forcedUpdate, ...updateConfig }; if(s.uid) checkForcedUpdate(); });
            db.ref('config/reward').on('value', (snap) => { appConfig.reward = { ...appConfig.reward, ...(snap.val() || {}) }; document.getElementById('reward-title').innerText = appConfig.reward.title; document.getElementById('reward-message').innerText = appConfig.reward.message; });
        }

        function updateMaintenanceUI() { if(appConfig.maintenance) { document.getElementById('maintenance-mode').style.display = 'flex'; document.getElementById('main-app').style.display = 'none'; document.getElementById('auth-screen').style.display = 'none'; document.getElementById('splash').style.display = 'none'; } else { document.getElementById('maintenance-mode').style.display = 'none'; } }

