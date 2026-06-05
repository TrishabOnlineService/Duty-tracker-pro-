# Duty Tracker Pro — File Structure

## 📁 Project Layout

```
dutytracker/
├── index.html              ← Main HTML (body only, clean)
├── style.css               ← All styles + new feature CSS
├── service-worker.js       ← PWA offline caching
├── manifest.json           ← (your existing file, keep as-is)
│
└── js/
    ├── config.js           ← Firebase config, global state (s), constants
    ├── analytics.js        ← trackUserActivity, analytics helpers
    ├── payment.js          ← paymentSystem, priceConfig, loadPriceConfig
    ├── promo.js            ← Promo screen, video, countdown
    ├── binance.js          ← Binance USDT payment modal
    ├── notifications.js    ← In-app notifications, binance requests
    ├── core.js             ← showToast, isPremium, attendance helpers
    ├── pay.js              ← pay.razorpay, pay.paypal, pay.show
    ├── auth.js             ← auth.login, auth.signup, auth.switchTab
    ├── pin.js              ← PIN lock screen logic
    ├── reward.js           ← Reward popup (Telegram/WhatsApp join)
    ├── countries.js        ← Country list for phone country code
    ├── app-init.js         ← DOMContentLoaded, app, cal, data, advance,
    │                          graph, ref, ui, profile, settings, reports
    ├── i18n.js             ← 30+ language translations
    ├── security.js         ← Security settings, auto-lock
    ├── navigation.js       ← Back button, popstate, ripple, offline detect
    │
    └── features.js         ← ✨ NEW FEATURES:
                               - biometric (Fingerprint/Face ID)
                               - overtime (calculator)
                               - salarySlip (PDF generator)
                               - offlineSync (IndexedDB + Firebase sync)
                               - holidayCalendar (India 2026 holidays)
                               - shareToWhatsAppEnhanced (rich report)
```

## ✨ New Features Added

### 1. 🔐 Biometric Login
- Fingerprint / Face ID via WebAuthn API
- Falls back to PIN if not supported
- Toggle in Settings → Security

### 2. ⏰ Overtime Calculator
- Auto calculates from check-in/check-out times
- Based on salary config (8hr regular, 1.5x OT rate)
- Found in Reports page

### 3. 📄 Salary Slip Generator
- Professional PDF with earnings table
- Includes basic + food + overtime - PF
- Premium only

### 4. 📴 Offline Sync
- Works without internet using IndexedDB
- Auto-syncs to Firebase when online
- Manual sync button in Reports page

### 5. 📅 Holiday Calendar
- India 2026 national holidays pre-loaded
- Shows upcoming holidays list
- Found in Reports page

### 6. 📤 Enhanced WhatsApp Share
- Rich report with present/absent/OT/salary
- One tap sharing

## 🚀 How to Deploy (GitHub Pages)

1. Upload all files maintaining the folder structure
2. Your existing `manifest.json` stays as-is
3. Make sure `service-worker.js` is in root (same as `index.html`)
4. That's it — GitHub Pages serves HTTPS automatically ✅
