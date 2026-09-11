import * as Baileys from 'baileys';
import CONFIG from './config.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

export default class WhatsAppBot {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.waitingFor = new Map();
    this.userCache = new Map();
  }

  async connect() {
    const { makeWASocket, useMultiFileAuthState } = Baileys;
    const authDir = path.join(process.cwd(), 'auth_info');
    
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const authPath = path.join(authDir, 'creds.json');
    const { state } = await useMultiFileAuthState(authPath);

    this.client = makeWASocket({
      auth: state,
      restartOnAuthError: true,
    });

    this.client.ev.on('connection.update', async (update) => {
      const { connection, lastStatus, qr } = update;

      if (qr) {
        console.log('📱 QR Code generated. Scan this code to connect WhatsApp:');
        console.log(qr);
      }

      if (connection === 'open') {
        this.isConnected = true;
        console.log('✅ WhatsApp Bot terhubung!');
      } else if (connection === 'close') {
        this.isConnected = false;
        console.log('❌ WhatsApp Bot disconnect');
      } else if (connection === 'authenticated') {
        console.log('✅ WhatsApp Bot terotentikasi');
      } else if (connection === 'connecting') {
        console.log('🔄 WhatsApp Bot connecting...');
      }
    });

    this.client.ev.on('messages.4', async (message) => {
      this.handleIncomingMessage(message);
    });

    this.isConnected = true;
    return this.client;
  }

  async handleIncomingMessage(message) {
    const { from, message: msg, } = message;
    if (!msg || !msg.text) return;

    const text = msg.text.toLowerCase().trim();
    const userNumber = from;

    // Check if user is in waiting state
    if (this.waitingFor.has(userNumber)) {
      const state = this.waitingFor.get(userNumber);
      await this.handleWaitingState(userNumber, text, state);
      return;
    }

    // Auto-reply based on message content
    const response = this.getAutoReply(text, userNumber);
    if (response) {
      await this.sendMessage(from, response);
    }
  }

  async handleWaitingState(userNumber, text, state) {
    switch (state) {
      case 'menu':
        await this.sendMessage(userNumber, '📋 MENU DADI MULYO\n\n1. Produk\n2. Harga\n3. Pesanan\n4. Bantuan\n5. Admin');
        this.waitingFor.delete(userNumber);
        break;
      case 'produk':
        await this.sendMessage(userNumber, '🍊 Fitur produk akan dihubungkan ke Laravel API.\nSilakan ketik "menu" untuk kembali.');
        this.waitingFor.delete(userNumber);
        break;
      case 'harga':
        await this.sendMessage(userNumber, '💰 Fitur harga akan dihubungkan ke Laravel API.\nSilakan ketik "menu" untuk kembali.');
        this.waitingFor.delete(userNumber);
        break;
      case 'pesanan':
        await this.sendMessage(userNumber, '📦 Fitur pesanan akan dihubungkan ke Laravel API.\nSilakan ketik "menu" untuk kembali.');
        this.waitingFor.delete(userNumber);
        break;
      case 'bantuan':
        await this.sendMessage(userNumber, '📖 Bantuan:\nKetik "menu" untuk melihat opsi.\nKetik "halo" untuk welcome message.');
        this.waitingFor.delete(userNumber);
        break;
      case 'admin':
        await this.sendMessage(userNumber, '👨‍💼 Kontak Admin:\nWhatsApp: 081234567890\nEmail: admin@dadimulyo.com');
        this.waitingFor.delete(userNumber);
        break;
      default:
        this.waitingFor.delete(userNumber);
    }
  }

  async fetchFromLaravel(endpoint) {
    try {
      const response = await axios.get(`http://127.0.0.1:8000${endpoint}`, {
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching from Laravel API:', error.message);
      return null;
    }
  }

  getAutoReply(text, userNumber) {
    // Welcome messages
    if (/^halo$/i.test(text) || /^hai$/i.test(text) || /^hello$/i.test(text)) {
      return 'Halo 👋\nSelamat datang di Dadi Mulyo!\nAda yang bisa saya bantu?\nKetik "menu" untuk melihat menu.';
    }

    // Menu handler
    if (text === 'menu') {
      return '📋 MENU DADI MULYO\n\n1. Produk\n2. Harga\n3. Pesanan\n4. Bantuan\n5. Admin';
    }

    // Number/keyword handlers
    if (text === '1' || text === 'produk') {
      this.waitingFor.set(userNumber, 'produk');
      return '🍊 Tentu. Untuk melihat produk jeruk yang tersedia, silakan pilih menu Produk.\nSaya sedang menghubungkan ke database produk Dadi Mulyo...';
    }

    if (text === '2' || text === 'harga') {
      this.waitingFor.set(userNumber, 'harga');
      return '🍊 Harga jeruk akan diambil dari data produk Dadi Mulyo.\nSedang mengambil data dari Laravel API...';
    }

    if (text === '3' || text === 'pesanan') {
      this.waitingFor.set(userNumber, 'pesanan');
      return '📦 Untuk mencari pesanan berdasarkan nomor WhatsApp, silakan ketik "menu" terlebih dahulu.';
    }

    if (text === '4' || text === 'bantuan') {
      return '📖 Panduan penggunaan:\n- Ketik "menu" untuk melihat opsi\n- Ketik "halo" untuk welcome message\n- Ketik "1" untuk produk\n- Ketik "2" untuk harga';
    }

    if (text === '5' || text === 'admin') {
      return '👨‍💼 Informasi kontak admin:\nWhatsApp: 081234567890\nEmail: admin@dadimulyo.com';
    }

    // Fetch products from Laravel API
    if (text === 'jeruk') {
      this.waitingFor.set(userNumber, 'produk');
      const data = this.fetchFromLaravel('/api/chatbot/products');
      return new Promise((resolve) => {
        setTimeout(() => {
          if (data && data.success && data.products.length > 0) {
            let msg = '🍊 DAFTAR PRODUK JERUK DADI MULYO\n\n';
            data.products.forEach((p, i) => {
              msg += `${i + 1}. ${p.name}\n`;
              msg += `   Harga: Rp${p.price_per_kg.toLocaleString()}/kg\n`;
              msg += `   Stok: ${p.stock_kg > 0 ? 'Tersedia' : 'Tersedia'}\n\n`;
            });
            resolve(msg);
          } else {
            resolve('🍊 Fitur produk akan segera tersedia. Silakan ketik "menu" untuk kembali.');
          }
        }, 500);
      });
    }

    // Fetch products by name from Laravel API
    if (text.startsWith('produk ')) {
      const productName = text.replace('produk ', '').trim();
      this.waitingFor.set(userNumber, 'produk');
      const data = this.fetchFromLaravel(`/api/chatbot/product/${productName}`);
      return new Promise((resolve) => {
        setTimeout(() => {
          if (data && data.success) {
            const p = data.product;
            resolve(`🍊 ${p.name}\nHarga: Rp${p.price_per_kg.toLocaleString()}/kg\nStok: ${p.stock_kg > 0 ? 'Tersedia' : 'Tersedia'}`);
          } else {
            resolve(`🍊 Produk "${productName}" tidak ditemukan. Silakan ketik "menu" untuk kembali.`);
          }
        }, 500);
      });
    }

    // Get user info from Laravel
    if (text.startsWith('user ')) {
      const whatsappNumber = text.replace('user ', '').trim();
      this.userCache.set(userNumber, 'user_lookup');
      const data = this.fetchFromLaravel(`/api/chatbot/user/${whatsappNumber}`);
      return new Promise((resolve) => {
        setTimeout(() => {
          if (data && data.success) {
            const u = data.user;
            resolve(`👋 Halo ${u.name}!\nSelamat datang kembali di Dadi Mulyo.`);
          } else {
            resolve('👋 Halo! Nomor kamu belum terdaftar di sistem Dadi Mulyo.\nSilakan daftar terlebih dahulu melalui website.');
          }
        }, 500);
      });
    }

    // Get orders from Laravel
    if (text === 'pesan saya' || text === '3') {
      this.waitingFor.set(userNumber, 'pesanan');
      // We need the user number, let's assume it's the 'from' number
      const data = this.fetchFromLaravel(`/api/chatbot/order/${userNumber}`);
      return new Promise((resolve) => {
        setTimeout(() => {
          if (data && data.success && data.order) {
            const o = data.order;
            resolve(`📦 PESANAN ANDA\n\nNomor: ${o.order_number}\nTotal: Rp${o.total.toLocaleString()}\nStatus: ${o.status}`);
          } else {
            resolve('📦 Anda belum memiliki pesanan.');
          }
        }, 500);
      });
    }

    // Default response for unrecognized commands
    return null;
  }

  async sendMessage(to, message) {
    if (!this.isConnected) {
      throw new Error('Bot belum terhubung ke WhatsApp');
    }
    await this.client.sendMessage(to, message);
  }

  getWASocket() {
    return this.client;
  }
}