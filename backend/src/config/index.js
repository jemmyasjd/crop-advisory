require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,

  db: {
    connectionString: process.env.DATABASE_URL,
    // Aiven serves a self-signed CA chain; require TLS but don't reject the chain.
    ssl:
      String(process.env.PGSSL).toLowerCase() === 'true'
        ? { rejectUnauthorized: false }
        : false,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
  },

  admin: {
    name: process.env.ADMIN_NAME || 'Administrator',
    email: process.env.ADMIN_EMAIL || 'admin@cropadvisory.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
  },
};

module.exports = config;
