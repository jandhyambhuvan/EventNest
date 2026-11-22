# EventNest — College Student Event Management

A full-stack starter project for managing college club and department events, student registrations, fee payments, participation results, notifications and credit points. Built with **React + Vite**, **Node.js + Express**, and **MongoDB + Mongoose**.

## Main features

- Three role-specific login experiences and separate student, club and department dashboards. Student self-registration only; verified department and club accounts are provisioned by the college administrator.
- Student dashboard with separate future events and registered events views; filter by club/department.
- Club/department event creation and post-publication editing with date/time, venue, fee, capacity, deadline and base credits. Only the event owner can edit their event.
- College-wide notifications when events are published or updated; event registration notifications go to the student and the event organizer.
- Deadline reminders are automatically generated for all active accounts 24 hours and 1 hour before an event registration deadline. Changing a deadline resets its reminder schedule.
- Result publication notifies the student and organizer about placement, credit points and certificate availability. The profile credit balance refreshes automatically.
- Event registration with duplicate-registration and capacity checks.
- Free events are registered immediately. Paid events create a Razorpay order and confirm registration only after server-side signature verification. A signed webhook endpoint is also included.
- Organizers can view registered students and publish participation/placement results.
- Credit points are added to the student's account and notifications are created when results are published.
- Shared MongoDB data means event, registration, result and credit changes are visible across the relevant portals on refresh/API fetch.
- Notification inbox with unread counts, mark-all-read, and automatic refresh every 12 seconds.
- Click the EventNest brand in the top-left to return to the role-specific main dashboard. A bottom-right profile control shows the signed-in member details and student credit balance.
- PDF participation/achievement certificate download after the organizer publishes a result.
- Registered-event cards and event details show a clear **Registered** state instead of offering duplicate registration.
- Organizers can issue a per-student, single-use participation QR after recording the result. The QR token is random, stored only as a SHA-256 hash, expires after 15 minutes, and is bound to the registered student.
- Students have a camera-based QR scanner (plus manual token entry fallback). Successful scans set the registration to **Participated / QR verified**, notify the student and organizer, and show the status in the student profile and registered-event list.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Axios, Lucide icons |
| Backend | Node.js, Express, JWT, bcrypt, Zod |
| Database | MongoDB with Mongoose |
| Payments | Razorpay Orders + Checkout + HMAC verification (optional) |
| QR participation | `qrcode.react` (organizer QR display) + `html5-qrcode` (student camera scanner) |

## Requirements

- Node.js 20 or newer (18.18+ should also work)
- npm
- MongoDB Community Server locally, or a MongoDB Atlas connection string

## Setup

1. Extract this ZIP and open a terminal in the `campus-event-management` folder.
2. Install dependencies:

   ```bash
   npm install
   npm run install:all
   ```

3. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` and a strong random `JWT_SECRET`.
4. Start MongoDB locally, or paste your Atlas connection string into `MONGODB_URI`.
5. Start both frontend and backend:

   ```bash
   npm run dev
   ```

6. Open **http://localhost:5173**. API health check: **http://localhost:5000/api/health**.

### Windows PowerShell environment file

```powershell
Copy-Item server/.env.example server/.env
```

Edit `server/.env` using Notepad or VS Code. Keep `.env` private; it is ignored by Git.

## Role-based accounts and separate portals

- **Students** can create their own account from the Student portal. The public registration API always assigns the `student` role; a request cannot create a club or department account.
- **Departments** cannot self-register. Each department has a separate account provisioned by the college administrator.
- **Clubs** cannot self-register. Each club has its own separate account provisioned by the college administrator.
- After login, students land on the student event dashboard. Department and club users land on a different organizer overview and have a separate **Manage events** workspace.
- Organizers can only create events matching their own role (department accounts create department events; club accounts create club events), and can only manage events they own.

### Create each verified organizer account

First configure `server/.env`, install dependencies, and make sure MongoDB is running. Open a terminal in the `server` folder and run one command for each department or club. Replace the example names, emails and passwords with the actual credentials issued by your college:

```powershell
npm run create:organizer -- department "Computer Science Department" cse-admin@college.edu "ChangeThisPassword123!" "Computer Science"
npm run create:organizer -- department "Electronics Department" ece-admin@college.edu "ChangeThisPassword123!" "Electronics"
npm run create:organizer -- club "Coding Club" codingclub@college.edu "ChangeThisPassword123!" "Coding Club"
npm run create:organizer -- club "Cultural Club" culturalclub@college.edu "ChangeThisPassword123!" "Cultural Club"
```

The script stores passwords as bcrypt hashes in MongoDB, rejects duplicate email addresses, and does not expose organizer sign-up publicly. Use a unique strong password for every account and share credentials only with the authorized department/club representatives. The example credentials above are placeholders and must be changed before use.

## Razorpay setup (optional)

Free events work without payment credentials. To enable paid event checkout:

1. Create a Razorpay account and use **Test Mode** first.
2. Add the test `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `server/.env`.
3. Configure a Razorpay webhook pointing to `https://YOUR_PUBLIC_API_HOST/api/webhooks/razorpay`, subscribe to `payment.captured`, and set `RAZORPAY_WEBHOOK_SECRET` to the webhook secret.
4. For local webhook testing, expose the backend with a secure tunnel and configure that tunnel URL in Razorpay.
5. Never put the Razorpay secret or webhook secret in the React app or commit them to Git.

