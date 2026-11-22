import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
const [role, name, email, password, organizationName] = process.argv.slice(2);
if (!['department', 'club'].includes(role) || !name || !email || !password || password.length < 8) {
  console.error('Usage: npm run create:organizer -- <department|club> "Display name" email password "Department or club name"');
  process.exit(1);
}
if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error('Set MONGODB_URI and JWT_SECRET in server/.env first.');
  process.exit(1);
}
try {
  await mongoose.connect(process.env.MONGODB_URI);
  const normalizedEmail = email.toLowerCase();
  if (await User.findOne({ email: normalizedEmail })) throw new Error(`An account already exists for ${normalizedEmail}`);
  const record = { name, email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12), role, isActive: true,
    ...(role === 'department' ? { department: organizationName || name } : { clubName: organizationName || name }) };
  const user = await User.create(record);
  console.log(`Created verified ${role} account: ${user.email}`);
} catch (error) {
  console.error(`Could not create organizer account: ${error.message}`);
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
