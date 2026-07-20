// Defaults for tests that touch real infrastructure. Unit tests using an in-memory
// ConfigProvider ignore these.
process.env.NODE_ENV ??= 'test'
process.env.DATABASE_URL ??= 'postgresql://serviceuser:pass@localhost:5432/service_db_test'
process.env.JWT_PUBLIC_KEY ??= 'test-key'
