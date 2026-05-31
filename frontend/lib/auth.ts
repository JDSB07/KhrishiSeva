import jwt from 'jsonwebtoken';
import User from './models/User';

export async function getUserFromReq(req: Request) {
  const authHeader = req.headers.get('authorization');
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_dev_key_123456');
    if (process.env.USE_MOCK_DB === 'true') {
      const { users } = require('./mockDb');
      const user = users.find((u: any) => u._id === decoded.id);
      return user || null;
    }
    const user = await User.findById(decoded.id);
    return user || null;
  } catch (error) {
    return null;
  }
}
