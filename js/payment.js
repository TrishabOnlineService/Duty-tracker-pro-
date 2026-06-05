        const paymentSystem = {
            switchTo: (system) => {
                currentPaymentSystem = system;
                document.querySelectorAll('#payment-switch button').forEach(btn => btn.classList.remove('active'));
                if(system === 'custom') {
                    document.querySelector('#payment-switch button:first-child').classList.add('active');
                    document.getElementById('razorpay-btn').style.display = 'flex';
                    document.getElementById('paypal-btn').style.display = 'flex';
                    document.getElementById('binance-btn').style.display = 'flex';
                    document.getElementById('googleplay-btn').style.display = 'none';
                } else {
                    document.querySelector('#payment-switch button:last-child').classList.add('active');
                    document.getElementById('razorpay-btn').style.display = 'none';
                    document.getElementById('paypal-btn').style.display = 'none';
                    document.getElementById('binance-btn').style.display = 'none';
                    document.getElementById('googleplay-btn').style.display = 'flex';
                }
            },
            googlePlayPurchase: (plan) => {
                showToast("Google Play Billing integration ready. Connect your Google Play Console account.");
                console.log("Google Play Purchase:", plan);
            }
        };

        // Price Config
        let priceConfig = {
            razorpay: { monthly: 5, sixmonths: 20, yearly: 50 },
            paypal: { monthly: 1, yearly: 5 }
        };

        function loadPriceConfig() {
            db.ref('config/prices').on('value', (snap) => {
                const prices = snap.val();
                if(prices) {
                    if(prices.razorpay_monthly) priceConfig.razorpay.monthly = prices.razorpay_monthly;
                    if(prices.razorpay_6months) priceConfig.razorpay.sixmonths = prices.razorpay_6months;
                    if(prices.razorpay_yearly) priceConfig.razorpay.yearly = prices.razorpay_yearly;
                    if(prices.paypal_monthly) priceConfig.paypal.monthly = prices.paypal_monthly;
                    if(prices.paypal_yearly) priceConfig.paypal.yearly = prices.paypal_yearly;
                }
                updatePlansUI();
            });
        }

        function updatePlansUI() {
            const monthlyCard = document.querySelector('.plan-card[data-plan="monthly"]');
            const sixCard = document.querySelector('.plan-card[data-plan="6months"]');
            const yearlyCard = document.querySelector('.plan-card[data-plan="yearly"]');
            
            if(monthlyCard) {
                monthlyCard.querySelector('.plan-price').innerHTML = `₹${priceConfig.razorpay.monthly} <small>/month</small>`;
                monthlyCard.setAttribute('data-inr', priceConfig.razorpay.monthly);
                monthlyCard.setAttribute('data-usd', (priceConfig.razorpay.monthly / 85).toFixed(2));
            }
            if(sixCard) {
                sixCard.querySelector('.plan-price').innerHTML = `₹${priceConfig.razorpay.sixmonths} <small>/6mo</small>`;
                sixCard.setAttribute('data-inr', priceConfig.razorpay.sixmonths);
                sixCard.setAttribute('data-usd', (priceConfig.razorpay.sixmonths / 85).toFixed(2));
            }
            if(yearlyCard) {
                yearlyCard.querySelector('.plan-price').innerHTML = `₹${priceConfig.razorpay.yearly} <small>/year</small>`;
                yearlyCard.setAttribute('data-inr', priceConfig.razorpay.yearly);
                yearlyCard.setAttribute('data-usd', (priceConfig.razorpay.yearly / 85).toFixed(2));
            }
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text);
            showToast("Copied to clipboard!");
        }

        function checkPayPalReturn() {
            const urlParams = new URLSearchParams(window.location.search);
            const success = urlParams.get('success');
            const subscriptionId = urlParams.get('subscription_id');
            const plan = localStorage.getItem('pending_paypal_plan');
            
            if(success === 'true' && subscriptionId && plan && s.uid) {
                const days = plan === 'monthly' ? 30 : 365;
                const newExpiry = Date.now() + (days * 86400000);
                db.ref(`u/${s.uid}/subExp`).set(newExpiry);
                db.ref(`u/${s.uid}/paypal_subscriptions`).push({ subscriptionId: subscriptionId, plan: plan, date: Date.now(), status: 'active' });
                db.ref(`u/${s.uid}/history`).push({ amount: plan === 'monthly' ? priceConfig.paypal.monthly : priceConfig.paypal.yearly, currency: 'USD', date: Date.now(), method: 'PayPal', subscriptionId: subscriptionId });
                showToast("✅ PayPal Subscription Activated!");
                localStorage.removeItem('pending_paypal_plan');
                setTimeout(() => { window.location.href = window.location.origin + window.location.pathname; }, 1500);
            }
        }

        // Admin Analytics
