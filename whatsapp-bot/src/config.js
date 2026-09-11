import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT || 3000,
  WHATSAPP_SESSION: process.env.WHATSAPP_SESSION || 'whatsapp-bot',
};

export default CONFIG;