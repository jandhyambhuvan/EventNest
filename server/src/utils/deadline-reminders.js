import { Event } from '../models/index.js';
import { notifyAllActiveUsers } from './notify.js';

// Notify every signed-in role when an event registration deadline is approaching.
export function startDeadlineReminders() {
  let running = false;
  const check = async () => {
    if (running) return;
    running = true;
    try {
      const now = new Date();
      const oneHour = new Date(now.getTime() + 60 * 60 * 1000);
      const oneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const within24h = await Event.find({status:'published',registrationDeadline:{$gt:oneHour,$lte:oneDay},deadlineReminder24hSentAt:{$exists:false}});
      for (const event of within24h) {
        await notifyAllActiveUsers({event:event._id,title:'Registration deadline approaching',message:`Registration for “${event.title}” closes within 24 hours (${new Date(event.registrationDeadline).toLocaleString()}). Register before the deadline.`,category:'deadline'});
        event.deadlineReminder24hSentAt = new Date();
        await event.save();
      }
      const within1h = await Event.find({status:'published',registrationDeadline:{$gt:now,$lte:oneHour},deadlineReminder1hSentAt:{$exists:false}});
      for (const event of within1h) {
        await notifyAllActiveUsers({event:event._id,title:'Registration closes in 1 hour',message:`Registration for “${event.title}” closes at ${new Date(event.registrationDeadline).toLocaleString()}.`,category:'deadline'});
        event.deadlineReminder1hSentAt = new Date();
        await event.save();
      }
    } catch (error) {
      console.error('Deadline reminder check failed:', error.message);
    } finally { running = false; }
  };
  check();
  const timer = setInterval(check, 10 * 60 * 1000);
  timer.unref?.();
}
