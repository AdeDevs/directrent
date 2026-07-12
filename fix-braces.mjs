import fs from 'fs';
let content = fs.readFileSync('src/layouts/AppLayout.tsx', 'utf8');

const replacement = `    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const id = change.doc.id;
          const data = change.doc.data();
          
          if (data.read === false) {
            if (isInitialLoad) {
              processedNotifs.add(id);
            } else if (!processedNotifs.has(id)) {
              processedNotifs.add(id);
              
              // Show toast notification
              toast.success(\`\${data.title}: \${data.message}\`, {
                duration: 6000,
                icon: '🔔'
              });

              // Show real browser system Notification if supported and granted
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(registration => {
                      registration.showNotification(data.title, {
                        body: data.message,
                        icon: '/logo-light.png',
                        badge: '/logo-light.png'
                      });
                    }).catch(err => {
                      console.warn("Failed to trigger SW Notification:", err);
                      new Notification(data.title, { body: data.message, icon: '/logo-light.png' });
                    });
                  } else {
                    new Notification(data.title, { body: data.message, icon: '/logo-light.png' });
                  }
                } catch (err) {
                  console.warn("Failed to trigger local browser Notification:", err);
                }
              }
            }
          }
        }
      });
      isInitialLoad = false;
    }, (error: any) => {`;

const startIdx = content.indexOf('const unsubscribe = onSnapshot(q, (snapshot) => {');
const endIdx = content.indexOf("if (error?.code === 'permission-denied' || error?.message?.includes('permission')) return;");

if (startIdx !== -1 && endIdx !== -1) {
    const endOfBlock = content.lastIndexOf('    }, (error: any) => {', endIdx) + '    }, (error: any) => {'.length;
    content = content.substring(0, startIdx) + replacement + content.substring(endOfBlock);
    fs.writeFileSync('src/layouts/AppLayout.tsx', content);
    console.log("Replaced successfully!");
} else {
    console.log("Could not find start or end index.");
}
