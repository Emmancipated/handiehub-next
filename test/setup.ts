// @ts-nocheck
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";
process.env.JWT_EXPIRES_IN = "7d";
process.env.AUTH_COOKIE_NAME = "hh_session";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.PAYSTACK_SECRET_KEY = "sk_test_test123";
process.env.PAYSTACK_BASE_URL = "https://api.paystack.co";
