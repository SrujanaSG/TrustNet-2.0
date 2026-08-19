const cors = require('cors');

// Phase-1 security hardening (BACKLOG: "Lock CORS to explicit origin
// allowlist"). Reflecting `*` alongside `credentials: true` is both invalid
// per the CORS spec and a real security hole, so the wildcard fallback is
// removed. Allowed browser origins come from an explicit, comma-separated
// allowlist (ALLOWED_ORIGINS, falling back to CLIENT_URL for backward compat).
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsMiddleware = cors({
  origin(origin, callback) {
    // Requests with no Origin header are not browser cross-origin requests
    // (server-to-server, curl, same-origin, health checks, the test runner).
    // These are allowed through — CORS only governs browser cross-origin access.
    if (!origin) return callback(null, true);

    // No allowlist configured (local dev): stay permissive for the requesting
    // origin specifically — never reflect `*` while credentials are enabled.
    if (allowedOrigins.length === 0) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    return callback(new Error(`Origin ${origin} is not permitted by CORS.`));
  },
  credentials: true,
});

module.exports = corsMiddleware;
