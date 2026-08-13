from fastapi import APIRouter, HTTPException
from database import get_connection
from models import BookingRequest

router = APIRouter()

@router.get("/events/{event_id}/seats")
def get_seat_map(event_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT s.id, s.row_num, s.col_num, s.is_blocked,
                   CASE WHEN b.id IS NOT NULL THEN 1 ELSE 0 END as is_booked
            FROM seats s
            LEFT JOIN bookings b ON s.id = b.seat_id
            WHERE s.event_id = %s
            ORDER BY s.row_num, s.col_num
        """, (event_id,))
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

@router.post("/book")
def book_seats(req: BookingRequest):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
     
        conn.start_transaction()

        
        format_strings = ','.join(['%s'] * len(req.seat_ids))
        cursor.execute(
            f"SELECT id, is_blocked FROM seats WHERE id IN ({format_strings}) FOR UPDATE",
            tuple(req.seat_ids)
        )
        seats = cursor.fetchall()


     
        for seat in seats:
            if seat['is_blocked']:
                conn.rollback()
                raise HTTPException(
                    status_code=409,
                    detail=f"Seat {seat['id']} is blocked and cannot be booked"
                )

        cursor.execute(
            f"SELECT seat_id FROM bookings WHERE seat_id IN ({format_strings}) AND event_id = %s",
            tuple(req.seat_ids) + (req.event_id,)
        )
        already_booked = cursor.fetchall()

        if already_booked:
            conn.rollback()
            raise HTTPException(
                status_code=409,
                detail=f"One or more seats are already booked. Please select different seats."
            )

      
        for seat_id in req.seat_ids:
            cursor.execute(
                "INSERT INTO bookings (event_id, seat_id, booker_name, booker_email) VALUES (%s, %s, %s, %s)",
                (req.event_id, seat_id, req.booker_name, req.booker_email)
            )

        conn.commit()
        return {"message": "Booking confirmed!", "seats_booked": req.seat_ids}

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        
        if "Duplicate entry" in str(e):
            raise HTTPException(
                status_code=409,
                detail="One or more seats were just booked by someone else. Please try again."
            )
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()