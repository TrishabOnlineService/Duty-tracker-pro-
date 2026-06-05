        const binance = {
            showModal: () => {
                document.getElementById('binance-modal').style.display = 'flex';
                document.getElementById('binance-txid').value = '';
                document.getElementById('binance-screenshot').value = '';
                document.getElementById('screenshot-preview').innerHTML = '';
                const planSelect = document.getElementById('binance-plan-select');
                if(s.selectedPlan === 'monthly') planSelect.value = 'monthly';
                else if(s.selectedPlan === '6months') planSelect.value = '6months';
                else planSelect.value = 'yearly';
            },
            submitPayment: async () => {
                if(!s.uid) return;
                const plan = document.getElementById('binance-plan-select').value;
                const txid = document.getElementById('binance-txid').value.trim();
                const screenshotFile = document.getElementById('binance-screenshot').files[0];
                if(!txid) { showToast("Please enter Transaction ID"); return; }
                if(!screenshotFile) { showToast("Please upload screenshot"); return; }
                showToast("Uploading screenshot...");
                const formData = new FormData();
                formData.append('key', IMG_API_KEY);
                formData.append('image', screenshotFile);
                try {
                    const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
                    const json = await res.json();
                    if(json.success) {
                        const imageUrl = json.data.url;
                        const planAmount = plan === 'monthly' ? priceConfig.razorpay.monthly : (plan === '6months' ? priceConfig.razorpay.sixmonths : priceConfig.razorpay.yearly);
                        const planDays = plan === 'monthly' ? 30 : (plan === '6months' ? 180 : 365);
                        const paymentRequest = { uid: s.uid, plan: plan, amount: planAmount, currency: 'INR', txid: txid, screenshot: imageUrl, status: 'pending', createdAt: Date.now(), planDays: planDays };
                        const newRef = db.ref(`binance_payments/${s.uid}`).push();
                        await newRef.set(paymentRequest);
                        db.ref(`adminNotifications/all`).push({ title: "New Binance Payment Request", body: `${s.profile.name} (${s.uid}) sent ${planAmount} INR for ${plan}`, userId: s.uid, timestamp: Date.now(), type: 'binance_payment' });
                        showToast("Payment request submitted! Admin will verify within 24-48 hours.");
                        document.getElementById('binance-modal').style.display = 'none';
                        loadBinanceRequests();
                    } else { showToast("Failed to upload screenshot"); }
                } catch(e) { showToast("Upload failed: " + e.message); }
            },
            checkAndActivate: (paymentId, paymentData) => {
                if(paymentData.status === 'approved' && paymentData.activated !== true) {
                    const newExpiry = Date.now() + (paymentData.planDays * 86400000);
                    db.ref(`u/${paymentData.uid}/subExp`).set(newExpiry);
                    db.ref(`binance_payments/${paymentData.uid}/${paymentId}/activated`).set(true);
                    db.ref(`binance_payments/${paymentData.uid}/${paymentId}/activatedAt`).set(Date.now());
                    db.ref(`u/${paymentData.uid}/history`).push({ amount: paymentData.amount, currency: 'INR', date: Date.now(), method: 'Binance USDT', txid: paymentData.txid });
                    if(paymentData.uid === s.uid) { showToast("🎉 Premium Activated! Thank you."); setTimeout(() => location.reload(), 2000); }
                }
            }
        };

