// Vercel serverless entry point — ESM wrapper around the CJS Express server.
// Root package.json has "type":"module" so this file is treated as ESM.
// We use createRequire to load the CommonJS server/index.js cleanly.
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const { app, connectDB } = require('../server/index');

connectDB();

export default app;
