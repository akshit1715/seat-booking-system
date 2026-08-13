'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function EventPage() {
  const { id } = useParams();
  const [seats, setSeats] = useState([]);
  const [event, setEvent] = useState(null);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({ name: '', email: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    const [seatsRes, eventRes] = await Promise.all([
      fetch(`https://seat-booking-system-production-48c9.up.railway.app/booking/events/${id}/seats`),
      fetch(`https://seat-booking-system-production-48c9.up.railway.app/admin/events`)
    ]);
    const seatsData = await seatsRes.json();
    const eventsData = await eventRes.json();
    setSeats(seatsData);
    setEvent(eventsData.find(e => e.id === parseInt(id)));
    setLoading(false);
  };

  const toggleSeat = (seat) => {
    if (seat.is_booked || seat.is_blocked) return;
    setSelected(prev =>
      prev.includes(seat.id)
        ? prev.filter(id => id !== seat.id)
        : [...prev, seat.id]
    );
  };

  const getSeatColor = (seat) => {
    if (seat.is_blocked) return 'bg-gray-400 cursor-not-allowed';
    if (seat.is_booked) return 'bg-red-400 cursor-not-allowed';
    if (selected.includes(seat.id)) return 'bg-blue-500 text-white cursor-pointer';
    return 'bg-green-200 hover:bg-green-300 cursor-pointer';
  };

  const bookSeats = async () => {
    if (selected.length === 0) { setMessage('Please select at least one seat.'); return; }
    if (!form.name || !form.email) { setMessage('Please enter your name and email.'); return; }
    setBooking(true);
    setMessage('');
    try {
      const res = await fetch('https://seat-booking-system-production-48c9.up.railway.app/booking/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: parseInt(id),
          seat_ids: selected,
          booker_name: form.name,
          booker_email: form.email
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Booking confirmed! ${selected.length} seat(s) booked successfully.`);
        setSelected([]);
        setForm({ name: '', email: '' });
        fetchData();
      } else {
        setMessage(`❌ ${data.detail}`);
      }
    } catch (e) {
      setMessage('❌ Something went wrong. Please try again.');
    }
    setBooking(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  // Group seats by row
  const rows = {};
  seats.forEach(seat => {
    if (!rows[seat.row_num]) rows[seat.row_num] = [];
    rows[seat.row_num].push(seat);
  });

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{event?.name}</h1>
            <p className="text-gray-500">📅 {event?.event_date}</p>
          </div>
          <Link href="/" className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
            ← Back
          </Link>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2"><div className="w-5 h-5 bg-green-200 rounded"></div> Available</div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 bg-blue-500 rounded"></div> Selected</div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 bg-red-400 rounded"></div> Booked</div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 bg-gray-400 rounded"></div> Blocked</div>
        </div>

        {/* Stage */}
        <div className="bg-gray-800 text-white text-center py-3 rounded-lg mb-6 text-sm tracking-widest">
          🎭 STAGE
        </div>

        {/* Seat Map */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          {Object.keys(rows).sort((a, b) => a - b).map(rowNum => (
            <div key={rowNum} className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-400 w-6 text-right">{rowNum}</span>
              <div className="flex gap-2 flex-wrap">
                {rows[rowNum].sort((a, b) => a.col_num - b.col_num).map(seat => (
                  <button
                    key={seat.id}
                    onClick={() => toggleSeat(seat)}
                    className={`w-10 h-10 rounded text-xs font-medium transition ${getSeatColor(seat)}`}
                    title={`Row ${seat.row_num}, Col ${seat.col_num}`}
                  >
                    {seat.col_num}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">
            Book Seats {selected.length > 0 && <span className="text-blue-600">({selected.length} selected)</span>}
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Your Name</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Akshit Shukla" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Your Email</label>
              <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="akshit@example.com" />
            </div>
          </div>
          <button onClick={bookSeats} disabled={booking}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {booking ? 'Booking...' : 'Confirm Booking'}
          </button>
          {message && (
            <p className={`mt-3 font-medium ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}