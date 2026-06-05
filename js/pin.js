        const pin = {
            init: (mode, callback) => { 
                pinMode = mode; 
                pinCallback = callback; 
                pinCurrent = ''; 
                document.getElementById('pin-screen').style.display = 'flex'; 
                pin.updateDots();
                document.getElementById('pin-error').style.display = 'none'; 
                if(mode === 'set') { 
                    document.getElementById('pin-title').innerHTML = 'Set New PIN'; 
                    document.getElementById('pin-subtitle').innerHTML = 'Enter a 4-digit PIN'; 
                } else if(mode === 'change') { 
                    document.getElementById('pin-title').innerHTML = 'Change PIN'; 
                    document.getElementById('pin-subtitle').innerHTML = 'Enter current PIN'; 
                } else { 
                    document.getElementById('pin-title').innerHTML = 'Enter PIN'; 
                    document.getElementById('pin-subtitle').innerHTML = 'Please enter your 4-digit PIN'; 
                } 
            },
            add: (d) => { 
                if(pinCurrent.length < 4) { 
                    pinCurrent += d; 
                    pin.updateDots();
                    if(pinCurrent.length === 4) setTimeout(() => pin.submit(), 200); 
                } 
            },
            delete: () => { 
                pinCurrent = pinCurrent.slice(0, -1); 
                pin.updateDots();
            },
            clear: () => { 
                pinCurrent = ''; 
                pin.updateDots();
            },
            updateDots: () => {
                const dots = document.querySelectorAll('.pin-dot');
                for(let i = 0; i < dots.length; i++) {
                    if(i < pinCurrent.length) dots[i].classList.add('filled');
                    else dots[i].classList.remove('filled');
                }
            },
            submit: () => { 
                if(pinCurrent.length !== 4) { 
                    document.getElementById('pin-error').innerText = 'Please enter 4 digits'; 
                    document.getElementById('pin-error').style.display = 'block'; 
                    return; 
                } 
                if(pinMode === 'set') { 
                    if(pinCallback) pinCallback(pinCurrent); 
                    pin.close(); 
                } else if(pinMode === 'change') { 
                    if(pinCurrent === s.pin) { 
                        pin.init('set', (newPin) => { 
                            db.ref(`u/${s.uid}/pin`).set(newPin); 
                            s.pin = newPin; 
                            showToast('✅ PIN changed successfully'); 
                        }); 
                    } else { 
                        document.getElementById('pin-error').innerText = 'Invalid current PIN'; 
                        document.getElementById('pin-error').style.display = 'block'; 
                        pinCurrent = ''; 
                        pin.updateDots();
                    } 
                } else { 
                    if(pinCurrent === s.pin) { 
                        pin.close(); 
                        pinVerified = true; 
                        if(pinCallback) pinCallback(true); 
                        document.getElementById('main-app').style.display = 'flex'; 
                    } else { 
                        document.getElementById('pin-error').innerText = 'Invalid PIN. Please try again.'; 
                        document.getElementById('pin-error').style.display = 'block'; 
                        pinCurrent = ''; 
                        pin.updateDots();
                    } 
                } 
            },
            close: () => { 
                document.getElementById('pin-screen').style.display = 'none'; 
                pinCurrent = ''; 
            },
            cancel: () => { 
                pin.close(); 
                if(pinMode === 'verify') { 
                    document.getElementById('main-app').style.display = 'none'; 
                    document.getElementById('auth-screen').style.display = 'flex'; 
                } 
            },
            showChangePin: () => { if(s.uid) pin.init('change'); }
        };

