# Database model overview

- **User**: name, email, bcrypt password hash, role (`student`, `club`, `department`), optional student/department/club identity and cumulative credits.
- **Event**: title, description, type (`club`, `department`), organizer reference, venue, start/end/deadline, capacity, fee, base credits and status.
- **Registration**: event/student references, registration and payment states, Razorpay order/payment IDs, result, credits awarded and certificate-issued flag, plus participation status (`not_marked`, `attended`, `verified`), a hashed QR token, expiry and one-time-use timestamp. A unique compound index on `(event, student)` prevents duplicate registrations. The QR token hash is indexed for quick validation and is never returned to clients.
- **Notification**: user reference, title/message, read state and optional event reference.

The registration-result endpoint updates the student's cumulative credit balance using the delta between the old and new award, so publishing a corrected result does not double count credits.


The organizer issues a random 256-bit QR token after publishing a result. Only the SHA-256 hash is stored in MongoDB. The token expires after 15 minutes and is invalidated after one successful scan by the student account associated with the registration.
