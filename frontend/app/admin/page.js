'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ name: '', event_date: '', num_rows: 5, num_cols: 8 });
  const [message, setMessage] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = () => {
    fetch('http://127.0.0.1:8000/admin/events')
      .then(res => res.json())
      .then(setEvents);
  };

  const createEvent = async () => {
    const res = await fetch('http://127.0.0.1:8000/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, num_rows: parseInt(form.num_rows), num_cols: parseInt(form.num_cols) })
    });
    const data = await res.json();
    setMessage(data.message || 'Event created!');
    fetchEvents();
  };
    const toggleBlock = async (seat) => {
    await fetch('http://127.0.0.1:8000/admin/seats/block', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seat_id: seat.id, is_blocked: !seat.is_blocked })
    });
    fetchDashboard(selectedEvent);
  };

  const fetchDashboard = async (eventId) => {
  const [dashRes, seatsRes] = await Promise.all([
    fetch(`http://127.0.0.1:8000/admin/events/${eventId}/dashboard`),
    fetch(`http://127.0.0.1:8000/booking/events/${eventId}/seats`)
  ]);
  const dashData = await dashRes.json();
  const seatsData = await seatsRes.json();
  setDashboard({ ...dashData, seats: seatsData });
  setSelectedEvent(eventId);
};

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">⚙️ Admin Panel</h1>
          <Link href="/" className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
            ← Back to Events
          </Link>
        </div>

        {/* Create Event Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Event Name</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Tech Conference 2026" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Event Date</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Rows × Columns</label>
              <div className="flex gap-2">
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={form.num_rows} onChange={e => setForm({ ...form, num_rows: e.target.value })}
                  placeholder="Rows" min="1" max="20" />
                <span className="flex items-center">×</span>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={form.num_cols} onChange={e => setForm({ ...form, num_cols: e.target.value })}
                  placeholder="Cols" min="1" max="20" />
              </div>
            </div>
          </div>
          <button onClick={createEvent}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Create Event
          </button>
          {message && <p className="mt-2 text-green-600">{message}</p>}
        </div>

        {/* Events List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">All Events</h2>
          {events.length === 0 ? <p className="text-gray-500">No events yet.</p> : (
            <div className="grid gap-3">
              {events.map(event => (
                <div key={event.id} className="flex justify-between items-center border border-gray-100 rounded-lg p-4">
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-gray-500">📅 {event.event_date} | 💺 {event.num_rows}×{event.num_cols}</p>
                  </div>
                  <button onClick={() => fetchDashboard(event.id)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm">
                    View Dashboard
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Seat Map for Blocking */}
{selectedEvent && dashboard && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
    <h2 className="text-xl font-semibold mb-4">🚫 Block / Unblock Seats</h2>
    <p className="text-sm text-gray-500 mb-4">Click a seat to block or unblock it.</p>
    <div>
      {Object.entries(
        dashboard.seats
          ? dashboard.seats.reduce((acc, seat) => {
              if (!acc[seat.row_num]) acc[seat.row_num] = [];
              acc[seat.row_num].push(seat);
              return acc;
            }, {})
          : {}
      ).map(([rowNum, rowSeats]) => (
        <div key={rowNum} className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400 w-6">{rowNum}</span>
          {rowSeats.sort((a, b) => a.col_num - b.col_num).map(seat => (
            <button
              key={seat.id}
              onClick={() => toggleBlock(seat)}
              className={`w-10 h-10 rounded text-xs font-medium transition
                ${seat.is_booked ? 'bg-red-400 cursor-not-allowed' :
                  seat.is_blocked ? 'bg-gray-400 text-white hover:bg-gray-500' :
                  'bg-green-200 hover:bg-green-300'}`}
              disabled={seat.is_booked}
              title={seat.is_blocked ? 'Click to unblock' : 'Click to block'}
            >
              {seat.col_num}
            </button>
          ))}
        </div>
      ))}
    </div>
  </div>
)}

        {/* Dashboard */}
        {dashboard && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Dashboard — {dashboard.event.name}</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{dashboard.stats.total_seats}</p>
                <p className="text-sm text-gray-600">Total Seats</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{dashboard.stats.booked_seats}</p>
                <p className="text-sm text-gray-600">Booked</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-600">
                  {dashboard.stats.total_seats - dashboard.stats.booked_seats - dashboard.stats.blocked_seats}
                </p>
                <p className="text-sm text-gray-600">Available</p>
              </div>
            </div>
            <h3 className="font-semibold mb-3">Bookings</h3>
            {dashboard.bookings.length === 0 ? <p className="text-gray-500">No bookings yet.</p> : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Seat</th>
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.bookings.map(b => (
                    <tr key={b.id} className="border-b">
                      <td className="py-2">R{b.row_num}C{b.col_num}</td>
                      <td className="py-2">{b.booker_name}</td>
                      <td className="py-2">{b.booker_email}</td>
                      <td className="py-2">{new Date(b.booked_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </main>
  );
}