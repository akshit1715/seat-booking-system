from fastapi import APIRouter, HTTPException
from database import get_connection
from models import CreateEventRequest, BlockSeatRequest

router = APIRouter()

@router.post("/events")
def create_event(event: CreateEventRequest):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        
        cursor.execute(
            "INSERT INTO events (name, event_date, num_rows, num_cols) VALUES (%s, %s, %s, %s)",
            (event.name, event.event_date, event.num_rows, event.num_cols)
        )
        event_id = cursor.lastrowid

      
        for row in range(1, event.num_rows + 1):
            for col in range(1, event.num_cols + 1):
                cursor.execute(
                    "INSERT INTO seats (event_id, row_num, col_num) VALUES (%s, %s, %s)",
                    (event_id, row, col)
                )
        conn.commit()
        return {"message": "Event created", "event_id": event_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.get("/events")
def get_all_events():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM events")
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

@router.patch("/seats/block")
def block_seat(req: BlockSeatRequest):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE seats SET is_blocked = %s WHERE id = %s",
            (req.is_blocked, req.seat_id)
        )
        conn.commit()
        return {"message": "Seat updated"}
    finally:
        cursor.close()
        conn.close()

@router.get("/events/{event_id}/dashboard")
def get_dashboard(event_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
       
        cursor.execute("SELECT * FROM events WHERE id = %s", (event_id,))
        event = cursor.fetchone()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

       
        cursor.execute("""
            SELECT 
                COUNT(*) as total_seats,
                SUM(CASE WHEN is_blocked = 1 THEN 1 ELSE 0 END) as blocked_seats,
                SUM(CASE WHEN b.id IS NOT NULL THEN 1 ELSE 0 END) as booked_seats
            FROM seats s
            LEFT JOIN bookings b ON s.id = b.seat_id
            WHERE s.event_id = %s
        """, (event_id,))
        stats = cursor.fetchone()


   
        cursor.execute("""
            SELECT b.id, b.booker_name, b.booker_email, b.booked_at,
                   s.row_num, s.col_num
            FROM bookings b
            JOIN seats s ON b.seat_id = s.id
            WHERE b.event_id = %s
            ORDER BY b.booked_at DESC
        """, (event_id,))
        bookings = cursor.fetchall()

        return {
            "event": event,
            "stats": stats,
            "bookings": bookings
        }
    finally:
        cursor.close()
        conn.close()