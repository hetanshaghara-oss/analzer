// Vercel serverless entry point (CommonJS).
// .cjs extension forces Node to treat this as CJS regardless of root "type":"module".
const { app, connectDB } = require('../server/index');

connectDB();

module.exports = app;
