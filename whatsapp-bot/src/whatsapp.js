import * as Baileys from 'baileys';
import CONFIG from './config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import axios from 'axios';

const { DisconnectReason } = Baileys;

const LARAVEL_BASE_URL = process.env.LARAVEL_API_URL || 'http://127.0.0.1:8000';

export default class WhatsAppBot {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    const { makeWASocket, useMultiFileAuthState, Browsers } = Baileys;

    // useMultiFileAuthState expects a FOLDER, resolved relative to this file
    // so "node index.js" works from any working directory.
    const authDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'auth_info');

    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    this.client = makeWASocket({
      auth: state,
      browser: Browsers.ubuntu('Chrome'),
      logger: pino({ level: 'silent' }),
    });

    this.client.ev.on('creds.update', saveCreds);

    this.client.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('📱 Scan QR ini dengan WhatsApp: Perangkat Tertaut > Tautkan Perangkat:');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'open') {
        this.isConnected = true;
        console.log('✅ WhatsApp Bot terhubung!');
      } else if (connection === 'close') {
        this.isConnected = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;

        if (statusCode === DisconnectReason.loggedOut) {
          console.log('❌ WhatsApp Bot disconnect (logged out).');
          console.log('💡 Hapus isi folder auth_info lalu jalankan ulang bot untuk scan QR baru.');
          return;
        }

        console.log('❌ WhatsApp Bot disconnect (status:', statusCode, ')');
        console.log('🔄 Reconnect dalam 3 detik...');
        setTimeout(() => {
          this.connect().catch((err) => {
            console.error('❌ Gagal reconnect:', err?.message || err);
          });
        }, 3000);
      } else if (connection === 'connecting') {
        console.log('🔄 WhatsApp Bot connecting...');
      }
    });

    this.client.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return; // ignore history/offline sync batches

      for (const m of messages) {
        if (m.key.fromMe) continue;

        const from = m.key.remoteJid;
        if (!from || from === 'status@broadcast') continue;

        const text = m.message?.conversation
          || m.message?.extendedTextMessage?.text
          || m.message?.imageMessage?.caption
          || m.message?.videoMessage?.caption
          || '';
        if (!text) continue;

        await this.handleIncomingMessage(from, text);
      }
    });

    return this.client;
  }

  async handleIncomingMessage(from, text) {
    const normalized = String(text).toLowerCase().trim();

    try {
      const response = await this.getAutoReply(normalized, from);
      if (response) {
        await this.sendMessage(from, response);
      }
    } catch (err) {
      console.error('❌ Error handling message:', err?.message || err);
      await this.sendMessage(from, '⚠️ Terjadi kesalahan. Silakan coba lagi atau ketik "menu".');
    }
  }

  formatPrice(value) {
    return `Rp${Number(value || 0).toLocaleString('id-ID')}`;
  }

  async fetchFromLaravel(endpoint) {
    try {
      const response = await axios.get(`${LARAVEL_BASE_URL}${endpoint}`, {
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        // API answered with an error status (e.g. 404) — return its JSON body
        return error.response.data;
      }
      console.error('❌ Error fetching from Laravel API:', error.message);
      return null;
    }
  }

  async getAutoReply(text, userNumber) {
    // ===== Welcome =====
    if (/^(halo|hai|hello|hi)$/i.test(text)) {
      return 'Halo 👋\nSelamat datang di Dadi Mulyo!\nAda yang bisa saya bantu?\nKetik "menu" untuk melihat menu.';
    }

    // ===== Menu (from Laravel API) =====
    if (text === 'menu') {
      const data = await this.fetchFromLaravel('/api/chatbot/menu');
      if (data && data.success && Array.isArray(data.menu)) {
        let msg = '📋 MENU DADI MULYO\n\n';
        data.menu.forEach((item) => {
          msg += `${item.id}. ${item.label} - ${item.description}\n`;
        });
        msg += '\nKetik nomor atau kata kunci, contoh: "1" atau "produk".';
        return msg;
      }
      // Fallback jika API tidak bisa dihubungi
      return '📋 MENU DADI MULYO\n\n1. Produk\n2. Harga\n3. Pesanan\n4. Bantuan\n5. Admin';
    }

    // ===== Produk (from Laravel API) =====
    if (text === '1' || text === 'produk' || text === 'jeruk') {
      const data = await this.fetchFromLaravel('/api/chatbot/products?per_page=10');
      if (data && data.success && Array.isArray(data.products) && data.products.length > 0) {
        let msg = '🍊 PRODUK JERUK DADI MULYO\n\n';
        data.products.forEach((p, i) => {
          msg += `${i + 1}. ${p.name}\n`;
          msg += `   Harga: ${this.formatPrice(p.price_per_kg)}/kg\n`;
          msg += `   Stok: ${p.stock_kg > 0 ? `${Number(p.stock_kg).toLocaleString('id-ID')} kg (Tersedia)` : 'Habis'}\n`;
          if (p.farm_location) msg += `   Lokasi: ${p.farm_location}\n`;
          msg += '\n';
        });
        msg += 'Ketik "produk <nama>" untuk detail, contoh: "produk sunkist".';
        return msg;
      }
      if (data && data.success && Array.isArray(data.products)) {
        return '🍊 Belum ada produk yang tersedia saat ini. Silakan coba lagi nanti.';
      }
      // Fallback jika API tidak bisa dihubungi
      return '🍊 Maaf, data produk sedang tidak dapat diakses.\nSilakan ketik "menu" untuk kembali.';
    }

    // ===== Detail produk berdasarkan nama (from Laravel API) =====
    if (text.startsWith('produk ')) {
      const productName = text.replace('produk ', '').trim();
      if (!productName) {
        return '🍊 Ketik "produk" untuk melihat daftar produk.';
      }
      const data = await this.fetchFromLaravel(`/api/chatbot/product/${encodeURIComponent(productName)}`);
      if (data && data.success && data.product) {
        const p = data.product;
        let msg = `🍊 ${p.name}\n\n`;
        if (p.description) msg += `${p.description}\n\n`;
        msg += `Harga: ${this.formatPrice(p.price_per_kg)}/kg\n`;
        if (p.wholesale_price) msg += `Harga grosir: ${this.formatPrice(p.wholesale_price)}/kg\n`;
        msg += `Stok: ${p.stock_kg > 0 ? `${Number(p.stock_kg).toLocaleString('id-ID')} kg (Tersedia)` : 'Habis'}\n`;
        if (p.minimum_order_kg) msg += `Min. pesanan: ${p.minimum_order_kg} kg\n`;
        if (p.grade) msg += `Grade: ${p.grade}\n`;
        if (p.farm_location) msg += `Lokasi kebun: ${p.farm_location}\n`;
        return msg;
      }
      if (data && data.message) {
        return `🍊 ${data.message}. Ketik "produk" untuk melihat daftar produk.`;
      }
      return `🍊 Produk "${productName}" tidak ditemukan. Silakan ketik "produk" untuk melihat daftar.`;
    }

    // ===== Harga (from Laravel API) =====
    if (text === '2' || text === 'harga') {
      const data = await this.fetchFromLaravel('/api/chatbot/products?per_page=10');
      if (data && data.success && Array.isArray(data.products) && data.products.length > 0) {
        let msg = '💰 HARGA JERUK DADI MULYO\n\n';
        data.products.forEach((p, i) => {
          msg += `${i + 1}. ${p.name}: ${this.formatPrice(p.price_per_kg)}/kg`;
          if (p.wholesale_price) msg += ` (grosir ${this.formatPrice(p.wholesale_price)}/kg)`;
          msg += '\n';
        });
        msg += '\nHarga dapat berubah. Ketik "produk <nama>" untuk detail lengkap.';
        return msg;
      }
      // Fallback jika API tidak bisa dihubungi
      return '💰 Maaf, data harga sedang tidak dapat diakses.\nSilakan ketik "menu" untuk kembali.';
    }

    // ===== Pesanan (from Laravel API, 2 langkah: user -> order) =====
    if (text === '3' || text === 'pesanan' || text === 'pesan saya') {
      const senderPhone = userNumber.split('@')[0].replace(/[^0-9]/g, '');
      const userData = await this.fetchFromLaravel(`/api/chatbot/user/${senderPhone}`);

      if (!userData || !userData.success || !userData.user) {
        return '📦 Nomor WhatsApp Anda belum terdaftar di sistem Dadi Mulyo.\nSilakan daftar terlebih dahulu melalui website.';
      }

      const orderData = await this.fetchFromLaravel(`/api/chatbot/order/${userData.user.id}`);
      if (orderData && orderData.success && orderData.order) {
        const o = orderData.order;
        let msg = '📦 PESANAN TERAKHIR ANDA\n\n';
        msg += `Nomor Pesanan: ${o.order_number}\n`;
        msg += `Total: ${this.formatPrice(o.total)}\n`;
        msg += `Status: ${o.status}\n`;
        msg += `Pembayaran: ${o.payment_status || '-'}\n`;
        return msg;
      }
      if (orderData && orderData.message) {
        return `📦 ${orderData.message}`;
      }
      return '📦 Anda belum memiliki pesanan.';
    }

    // ===== Bantuan =====
    if (text === '4' || text === 'bantuan') {
      return '📖 Panduan penggunaan:\n- Ketik "menu" untuk melihat opsi\n- Ketik "halo" untuk welcome message\n- Ketik "1" atau "produk" untuk daftar produk\n- Ketik "2" atau "harga" untuk daftar harga\n- Ketik "3" atau "pesanan" untuk cek pesanan Anda\n- Ketik "produk <nama>" untuk detail produk, contoh: "produk sunkist"';
    }

    // ===== Admin =====
    if (text === '5' || text === 'admin') {
      return '👨‍💼 Informasi kontak admin:\nWhatsApp: 081234567890\nEmail: admin@dadimulyo.com';
    }

    // ===== Cek user terdaftar (from Laravel API) =====
    if (text.startsWith('user ')) {
      const whatsappNumber = text.replace('user ', '').trim();
      const data = await this.fetchFromLaravel(`/api/chatbot/user/${encodeURIComponent(whatsappNumber)}`);
      if (data && data.success && data.user) {
        return `👋 Halo ${data.user.name}!\nSelamat datang kembali di Dadi Mulyo.`;
      }
      if (data && data.message) {
        return `👋 ${data.message}`;
      }
      return '👋 Nomor kamu belum terdaftar di sistem Dadi Mulyo.\nSilakan daftar terlebih dahulu melalui website.';
    }

    // Unknown command
    return null;
  }

  async sendMessage(to, message) {
    if (!this.isConnected) {
      throw new Error('Bot belum terhubung ke WhatsApp');
    }
    await this.client.sendMessage(to, { text: message });
  }

  getWASocket() {
    return this.client;
  }
}
