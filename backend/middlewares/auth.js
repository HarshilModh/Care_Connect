import jwt from 'jsonwebtoken';

export const requireAuth = (req, _res, next) => {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return next(new Error('Missing access token'));
  try {
    const p = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    req.user = { _id: p._id, email: p.email, role: p.role };
    next();
  } catch {
    next(new Error('Invalid or expired access token'));
  }
};
