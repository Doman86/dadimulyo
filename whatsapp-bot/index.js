import CONFIG from './src/config.js';
import WhatsAppBot from './src/whatsapp.js';

const bot = new WhatsAppBot();

console.log('🚀 Memulai WhatsApp Bot Dadi Mulyo...');
console.log('📊 Port:', CONFIG.PORT);

bot.connect().then(() => {
  console.log('Bot siap menerima pesan!');
}).catch((err) => {
  console.error('❌ Error koneksi:', err);
});