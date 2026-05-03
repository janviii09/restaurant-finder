const webPush = require('web-push');

const vapidKeys = webPush.generateVAPIDKeys();

console.log('\n═══════════════════════════════════════════');
console.log('  VAPID Keys Generated Successfully!');
console.log('═══════════════════════════════════════════\n');
console.log('Add these to your .env file:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\n═══════════════════════════════════════════\n');