The checkout handler verifies the payment signature on the backend before confirming the registration. The webhook independently verifies its signature. In production, also reconcile payment status against Razorpay APIs, add idempotency handling and configure HTTPS.

## Core API routes

All protected routes require `Authorization: Bearer <JWT>`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public (student only) | Student signup |
| POST | `/api/auth/login` | Public | Login with role selection |
| GET | `/api/auth/me` | All roles | Current profile |
| GET | `/api/events` | All roles | Published events |
| POST | `/api/events` | Club/department | Create event matching organizer role |
| GET | `/api/events/mine/created` | Club/department | Organizer's events |
| GET | `/api/events/:id/attendees` | Event organizer | Registered students |
| POST | `/api/registrations/:eventId` | Student | Register or create payment order |
| POST | `/api/registrations/payment/verify` | Student | Verify checkout signature |
| GET | `/api/registrations/mine` | Student | Registered events in date order, including participation verification state |
| POST | `/api/registrations/:registrationId/participation-qr` | Event organizer | Issue a 15-minute one-time participation QR after publishing a result |
| POST | `/api/registrations/participation/verify` | Student | Verify a QR token and mark the student as participated |
| GET | `/api/registrations/:registrationId/certificate` | Student | Download issued PDF certificate |
| POST | `/api/registrations/:registrationId/result` | Event organizer | Publish result and award credits |
| GET | `/api/notifications` | All roles | Notifications |
| PATCH | `/api/notifications/:id/read` | Owner | Mark notification read |

## Credit policy in this starter

The organizer chooses the final points while publishing the result. Participation QR verification is a separate step: publishing the result records attendance eligibility, and the student must scan the organizer-issued QR to make the profile show **Participated (QR verified)**. If the API receives no explicit `credits`, its defaults are: participant = event base credits, third = 1.5×, second = 2×, first = 3×, winner = base credits, not_awarded = 0. The organizer screen prompts for the final points so the college can follow its own credit policy. Re-publishing a result adjusts the student's total by the difference, avoiding duplicate credit addition.

## Project structure

```text
campus-event-management/
├── client/                 # React frontend
│   └── src/pages/           # Login, registration, dashboard, event, organizer
├── server/                 # Express API
│   └── src/
│       ├── config/          # MongoDB connection
│       ├── middleware/      # JWT auth and role access
│       ├── models/          # User, Event, Registration, Notification
│       └── routes/          # API routes
└── README.md
```

## Important production hardening before college-wide deployment

This is a working academic-project foundation, not a security-audited production system. Before real deployment: add admin UI and approval workflows, email/college-domain verification, password reset, stronger audit logs, organizer account provisioning, pagination/search, event image upload, automated tests, payment reconciliation/refunds, backups, HTTPS, monitoring, and privacy/retention policies. Add a scheduled refresh or WebSocket/SSE layer if dashboards must update live without refreshing. Current screens fetch shared database state on page load and after relevant actions.

## Frontend visual refresh

The public home page now introduces EventNest before sign-in, with an editorial dark-first landing page inspired by the supplied Gymtoo Dribbble reference: bold typography, lime accent, event preview panel, bento-style platform highlights and three role-specific entry points. The Login page presents Student, Department and Club portals before showing the existing authentication form. A persistent Dark/Bright theme toggle is available on the landing page, login page and authenticated workspace. The frontend redesign does not change server routes, database schemas, or backend behavior.
