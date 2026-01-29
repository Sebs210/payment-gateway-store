export default () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'payment_store',
  },
  paymentGateway: {
    apiUrl: process.env.PAYMENT_GATEWAY_API_URL || 'https://api-sandbox.co.uat.wompi.dev/v1',
    publicKey: process.env.PAYMENT_GATEWAY_PUBLIC_KEY || 'pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7',
    privateKey: process.env.PAYMENT_GATEWAY_PRIVATE_KEY || 'prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg',
    integrityKey: process.env.PAYMENT_GATEWAY_INTEGRITY_KEY || 'stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp',
  },
});
