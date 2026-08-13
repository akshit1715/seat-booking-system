from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class CreateEventRequest(BaseModel):
    name: str
    event_date: date
    num_rows: int
    num_cols: int

class BookingRequest(BaseModel):
    event_id: int
    seat_ids: List[int]
    booker_name: str
    booker_email: str

class BlockSeatRequest(BaseModel):
    seat_id: int
    is_blocked: bool