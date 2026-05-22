const jwt = require('jsonwebtoken');
const { z } = require('zod');

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

function signToken(user) {
  const secret = process.env.JWT_SECRET || 'dev';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(user, secret, { expiresIn });
}

async function login(req, res, next) {
  try {
    const body = loginSchema.parse(req.body);

    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

    const ok = body.username === adminUser && body.password === adminPass;
    if (!ok) {
      return res.status(401).json({ error: 'InvalidCredentials', message: 'Usuario o contraseña inválidos' });
    }

    const user = { username: adminUser, role: 'admin' };
    const token = signToken(user);

    return res.json({ token, user });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res) {
  // req.user set by auth middleware
  return res.json({ user: req.user });
}

module.exports = { login, me };
