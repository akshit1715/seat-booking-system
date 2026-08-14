# 🎟️ Event Seat Booking System

A full-stack seat booking application where admins set up events and users book seats — with concurrent booking prevention.

**Live Demo:**
- Frontend: https://seat-booking-system-peach.vercel.app
- Backend API: https://seat-booking-system-production-48c9.up.railway.app/docs

## Tech Stack
- **Frontend:** Next.js, Tailwind CSS — deployed on Vercel
- **Backend:** FastAPI (Python) — deployed on Railway
- **Database:** MySQL — hosted on Railway

## Features
- ✅ Admin creates events with custom seat layouts
- ✅ Visual seat map — color coded (available, selected, booked, blocked)
- ✅ Multi-seat booking with name and email
- ✅ Admin can block/unblock seats
- ✅ Admin dashboard with booking stats
- ✅ **Concurrent booking prevention** — SELECT FOR UPDATE + unique constraint

## How Concurrency is Handled
The most critical feature. When two users try to book the same seat simultaneously:

1. Both requests hit the `/booking/book` endpoint
2. MySQL `SELECT ... FOR UPDATE` locks the seat rows inside a transaction
3. Only one transaction can hold the lock — the other waits
4. First transaction checks availability, inserts booking, commits
5. Second transaction gets the lock, checks again — seat already booked
6. Returns `409 Conflict` — "One or more seats were just booked by someone else"
7. The unique constraint on `(event_id, seat_id)` acts as a final safety net

This ensures zero double-bookings even under high concurrency.

## Local Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
# Create .env with DB credentials
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database
MySQL with 3 tables: `events`, `seats`, `bookings`

## Design Decisions
- **MySQL over NoSQL** — ACID transactions essential for booking integrity
- **SELECT FOR UPDATE** — row-level locking prevents race conditions
- **Unique constraint** — database-level guarantee, catches edge cases
- **Atomic multi-seat booking** — all seats book or none do
- **FastAPI** — async support, automatic Swagger docs, Pydantic validation
