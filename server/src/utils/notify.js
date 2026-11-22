import { Notification, User } from '../models/index.js';

export async function notifyUsers(userIds, { title, message, event, category = 'general' }) {
  const ids = [...new Set((userIds || []).filter(Boolean).map(String))];
  if (!ids.length) return;
  await Notification.insertMany(ids.map(user => ({ user, title, message, event, category })));
}

// Broadcast college-wide announcements (event created/updated/deadline changed).
export async function notifyEveryoneExcept(excludedUserId, payload) {
  const users = await User.find({ isActive: true, _id: { $ne: excludedUserId } }).select('_id').lean();
  await notifyUsers(users.map(user => user._id), payload);
}

export async function notifyAllActiveUsers(payload) {
  const users = await User.find({ isActive: true }).select('_id').lean();
  await notifyUsers(users.map(user => user._id), payload);
}
