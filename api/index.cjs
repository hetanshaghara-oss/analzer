// Vercel serverless entry point — pure CommonJS.
// Root package.json no longer has "type":"module" so .cjs and .js
// files are both treated as CommonJS by Node and Vercel.
const { app, connectDB } = require('../server/index');

connectDB();

module.exports = app;
