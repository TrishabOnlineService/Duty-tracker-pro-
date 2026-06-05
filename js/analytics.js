        function trackUserActivity(uid, action) {
            const now = Date.now();
            const today = new Date().toISOString().split('T')[0];
            const hour = new Date().getHours();
            
            db.ref(`analytics/users/${uid}/lastActive`).set(now);
            db.ref(`analytics/users/${uid}/lastAction`).set(action);
            db.ref(`analytics/users/${uid}/totalSessions`).transaction(c => (c || 0) + 1);
            db.ref(`analytics/daily/${today}/${uid}`).set(now);
            db.ref(`analytics/hourly/${today}/${hour}/${uid}`).set(now);
            db.ref(`analytics/stats/dailyActive`).transaction(c => (c || 0) + 1);
            
            // Track app opens
            db.ref(`analytics/users/${uid}/appOpens`).transaction(c => (c || 0) + 1);
        }

        function getAnalyticsForAdmin() {
            // This function would be called from admin panel
            db.ref('analytics/stats').once('value', (snap) => {
                console.log("Admin Analytics:", snap.val());
            });
        }

