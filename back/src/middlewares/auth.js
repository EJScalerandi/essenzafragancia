const jwt = require('jsonwebtoken');

function getTokenFromHeader(req) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}

function authRequired(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing Bearer token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
}

/**
 * Optional auth: if Bearer token is present and valid, sets req.user.
 * If token is missing or invalid, continues without user context.
 */
function authOptional(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    req.user = decoded;
  } catch {
    // ignore invalid token for optional auth
  }
  return next();
}

function adminRequired(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing auth context' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Admin role required' });
  }
  return next();
}

module.exports = { authRequired, authOptional, adminRequired };
