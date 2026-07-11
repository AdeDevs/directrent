const fs = require('fs');
const content = fs.readFileSync('src/lib/notifications.ts', 'utf8');

const newContent = content.replace(
  '  } catch (err) {',
  `    
    // Trigger push notification via backend
    fetch('/api/notifications/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        title,
        body: message,
        link,
        relatedId
      })
    }).catch(e => console.warn("Push trigger failed:", e));

  } catch (err) {`
);

fs.writeFileSync('src/lib/notifications.ts', newContent);
