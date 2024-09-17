import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jsonwebtoken from 'jsonwebtoken';
import { AppMember } from '../models/app-member.model';

const secret =
      process.env.JWT_SECRET ?? crypto.randomBytes(32).toString('hex')

export const encryptPw = async (plainTextPw: string) => {
  const encryptedPw = await bcrypt.hash(plainTextPw, await bcrypt.genSalt(11));

  return encryptedPw;
};

export const verifyPw = async (pwText: string, encryptedPw: string) => {
  return await bcrypt.compare(pwText.substring(0,Math.min(18, pwText.length)), encryptedPw);
};

export const generateToken = (user: AppMember) => {
  return jsonwebtoken.sign({
    id: user.userName,
    email: user.email,
    name: user.preferredName ?? `${user.firstName} ${user.lastName}`,
  }, secret, {
    // expiresIn: 86400 // 1 day expiration
  });
};
