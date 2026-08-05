import Calendar from "react-calendar";
import { useState, useEffect, useMemo } from "react";
import "react-calendar/dist/Calendar.css";

const STORAGE_KEY = "bookings";

const parseStoredBookings = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (typeof item === "string") {
          return {
            id: `${item}-${item}`,
            date: item,
            note: "",
          };
        }

        if (item && typeof item === "object" && typeof item.date === "string") {
          return {
            id: item.id ?? `${item.date}-${item.note ?? ""}`,
            date: item.date,
            note: item.note ?? "",
          };
        }

        return null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

function BookingCalendar() {
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState("");
  const [bookings, setBookings] = useState([]);
  const [showAll, setShowAll] = useState(true);

  const selectedDate = date.toISOString().slice(0, 10);
  const todayIso = new Date().toISOString().slice(0, 10);
  const selectedDateText = new Date(selectedDate).toDateString();
  const isPastDate = selectedDate < todayIso;
  const alreadyBooked = bookings.some((booking) => booking.date === selectedDate);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setBookings(parseStoredBookings(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }, [bookings]);

  const bookDate = () => {
    if (isPastDate) {
      alert("You cannot book a past date.");
      return;
    }

    if (alreadyBooked) {
      alert("This date is already booked!");
      return;
    }

    setBookings((prev) => [
      ...prev,
      {
        id: `${selectedDate}-${Date.now()}`,
        date: selectedDate,
        note: note.trim(),
      },
    ]);
    setNote("");
  };

  const deleteBooking = (bookingId) => {
    setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
  };

  const clearBookings = () => {
    if (bookings.length === 0) return;
    if (window.confirm("Remove all bookings?")) {
      setBookings([]);
    }
  };

  const bookedDates = useMemo(
    () => new Set(bookings.map((booking) => booking.date)),
    [bookings]
  );

  const upcomingBookings = useMemo(
    () => bookings.filter((booking) => booking.date >= todayIso),
    [bookings, todayIso]
  );

  const bookingsToShow = showAll ? bookings : upcomingBookings;

  const nextBooking = useMemo(() => {
    const sorted = [...bookings].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.find((booking) => booking.date >= todayIso) ?? null;
  }, [bookings, todayIso]);

  return (
    <div className="booking-calendar">
      <div className="booking-top">
        <div className="calendar-card">
          <Calendar
            onChange={setDate}
            value={date}
            tileClassName={({ date: tileDate, view }) =>
              view === "month" && bookedDates.has(tileDate.toISOString().slice(0, 10))
                ? "booked"
                : null
            }
            tileDisabled={({ date: tileDate, view }) =>
              view === "month" && tileDate.toISOString().slice(0, 10) < todayIso
            }
          />
        </div>

        <div className="booking-summary">
          <h2>Booking Summary</h2>

          <div className="booking-info">
            <p className="label">Selected Date</p>
            <p className="value">{selectedDateText}</p>
          </div>

          <div className="booking-info">
            <p className="label">Status</p>
            <p className="value">
              {isPastDate
                ? "Past date — cannot book"
                : alreadyBooked
                ? "Already booked"
                : "Available"}
            </p>
          </div>

          <div className="booking-input">
            <label htmlFor="booking-note">Add a note</label>
            <textarea
              id="booking-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="E.g. Meeting with client"
              rows={3}
            />
          </div>

          <div className="booking-actions">
            <button
              className="btn booking-btn booking-btn-primary"
              onClick={bookDate}
              disabled={isPastDate || alreadyBooked}
            >
              Book Now
            </button>
            <button
              className="btn booking-btn booking-btn-secondary"
              type="button"
              onClick={() => setDate(new Date())}
            >
              Today
            </button>
          </div>

          <div className="booking-meta">
            <p>
              <strong>{bookings.length}</strong> date{bookings.length === 1 ? "" : "s"} booked
            </p>
            <p>
              Next booking: <strong>{nextBooking ? new Date(nextBooking.date).toDateString() : "None"}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="booking-list-card">
        <div className="booking-list-header">
          <div>
            <h3>Booked Dates</h3>
            <p>{bookingsToShow.length} visible</p>
          </div>

          <div className="booking-filter">
            <button
              className={showAll ? "filter-btn active" : "filter-btn"}
              onClick={() => setShowAll(true)}
            >
              All
            </button>
            <button
              className={!showAll ? "filter-btn active" : "filter-btn"}
              onClick={() => setShowAll(false)}
            >
              Upcoming
            </button>
          </div>
        </div>

        <ul className="booking-list">
          {bookingsToShow.length === 0 ? (
            <li className="booking-empty">No booked dates yet.</li>
          ) : (
            bookingsToShow.map((booking) => (
              <li key={booking.id} className="booking-list-item">
                <div>
                  <span className="booking-date">{new Date(booking.date).toDateString()}</span>
                  {booking.note && <p className="booking-note">{booking.note}</p>}
                </div>
                <button
                  className="btn booking-btn booking-btn-danger"
                  onClick={() => deleteBooking(booking.id)}
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>

        {bookings.length > 0 && (
          <button className="btn booking-btn booking-btn-clear" onClick={clearBookings}>
            Clear All Bookings
          </button>
        )}
      </div>
    </div>
  );
}

export default BookingCalendar;
