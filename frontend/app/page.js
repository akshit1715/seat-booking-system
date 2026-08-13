'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://seat-booking-system-production-48c9.up.railway.app/admin/events')
      .then(res => res.json())
      .then(data => { setEvents(data); setLoading(false); });
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🎟️ Event Seat Booking</h1>
          <Link href="/admin" className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
            Admin Panel
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading events...</p>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No events yet.</p>
            <Link href="/admin" className="text-blue-600 underline mt-2 block">
              Create one from Admin Panel
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map(event => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer">
                  <h2 className="text-xl font-semibold text-gray-800">{event.name}</h2>
                  <p className="text-gray-500 mt-1">📅 {event.event_date}</p>
                  <p className="text-gray-500">💺 {event.num_rows} rows × {event.num_cols} seats</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}