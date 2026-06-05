        function loadBinanceRequests() {
            if(!s.uid) return;
            db.ref(`binance_payments/${s.uid}`).on('value', (snap) => {
                const requests = snap.val() || {};
                s.binanceRequests = requests;
                renderPaymentRequests();
                for(let key in requests) {
                    if(requests[key].status === 'approved' && !requests[key].activated) {
                        binance.checkAndActivate(key, requests[key]);
                    }
                }
            });
        }

        function renderPaymentRequests() {
            const container = document.getElementById('payment-requests-list');
            if(!container) return;
            const requests = s.binanceRequests;
            const arr = [];
            for(let k in requests) { arr.push({...requests[k], key: k}); }
            arr.reverse();
            if(arr.length === 0) { container.innerHTML = '<div style="text-align:center; color:var(--text-sub); margin-top:50px;">No payment requests found.</div>'; return; }
            container.innerHTML = arr.map(req => `
                <div class="payment-request-item" style="background:var(--input); padding:15px; border-radius:10px; margin-bottom:10px; border-left:4px solid ${req.status === 'pending' ? '#ffc107' : '#28a745'};">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                        <div>
                            <div style="font-weight:bold;">${req.plan === 'monthly' ? 'Monthly' : (req.plan === '6months' ? '6 Months' : 'Yearly')}</div>
                            <div style="font-size:12px;">Amount: ₹${req.amount} ($${(req.amount/85).toFixed(2)} USDT)</div>
                            <div style="font-size:10px; color:var(--text-sub);">TXID: ${req.txid.substring(0,20)}...</div>
                            <div style="font-size:10px;">Date: ${new Date(req.createdAt).toLocaleString()}</div>
                        </div>
                        <div>
                            <span style="display:inline-block; padding:4px 12px; border-radius:20px; font-size:11px; background:${req.status === 'pending' ? '#ffc107' : '#28a745'}; color:${req.status === 'pending' ? 'black' : 'white'}">
                                ${req.status === 'pending' ? '⏳ Pending' : '✅ Approved'}
                            </span>
                            ${req.screenshot ? `<div><a href="${req.screenshot}" target="_blank" style="color:var(--primary); font-size:11px;">View Screenshot</a></div>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function listenForInAppNotifications() {
            if(!s.uid) return;
            if(s.notifListener) { db.ref(`inapp_notifications/${s.uid}`).off('child_added', s.notifListener); }
            s.notifListener = (snap) => {
                const notif = snap.val();
                if(notif && notif.title) {
                    showInAppNotification(notif);
                    setTimeout(() => { db.ref(`inapp_notifications/${s.uid}/${snap.key}`).remove().catch(e=>console.log); }, 5000);
                }
            };
            db.ref(`inapp_notifications/${s.uid}`).on('child_added', s.notifListener);
        }

        function showInAppNotification(notif) {
            let container = document.getElementById('inapp-notification-container');
            if(!container) {
                container = document.createElement('div');
                container.id = 'inapp-notification-container';
                container.style.cssText = 'position:fixed; top:70px; left:10px; right:10px; z-index:10001; display:flex; flex-direction:column; gap:10px; pointer-events:none;';
                document.body.appendChild(container);
            }
            const notifCard = document.createElement('div');
            notifCard.className = 'inapp-notif-card';
            notifCard.style.cssText = 'background:var(--card); border-left:4px solid var(--primary); border-radius:12px; padding:15px; box-shadow:0 4px 15px rgba(0,0,0,0.3); animation:slideIn 0.3s ease; pointer-events:auto;';
            let imageHtml = '';
            if(notif.image && notif.image.trim() !== '') { imageHtml = `<img src="${notif.image}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; margin-right:12px;" onerror="this.style.display='none'">`; }
            let urlHtml = '';
            if(notif.url && notif.url.trim() !== '') { urlHtml = `<a href="${notif.url}" target="_blank" style="display:inline-block; margin-top:8px; font-size:12px; color:var(--primary); text-decoration:none;"><i class="fas fa-external-link-alt"></i> View Details</a>`; }
            notifCard.innerHTML = `<div style="display:flex; align-items:flex-start; gap:12px;">${imageHtml ? `<div style="flex-shrink:0;">${imageHtml}</div>` : `<div style="flex-shrink:0;"><i class="fas fa-bell" style="font-size:24px; color:var(--primary);"></i></div>`}<div style="flex:1;"><div style="font-weight:700; font-size:14px; margin-bottom:4px;">${escapeHtml(notif.title)}</div><div style="font-size:12px; color:var(--text-sub); line-height:1.4;">${escapeHtml(notif.message)}</div>${urlHtml}</div><button class="close-btn" onclick="this.closest('.inapp-notif-card').remove()" style="background:none; border:none; color:var(--text-sub); cursor:pointer; font-size:14px;"><i class="fas fa-times"></i></button></div>`;
            container.appendChild(notifCard);
            setTimeout(() => { if(notifCard && notifCard.parentElement) notifCard.remove(); }, 8000);
            try { const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3'); audio.volume = 0.2; audio.play().catch(e => console.log); } catch(e) {}
        }

        function escapeHtml(str) { if(!str) return ''; return str.replace(/[&<>]/g, function(m) { if(m === '&') return '&amp;'; if(m === '<') return '&lt;'; if(m === '>') return '&gt;'; return m; }); }

        let appConfig = {
            maintenance: false,
            maintenanceMessage: "We're currently performing scheduled maintenance...",
            maintenanceTime: "Approximately 30 minutes",
            forcedUpdate: { status: false, title: "Update Available!", message: "A new version is available.", telegramLink: "https://telegram.me/DutyTrackerProapp", downloadLink: "https://dutytracker-admin.vercel.app/" },
            reward: { status: true, title: "Unlock 7 Days Free Premium!", message: "Join BOTH our official channels to activate your reward.", reward_days: 7, telegram_link: "https://telegram.me/DutyTrackerProapp", whatsapp_link: "https://whatsapp.com/channel/0029Vb6SlL01dAw9flibc12I" }
        };

