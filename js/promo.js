        const promo = {
            show: () => {
                document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
                document.getElementById('att-modal').style.display = 'none';
                document.getElementById('main-app').style.display = 'none';
                document.getElementById('promo-screen').style.display = 'flex';
                
                document.getElementById('payment-gateways').style.display = 'none';
                document.getElementById('activate-premium-btn').style.display = 'flex';
                
                document.querySelectorAll('.plan-card').forEach(card => card.classList.remove('selected'));
                document.querySelector('.plan-card[data-plan="monthly"]').classList.add('selected');
                s.selectedPlan = 'monthly';
                
                const vid = document.getElementById('promo-vid');
                if(vid) {
                    vid.currentTime = 0;
                    vid.muted = false;
                    vid.volume = 1.0;
                    vid.play().catch(e => console.log('Video play failed:', e));
                    document.getElementById('video-play-btn').style.display = 'none';
                    document.getElementById('video-pause-btn').style.display = 'flex';
                    document.getElementById('video-volume-btn').innerHTML = '<i class="fas fa-volume-up"></i>';
                }
                history.pushState({page:'promo'}, null, '');
            },
            playVideo: () => {
                const vid = document.getElementById('promo-vid');
                if(vid) {
                    vid.play();
                    document.getElementById('video-play-btn').style.display = 'none';
                    document.getElementById('video-pause-btn').style.display = 'flex';
                }
            },
            pauseVideo: () => {
                const vid = document.getElementById('promo-vid');
                if(vid) {
                    vid.pause();
                    document.getElementById('video-play-btn').style.display = 'flex';
                    document.getElementById('video-pause-btn').style.display = 'none';
                }
            },
            toggleMute: () => {
                const vid = document.getElementById('promo-vid');
                if(vid) {
                    vid.muted = !vid.muted;
                    document.getElementById('video-volume-btn').innerHTML = vid.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
                }
            },
            selectPlan: (planElement) => {
                document.querySelectorAll('.plan-card').forEach(card => card.classList.remove('selected'));
                planElement.classList.add('selected');
                s.selectedPlan = planElement.getAttribute('data-plan');
                document.getElementById('payment-gateways').style.display = 'none';
                document.getElementById('activate-premium-btn').style.display = 'flex';
            },
            showPaymentGateways: () => {
                const plan = s.selectedPlan;
                const inrAmount = priceConfig.razorpay[plan === '6months' ? 'sixmonths' : plan];
                const paypalAmount = plan === 'yearly' ? priceConfig.paypal.yearly : (plan === 'monthly' ? priceConfig.paypal.monthly : null);
                
                document.getElementById('razor-amount').innerText = inrAmount;
                document.getElementById('paypal-amount').innerText = paypalAmount !== null ? paypalAmount : 'N/A';
                document.getElementById('binance-amount').innerText = inrAmount;
                
                const razorBtn = document.getElementById('razorpay-btn');
                const paypalBtn = document.getElementById('paypal-btn');
                const binanceBtn = document.getElementById('binance-btn');
                const googleplayBtn = document.getElementById('googleplay-btn');
                
                razorBtn.onclick = () => {
                    if(plan === '6months') pay.razorpay('6months');
                    else pay.razorpay(plan);
                };
                paypalBtn.onclick = () => {
                    if(plan === '6months') {
                        showToast("PayPal only supports Monthly and Yearly plans");
                        return;
                    }
                    pay.paypal(plan);
                };
                binanceBtn.onclick = () => {
                    binance.showModal();
                };
                googleplayBtn.onclick = () => {
                    paymentSystem.googlePlayPurchase(plan);
                };
                
                document.getElementById('activate-premium-btn').style.display = 'none';
                document.getElementById('payment-gateways').style.display = 'block';
            },
            stop: () => {
                const vid = document.getElementById('promo-vid');
                document.getElementById('promo-screen').style.display = 'none';
                if(vid) {
                    vid.pause();
                    vid.currentTime = 0;
                    vid.muted = true;
                }
            },
            close: () => {
                promo.stop();
                document.getElementById('main-app').style.display = 'flex';
                if(s.pin && !pinVerified) pin.init('verify');
                if(window.history.length > 1) window.history.back();
                else ui.closeAll();
            }
        };
        
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('.plan-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    e.stopPropagation();
                    promo.selectPlan(card);
                });
            });
            
            // PIN button handlers
            document.querySelectorAll('.pin-btn[data-num]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const num = btn.getAttribute('data-num');
                    pin.add(num);
                });
            });
        });

