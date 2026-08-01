// Vercel serverless entry point — CommonJS.
// package.json no longer has "type":"module" so this .js file is CJS.
const { app, connectDB } = require('../server/index');

connectDB();

module.exports = app;
