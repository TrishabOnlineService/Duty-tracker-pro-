        const security = {
            showAutoLockPicker: () => {
                const options = [1, 2, 5, 10, 15, 30];
                const current = parseInt(localStorage.getItem('auto_lock_minutes') || '5');
                const list = options.map(m => `<button class="btn btn-sec" style="margin-bottom:8px;" onclick="security.setAutoLock(${m})">${m === current ? '✅ ' : ''}${m} minute${m > 1 ? 's' : ''}</button>`).join('');
                document.getElementById('c-title').innerText = 'Auto Lock Timer';
                document.getElementById('c-desc').innerHTML = `<div style="display:flex; flex-direction:column; gap:4px; margin-top:10px;">${list}</div>`;
                document.getElementById('c-yes-btn').style.display = 'none';
                document.getElementById('confirm-modal').style.display = 'flex';
            },

            setAutoLock: (minutes) => {
                localStorage.setItem('auto_lock_minutes', minutes.toString());
                AUTO_LOCK_MS = minutes * 60 * 1000;
                security.updateAutoLockUI();
                document.getElementById('confirm-modal').style.display = 'none';
                document.getElementById('c-yes-btn').style.display = '';
                showToast(`Auto lock set to ${minutes} minute${minutes > 1 ? 's' : ''}`);
            },

            updateAutoLockUI: () => {
                const el = document.getElementById('auto-lock-status');
                if (!el) return;
                const m = parseInt(localStorage.getItem('auto_lock_minutes') || '5');
                el.innerText = `${m} minute${m > 1 ? 's' : ''}`;
            }
        };

        // ====================================================
        // ===== AUTO LOCK (inactive — configurable) =====
        // ====================================================
        let autoLockTimer = null;
        let AUTO_LOCK_MS = (parseInt(localStorage.getItem('auto_lock_minutes') || '5')) * 60 * 1000;

        function resetAutoLock() {
            clearTimeout(autoLockTimer);
            autoLockTimer = setTimeout(() => {
                if (s.uid && pinVerified) {
                    pinVerified = false;
                    pin.init('verify');
                    showToast('App locked due to inactivity');
                }
            }, AUTO_LOCK_MS);
        }

        ['touchstart', 'click', 'keydown', 'scroll'].forEach(evt => {
            document.addEventListener(evt, resetAutoLock, { passive: true });
        });

        // ====================================================
        // ===== WRONG PIN PROTECTION (3 attempts = 30s block) =====
        // ====================================================
        let pinAttempts = 0;
        let pinBlocked = false;
        let pinBlockTimer = null;

        function checkPinBlock() {
            const blocked = localStorage.getItem('pin_blocked_until');
            if (blocked && Date.now() < parseInt(blocked)) {
                pinBlocked = true;
                const remaining = Math.ceil((parseInt(blocked) - Date.now()) / 1000);
                showPinBlockMessage(remaining);
                return true;
            }
            pinBlocked = false;
            return false;
        }

        function showPinBlockMessage(seconds) {
            const errEl = document.getElementById('pin-error');
            if (!errEl) return;
            errEl.style.display = 'block';
            errEl.innerText = `Too many attempts. Wait ${seconds}s`;
            if (seconds > 0) {
                setTimeout(() => showPinBlockMessage(seconds - 1), 1000);
            } else {
                pinBlocked = false;
                errEl.style.display = 'none';
                pinAttempts = 0;
            }
        }

        // ====================================================
        // ===== CALENDAR SWIPE (Touch Gesture) =====
        // ====================================================
        let calTouchStartX = 0;
        let calTouchStartY = 0;
        let calSwiping = false;

        const calGrid = document.getElementById('calendar-grid');
        if (calGrid) {
            calGrid.addEventListener('touchstart', (e) => {
                calTouchStartX = e.touches[0].clientX;
                calTouchStartY = e.touches[0].clientY;
                calSwiping = true;
            }, { passive: true });

            calGrid.addEventListener('touchmove', (e) => {
                if (!calSwiping) return;
                const dx = e.touches[0].clientX - calTouchStartX;
                const dy = e.touches[0].clientY - calTouchStartY;
                // Only horizontal swipes (not vertical scroll)
                if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
                    e.preventDefault();
                }
            }, { passive: false });

            calGrid.addEventListener('touchend', (e) => {
                if (!calSwiping) return;
                const dx = e.changedTouches[0].clientX - calTouchStartX;
                const dy = e.changedTouches[0].clientY - calTouchStartY;
                calSwiping = false;

                // Horizontal swipe only
                if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
                    if (dx < 0) {
                        // Swipe left = next month
                        calGrid.classList.remove('slide-left', 'slide-right');
                        void calGrid.offsetWidth;
                        calGrid.classList.add('slide-left');
                        cal.move(1);
                    } else {
                        // Swipe right = prev month
                        calGrid.classList.remove('slide-left', 'slide-right');
                        void calGrid.offsetWidth;
                        calGrid.classList.add('slide-right');
                        cal.move(-1);
                    }
                    setTimeout(() => calGrid.classList.remove('slide-left', 'slide-right'), 400);
                }
            }, { passive: true });
        }

        // ====================================================
        // ===== ANDROID BACK BUTTON ENHANCED =====
        // ====================================================
