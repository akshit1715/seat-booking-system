from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import admin, booking

app = FastAPI(title="Seat Booking System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(booking.router, prefix="/booking", tags=["Booking"])

@app.get("/")
def root():
    return {"message": "Seat Booking API is running"}