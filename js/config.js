        // ============================================
        // COMPLETE SCRIPT (BIOMETRIC REMOVED, PIN ONLY)
        // ============================================
        const firebaseConfig = { 
            apiKey: "AIzaSyDxqq2PBqrtkTsygyMcIDOvZyx2_-x4QRk", 
            authDomain: "duty-tracker-pro.firebaseapp.com", 
            databaseURL: "https://duty-tracker-pro-default-rtdb.firebaseio.com", 
            projectId: "duty-tracker-pro", 
            storageBucket: "duty-tracker-pro.firebasestorage.app", 
            messagingSenderId: "716525293622", 
            appId: "1:716525293622:web:880f39084c86180fbb0897" 
        };
        
        firebase.initializeApp(firebaseConfig);
        const db = firebase.database();
        const RZP_KEY = "rzp_live_Rz7kQ4RAloCWGp";
        const IMG_API_KEY = "c762b5315ee9263c36ed04156b0ff758"; 
        const ONESIGNAL_APP_ID = "757c2d8a-b121-4498-bc66-5d71d68a9009";
        
        // PayPal Subscription Links
        const PAYPAL_MONTHLY_URL = "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-88K63194J33940531NHJKNBY";
        const PAYPAL_YEARLY_URL = "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-8DG31605KT644052BNHJKOTQ";
        
        // Binance Wallet
        const BINANCE_WALLET = "TQdxG63t1CdgHF9EoA1PzXtvrNm8qrsobt";
        const BINANCE_UID = "801379521";
        
        let s = { 
            uid: null, 
            data: {}, 
            adv: {}, 
            sub: 0, 
            conf: {cur:'₹', sal:0, otr:0, food:0, pf:0, target: 0}, 
            profile: {name:'', img:'', email:''}, 
            profBase64: null, 
            refCode: '', 
            history: {},
            checkin: null,
            checkout: null,
            reward: {
                telegram_joined: 0,
                whatsapp_joined: 0,
                reward_claimed: 0,
                reward_expiry_date: null
            },
            pin: '',
            updateActionTaken: false,
            binanceRequests: {},
            selectedPlan: 'monthly'
        };
        
        let curDate = new Date();
        let selDate = null;
        let selType = null;
        let chartInstance = null;
        let deferredPrompt;
        
        let pinCurrent = '';
        let pinMode = 'verify';
        let pinCallback = null;
        let pinVerified = false;
        
        // Payment System State
        let currentPaymentSystem = 'custom'; // 'custom' or 'googleplay'
        
