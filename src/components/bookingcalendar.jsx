import Calendar from "react-calendar";
import { useState, useEffect } from "react";
import "react-calendar/dist/Calendar.css";

function BookingCalendar() {
  const [date, setDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);

  const bookDate = () => {
    const selectedDate = date.toDateString();

    if (bookings.includes(selectedDate)) {
      alert("This date is already booked!");
      return;
    }

    setBookings((prev) => [...prev, selectedDate]);
  };

  const deleteBooking = (bookingToDelete) => {
    setBookings((prev) => prev.filter((booking) => booking !== bookingToDelete));
  };

  useEffect(() => {
    const stored = localStorage.getItem("bookings");
    if (stored) {
      setBookings(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("bookings", JSON.stringify(bookings));
  }, [bookings]);

  return (
    <div className="booking-calendar">
      <div className="booking-top">
        <div className="calendar-card">
          <Calendar onChange={setDate} value={date} />
        </div>

        <div className="booking-summary">
          <h2>Booking Summary</h2>
          <div className="booking-info">
            <p className="label">Selected Date</p>
            <p className="value">{date.toDateString()}</p>
          </div>
          <button className="btn booking-btn booking-btn-primary" onClick={bookDate}>
            Book Now
          </button>
        </div>
      </div>

      <div className="booking-list-card">
        <div className="booking-list-header">
          <h3>Booked Dates</h3>
          <p>{bookings.length} booked</p>
        </div>

        <ul className="booking-list">
          {bookings.length === 0 ? (
            <li className="booking-empty">No booked dates yet.</li>
          ) : (
            bookings.map((item, index) => (
              <li key={index} className="booking-list-item">
                <span>{item}</span>
                <button className="btn booking-btn booking-btn-danger" onClick={() => deleteBooking(item)}>
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export default BookingCalendar;