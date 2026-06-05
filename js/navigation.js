        window.addEventListener('popstate', (e) => {
            const state = e.state;
            // Close any open modal first
            const openModals = ['att-modal', 'binance-modal', 'confirm-modal', 'reward-popup', 'update-popup'];
            for (let modalId of openModals) {
                const modal = document.getElementById(modalId);
                if (modal && (modal.style.display === 'flex' || modal.style.display === 'block')) {
                    modal.style.display = 'none';
                    history.pushState({}, null, '');
                    return;
                }
            }
            // Close open pages
            const pages = document.querySelectorAll('.page');
            for (let page of pages) {
                if (page.style.display === 'flex' || page.style.display === 'block') {
                    page.style.animation = 'flutterPageBack 0.3s cubic-bezier(0.25,0.46,0.45,0.94) both';
                    setTimeout(() => {
                        page.style.display = 'none';
                        page.style.animation = '';
                    }, 280);
                    document.getElementById('main-app').style.display = 'flex';
                    return;
                }
            }
            // Close promo
            const promo_screen = document.getElementById('promo-screen');
            if (promo_screen && promo_screen.style.display === 'flex') {
                promo.close();
                return;
            }
            // Close legal modal
            const legal_modal = document.getElementById('legal-modal');
            if (legal_modal && legal_modal.style.display === 'flex') {
                legal_modal.style.display = 'none';
                return;
            }
            // If on main app, push state to prevent exit
            if (document.getElementById('main-app')?.style.display === 'flex') {
                history.pushState({}, null, '');
            }
        });

        // Push initial state
        window.addEventListener('load', () => {
            history.pushState({}, null, '');
        });

        // ====================================================
        // ===== MATERIAL RIPPLE ON ALL TAPPABLE ELEMENTS =====
        // ====================================================
        document.addEventListener('click', (e) => {
            const tappable = e.target.closest('.btn, .pin-btn, .action-item, .plan-card, .nav-btn');
            if (!tappable) return;
            const ripple = document.createElement('span');
            const rect = tappable.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 2;
            ripple.style.cssText = `
                position:absolute; border-radius:50%;
                background:rgba(255,255,255,0.18);
                width:${size}px; height:${size}px;
                left:${e.clientX - rect.left - size/2}px;
                top:${e.clientY - rect.top - size/2}px;
                transform:scale(0); animation:flutterInkSpread 0.5s ease-out forwards;
                pointer-events:none; z-index:9999;
            `;
            tappable.style.overflow = 'hidden';
            tappable.style.position = 'relative';
            tappable.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });

        // ====================================================
        // ===== ANIMATED COUNTER FOR STATS =====
        // ====================================================
        function animateCounter(el, target, duration = 1000) {
            if (!el) return;
            const start = 0;
            const step = (timestamp) => {
                const progress = Math.min((timestamp - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.innerText = Math.floor(eased * target);
                if (progress < 1) requestAnimationFrame(step);
                else el.innerText = target;
            };
            let startTime;
            requestAnimationFrame((ts) => { startTime = ts; step(ts); });
        }

        // ====================================================
        // ===== STAGGER ANIMATION FOR LISTS =====
        // ====================================================
        function addStaggerToList(containerSelector) {
            const container = document.querySelector(containerSelector);
            if (!container) return;
            const items = container.children;
            Array.from(items).forEach((item, i) => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    item.style.transition = 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)';
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, i * 60 + 100);
            });
        }

        // ====================================================
        // ===== PIN SCREEN =====
        // ====================================================
        // Ensure pin.init is called correctly
        const _origPinInit = pin.init.bind(pin);
        pin.init = function(mode, callback) {
            _origPinInit(mode, callback);
        };

        // Override pin submit to check block
        const _origPinSubmit = pin.submit.bind(pin);
        pin.submit = function() {
            if (checkPinBlock()) return;
            _origPinSubmit();
        };

        // Override pin add to check block
        const _origPinAdd = pin.add.bind(pin);
        pin.add = function(d) {
            if (pinBlocked) {
                document.getElementById('pin-error').style.display = 'block';
                return;
            }
            _origPinAdd(d);
        };

        // Intercept wrong PIN in verify mode
        pin._onWrongPin = () => {
            pinAttempts++;
            if (pinAttempts >= 3) {
                const blockUntil = Date.now() + 30000;
                localStorage.setItem('pin_blocked_until', blockUntil.toString());
                pinBlocked = true;
                pinAttempts = 0;
                showPinBlockMessage(30);
            }
        };

        // ====================================================
        // ===== PAGE OPEN WITH ANIMATION =====
        // ====================================================
        const _origOpenPage = ui.openPage.bind(ui);
        ui.openPage = function(id) {
            _origOpenPage(id);
            const page = document.getElementById(id);
            if (page) {
                page.style.animation = 'none';
                void page.offsetWidth;
                page.style.animation = 'flutterPageEnter 0.35s cubic-bezier(0.25,0.46,0.45,0.94) both';
                // Stagger list items
                setTimeout(() => addStaggerToList(`#${id} .settings-card, #${id} .adv-list, #${id} #hist-list`), 200);
            }
        };

        // ====================================================
        // ===== AUTO LOCK INIT =====
        // ====================================================
        resetAutoLock();

        const legal = {
            show: (t) => { 
                const c = { 
                    'privacy': `<h3>Privacy Policy</h3>
<p><strong>Effective Date:</strong> January 1, 2024</p>
<p><strong>Age Restriction:</strong> You must be 18 years or older to use this application. By using Duty Tracker Pro, you confirm that you are at least 18 years of age.</p>
<p><strong>Data Sharing:</strong> We do NOT sell your personal data to any third parties. Your attendance records, financial data, and personal information are used solely for providing the app's services and are never shared with marketers or data brokers.</p>
<p>Duty Tracker Pro ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application ("the App"). Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.</p>
<h4>1. Information We Collect</h4>
<p>We collect personal information that you voluntarily provide to us when you register for an account, express an interest in obtaining information about us or our products and services, or otherwise contact us. The personal information we collect includes:</p>
<p>- <strong>Account Information:</strong> Your name, phone number, email address, and a 4-digit PIN for secure access to your account.</p>
<p>- <strong>Attendance Data:</strong> Duty status (Present, Leave, Sick, Holiday, Half Day, Off), shift selection, overtime hours, late minutes, check-in/out times.</p>
<p>- <strong>Financial Data:</strong> Advance money records, salary configurations, and subscription payment history.</p>
<p>- <strong>Device Information:</strong> Device model, operating system, unique device identifiers, and mobile network information for analytics and crash reporting.</p>
<h4>2. How We Use Your Information</h4>
<p>We use the information we collect or receive for the following purposes:</p>
<p>- To provide, operate, and maintain the App's core functionality including attendance tracking, salary calculation, and advance management.</p>
<p>- To process your premium subscription payments through Razorpay, PayPal, Binance, or Google Play Billing (we do not store your full payment credentials).</p>
<p>- To send you important notifications about your account, subscription status, or updates to the App.</p>
<p>- To improve our services, analyze usage patterns, and fix technical issues.</p>
<p>- To comply with legal obligations and enforce our terms and conditions.</p>
<h4>3. No Sale of Personal Data</h4>
<p><strong>We do not sell, rent, or trade your personal information to any third parties.</strong> Your data is used exclusively for providing and improving the App's services. We do not share your information with advertisers, data brokers, or marketing companies.</p>
<h4>4. Age Restriction (18+)</h4>
<p>Our services are intended for users who are 18 years of age or older. By creating an account and using the App, you represent and warrant that you are at least 18 years old. We do not knowingly collect personal information from anyone under the age of 18. If we become aware that we have collected personal information from a user under 18, we will delete that information immediately.</p>
<h4>5. Data Storage and Security</h4>
<p>Your data is stored securely on Google Firebase servers located in multiple regions with industry-standard encryption (AES-256 at rest and TLS 1.2 in transit). We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
<h4>6. Third-Party Services</h4>
<p>We use the following third-party services that may collect information about you:</p>
<p>- <strong>Google Firebase:</strong> For database storage, authentication, and analytics.</p>
<p>- <strong>Razorpay:</strong> For processing Indian Rupee payments (₹).</p>
<p>- <strong>PayPal:</strong> For processing USD payments ($).</p>
<p>- <strong>Binance:</strong> For manual USDT (TRC20) payment verification.</p>
<p>- <strong>Google Play Billing:</strong> For Google Play Store subscriptions.</p>
<p>- <strong>OneSignal:</strong> For push notifications (you can opt-out anytime).</p>
<p>- <strong>ImgBB:</strong> For temporary storage of payment screenshots.</p>
<p>Each of these services has its own privacy policy. We encourage you to review their policies before using their services. We do not sell your data to any of these services.</p>
<h4>7. Data Retention</h4>
<p>We retain your personal data for as long as your account is active or as needed to provide you services. If you delete your account, we will delete your personal information within 30 days, except where we are required to retain certain information for legal compliance, fraud prevention, or legitimate business purposes (e.g., aggregated anonymized statistics).</p>
<h4>8. Your Rights</h4>
<p>Depending on your location (especially if you are in the EU, UK, or India under the Digital Personal Data Protection Act), you may have the following rights:</p>
<p>- <strong>Right to Access:</strong> Request a copy of your personal data.</p>
<p>- <strong>Right to Rectification:</strong> Correct inaccurate or incomplete data.</p>
<p>- <strong>Right to Erasure:</strong> Request deletion of your data ("Right to be forgotten").</p>
<p>- <strong>Right to Restrict Processing:</strong> Limit how we use your data.</p>
<p>- <strong>Right to Data Portability:</strong> Receive your data in a structured format.</p>
<p>- <strong>Right to Object:</strong> Object to certain processing activities.</p>
<p>To exercise these rights, contact us at nitai.grp00@gmail.com. We will respond within 30 days.</p>
<h4>9. Children's Privacy</h4>
<p>Our service is not directed to children under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. If we discover we have collected personal information from a child under 18, we will delete that information promptly.</p>
<h4>10. International Data Transfers</h4>
<p>Your information may be transferred to and maintained on servers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using the App, you consent to such transfers.</p>
<h4>11. Changes to This Privacy Policy</h4>
<p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Effective Date" at the top. You are advised to review this privacy policy periodically for any changes. Changes to this privacy policy are effective when they are posted on this page.</p>
<h4>12. Contact Us</h4>
<p>If you have questions or comments about this Privacy Policy, please contact us at:</p>
<p><strong>Email:</strong> nitai.grp00@gmail.com</p>
<p><strong>Developer:</strong> Nitai Studio</p>
<p><strong>Made in India</strong> 🇮🇳</p>`,
                    
                    'terms': `<h3>Terms & Conditions</h3>
<p><strong>Last Updated:</strong> January 1, 2024</p>
<p><strong>Age Requirement:</strong> You must be at least 18 years old to use this application. By using Duty Tracker Pro, you confirm that you meet this age requirement.</p>
<p>Welcome to Duty Tracker Pro ("the App"). By downloading, accessing, or using the App, you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree to these Terms, please do not use the App.</p>
<h4>1. Acceptance of Terms</h4>
<p>By using the App, you acknowledge that you have read, understood, and agree to be bound by these Terms, as well as our Privacy Policy. These Terms apply to all users of the App, including free trial users and premium subscribers.</p>
<h4>2. Account Registration and Security</h4>
<p>You must provide accurate, current, and complete information when creating an account. You are solely responsible for maintaining the confidentiality of your 4-digit PIN and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account. We reserve the right to suspend or terminate your account if any information provided is found to be inaccurate, false, or incomplete.</p>
<h4>3. User Responsibilities</h4>
<p>You agree to use the App only for lawful purposes and in accordance with these Terms. You shall not:</p>
<p>- Use the App for any illegal or unauthorized purpose.</p>
<p>- Attempt to gain unauthorized access to any portion of the App or its systems.</p>
<p>- Interfere with or disrupt the App's servers or networks.</p>
<p>- Reverse engineer, decompile, or disassemble any part of the App.</p>
<p>- Use the App to store or transmit malicious code, viruses, or harmful content.</p>
<p>- Share your account credentials with any third party.</p>
<h4>4. Premium Subscription</h4>
<p>Certain features of the App require a premium subscription. By purchasing a subscription, you agree to pay the applicable fees. Subscriptions are non-transferable and cannot be shared between accounts. Premium features include, but are not limited to: salary reports, PDF export, advance management, graph tracking, utility rate configuration. We reserve the right to modify or add to the list of premium features at any time.</p>
<p><strong>No Auto-Renewal:</strong> Our subscriptions do NOT automatically renew. You must manually renew your subscription before it expires to continue enjoying premium benefits. You will receive reminders before your subscription expires.</p>
<h4>5. Payment and Refunds</h4>
<p>Payments are processed through third-party gateways: Razorpay (Indian Rupees), PayPal (US Dollars), Binance USDT (TRC20), and Google Play Billing. We do not store your full payment information. All sales are final. We do not offer refunds for digital subscriptions, except in the following cases:</p>
<p>- Technical issues preventing access that cannot be resolved within 7 days of reporting.</p>
<p>- Duplicate payments due to system error.</p>
<p>- Unauthorized charges (proof required).</p>
<p>Refund requests must be submitted within 48 hours of purchase to nitai.grp00@gmail.com with your order details and reason for refund.</p>
<h4>6. Free Trial and Referral Program</h4>
<p>New users receive a 3-day free trial upon signup. Additional free premium days may be earned through:</p>
<p>- Referring friends using your unique referral code (both parties receive +10 days when code is used).</p>
<p>- Joining our official Telegram and WhatsApp channels (7 days free premium).</p>
<p>Free premium days are added to your existing subscription and cannot be exchanged for cash or transferred to another account.</p>
<h4>7. Intellectual Property</h4>
<p>The App and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof) are owned by Nitai Studio and are protected by Indian and international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not reproduce, distribute, modify, create derivative works of, publicly display, or commercially exploit any part of the App without our prior written consent.</p>
<h4>8. Limitation of Liability</h4>
<p>To the fullest extent permitted by law, Nitai Studio, its directors, employees, partners, or agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:</p>
<p>- Your use or inability to use the App.</p>
<p>- Any conduct or content of any third party on the App.</p>
<p>- Unauthorized access, use, or alteration of your transmissions or content.</p>
<p>- Any bugs, viruses, or other harmful code that may be transmitted to or through the App.</p>
<p>- Any errors or omissions in salary calculations (the App provides estimates only, not official payroll).</p>
<p>Our total liability to you for any claims arising out of or relating to these Terms or the App shall not exceed the amount you have paid us in the past 12 months, or ₹100 (whichever is greater).</p>
<h4>9. Disclaimer of Warranties</h4>
<p>THE APP IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. WE DO NOT WARRANT THE ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY SALARY CALCULATIONS OR ATTENDANCE REPORTS. YOU ASSUME FULL RESPONSIBILITY FOR VERIFYING ALL DATA ENTERED INTO THE APP.</p>
<h4>10. Termination</h4>
<p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms. Upon termination, your right to use the App will cease immediately. You may also terminate your account at any time by contacting us. Provisions of these Terms that by their nature should survive termination shall survive (including intellectual property, limitation of liability, and governing law).</p>
<h4>11. Governing Law and Dispute Resolution</h4>
<p>These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles. Any dispute arising out of or relating to these Terms or the App shall be resolved exclusively through binding arbitration in Kolkata, West Bengal, India, in accordance with the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted in English. You agree to waive any right to a jury trial or to participate in a class action.</p>
<h4>12. Changes to Terms</h4>
<p>We reserve the right to modify these Terms at any time. If we make material changes, we will notify you through the App or via email. Your continued use of the App after any such changes constitutes your acceptance of the new Terms. It is your responsibility to review these Terms periodically.</p>
<h4>13. Contact Information</h4>
<p>For questions about these Terms, please contact us at:</p>
<p><strong>Email:</strong> nitai.grp00@gmail.com</p>
<p><strong>Developer:</strong> Nitai Studio</p>`,
                    
                    'refund': `<h3>Refund Policy</h3>
<p><strong>Effective Date:</strong> January 1, 2024</p>
<p>At Duty Tracker Pro, we strive to ensure your satisfaction with our services. This Refund Policy explains the circumstances under which refunds may be issued for premium subscription payments.</p>
<h4>1. Digital Goods Policy</h4>
<p>As our products are digital services (subscriptions) that are delivered instantly upon payment, they are generally considered non-refundable once activated. By purchasing a subscription, you acknowledge and agree that you are waiving any right to a "cooling off" period or refund for change of mind.</p>
<h4>2. Refund Exceptions</h4>
<p>Refunds may be considered ONLY in the following exceptional circumstances:</p>
<p><strong>a) Technical Issues:</strong> If you experience a technical issue that prevents you from accessing premium features, and our support team is unable to resolve the issue within 7 days of your report, you may be eligible for a pro-rated refund for the unused portion of your subscription.</p>
<p><strong>b) Duplicate Payments:</strong> If you are accidentally charged twice for the same subscription period due to a system error, we will refund the duplicate payment in full.</p>
<p><strong>c) Unauthorized Charges:</strong> If your payment method was used without your authorization and you provide proof (such as a police report or bank statement), we will refund the amount after verification.</p>
<h4>3. How to Request a Refund</h4>
<p>To request a refund, you must email us at <strong>nitai.grp00@gmail.com</strong> within 48 hours of your purchase date. Your email must include your registered phone number, order ID, and detailed reason for the refund request.</p>
<h4>4. Contact Us</h4>
<p>For all refund inquiries, please contact: nitai.grp00@gmail.com</p>`,
                    
                    'subscription': `<h3>Subscription Policy</h3>
<p><strong>Effective Date:</strong> January 1, 2024</p>
<p>This Subscription Policy governs the purchase, use, and management of premium subscriptions for Duty Tracker Pro.</p>
<h4>1. Subscription Plans</h4>
<p>We offer Monthly (₹5 INR / $1 USD), 6 Months (₹20 INR), and Yearly (₹50 INR / $5 USD) plans. Subscriptions are valid for 30, 180, or 365 days respectively from the date of purchase.</p>
<h4>2. Payment Methods</h4>
<p>We accept Razorpay (Indian Rupees), PayPal (US Dollars), Binance USDT (TRC20), and Google Play Billing. All payments are processed through secure third-party gateways.</p>
<h4>3. No Auto-Renewal</h4>
<p>Our subscriptions do NOT automatically renew. You must manually renew before expiration to continue premium benefits.</p>
<h4>4. Contact</h4>
<p>For subscription inquiries: nitai.grp00@gmail.com</p>`,
                    
                    'deletion': `<h3>Data Deletion Policy</h3>
<p><strong>Effective Date:</strong> January 1, 2024</p>
<p>You have the right to request deletion of all your personal data. To request deletion, email nitai.grp00@gmail.com with "DATA DELETION REQUEST" and your registered phone number. We will process your request within 30 days. Your data will be permanently deleted from our active databases, though anonymized statistics may be retained.</p>`,
                    
                    'disclaimer': `<h3>Disclaimer</h3>
<p><strong>Last Updated:</strong> January 1, 2024</p>
<p>Duty Tracker Pro is provided for general informational and record-keeping purposes only. The App is NOT an official payroll system. Salary calculations are estimates based on user-entered data. We are not responsible for any discrepancies between App-calculated salaries and actual salaries. The App is provided "as is" without warranties. By using the App, you agree that Nitai Studio shall not be liable for any financial losses, disputes with employers, or other damages arising from use of the App.</p>`
                }; 
                document.getElementById('legal-body').innerHTML = c[t] || "Content not found."; 
                document.getElementById('legal-modal').style.display='flex'; 
                history.pushState({page: 'legal'}, null, ''); 
            }
        };

        // ====================================================
        // ===== OFFLINE / ONLINE DETECTION =====
        // ====================================================
        function updateOnlineStatus() {
            const icon = document.getElementById('offline-sync-icon');
            const status = document.getElementById('offline-sync-status');
            if (!navigator.onLine) {
                document.body.classList.add('offline');
                if (icon) icon.textContent = '📴';
                if (status) status.textContent = 'Offline — tap to retry';
            } else {
                document.body.classList.remove('offline');
                if (icon) icon.textContent = '☁️';
                if (status) status.textContent = 'All synced';
            }
        }
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        document.addEventListener('DOMContentLoaded', updateOnlineStatus);
