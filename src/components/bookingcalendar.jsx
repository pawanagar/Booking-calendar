import Calendar from "react-calendar";
import { useState, useEffect, useMemo } from "react";
import "react-calendar/dist/Calendar.css";

const STORAGE_KEY = "bookings";
const CATEGORY_OPTIONS = ["Meeting", "Focus", "Personal", "Event", "Travel"];

const formatLocalDate = (value) => {
  const dateValue = value instanceof Date ? value : new Date(value);
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value) => {
  if (value instanceof Date) return value;
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
};

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
            title: "Booked date",
            note: "",
            category: "Meeting",
            reminder: false,
          };
        }

        if (item && typeof item === "object" && typeof item.date === "string") {
          const title = typeof item.title === "string" && item.title.trim()
            ? item.title.trim()
            : typeof item.note === "string" && item.note.trim()
              ? item.note.trim()
              : "Booked date";

          return {
            id: item.id ?? `${item.date}-${title}`,
            date: item.date,
            title,
            note: item.note ?? "",
            category: item.category ?? "Meeting",
            reminder: Boolean(item.reminder),
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
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("Meeting");
  const [reminder, setReminder] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [showAll, setShowAll] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedDate = formatLocalDate(date);
  const todayIso = formatLocalDate(new Date());
  const selectedDateText = date.toDateString();
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

    const finalTitle = title.trim() || "Booked date";

    setBookings((prev) => [
      ...prev,
      {
        id: `${selectedDate}-${Date.now()}`,
        date: selectedDate,
        title: finalTitle,
        note: note.trim(),
        category,
        reminder,
      },
    ]);
    setTitle("");
    setNote("");
    setCategory("Meeting");
    setReminder(false);
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

  const removePastBookings = () => {
    if (bookings.length === 0) return;
    if (window.confirm("Remove past bookings?")) {
      setBookings((prev) => prev.filter((booking) => booking.date >= todayIso));
    }
  };

  const bookedDates = useMemo(
    () => new Set(bookings.map((booking) => booking.date)),
    [bookings]
  );

  const bookedCountMap = useMemo(() => {
    const countMap = new Map();
    bookings.forEach((booking) => {
      countMap.set(booking.date, (countMap.get(booking.date) || 0) + 1);
    });
    return countMap;
  }, [bookings]);

  const upcomingBookings = useMemo(
    () => bookings.filter((booking) => booking.date >= todayIso),
    [bookings, todayIso]
  );

  const filteredBookings = useMemo(() => {
    const base = showAll ? bookings : upcomingBookings;
    const query = searchTerm.trim().toLowerCase();

    if (!query) return base;

    return base.filter((booking) => {
      const haystack = `${booking.title} ${booking.note} ${booking.category}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [bookings, searchTerm, showAll, upcomingBookings]);

  const nextBooking = useMemo(() => {
    const sorted = [...bookings].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.find((booking) => booking.date >= todayIso) ?? null;
  }, [bookings, todayIso]);

  return (
    <div className="booking-calendar">
      <div className="booking-hero">
        <div>
          <p className="eyebrow">Smart scheduling</p>
          <h1>Plan your month with confidence</h1>
          <p>Reserve dates, add context, and keep every booking easy to review.</p>
        </div>
        <div className="hero-badges">
          <span>{bookings.length} booked</span>
          <span>{upcomingBookings.length} upcoming</span>
        </div>
      </div>

      <div className="booking-top">
        <div className="calendar-card">
          <Calendar
            onChange={setDate}
            value={date}
            tileClassName={({ date: tileDate, view }) =>
              view === "month" && bookedDates.has(formatLocalDate(tileDate))
                ? "booked"
                : null
            }
            tileContent={({ date: tileDate, view }) => {
              if (view !== "month") return null;
              const count = bookedCountMap.get(formatLocalDate(tileDate));
              return count ? <span className="calendar-badge">{count}</span> : null;
            }}
            tileDisabled={({ date: tileDate, view }) =>
              view === "month" && formatLocalDate(tileDate) < todayIso
            }
          />
        </div>

        <div className="booking-summary">
          <div className="summary-chip-row">
            <span className="summary-chip">Selected: {selectedDateText}</span>
            <span className={`summary-chip status ${isPastDate ? "past" : "good"}`}>
              {isPastDate ? "Past date" : alreadyBooked ? "Booked" : "Available"}
            </span>
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
            <label htmlFor="booking-title">Title</label>
            <input
              id="booking-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Client review"
            />
          </div>

          <div className="booking-input">
            <label htmlFor="booking-note">Notes</label>
            <textarea
              id="booking-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a quick note or reminder"
              rows={3}
            />
          </div>

          <div className="booking-input booking-inline-fields">
            <div>
              <label htmlFor="booking-category">Category</label>
              <select
                id="booking-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <label className="toggle-row">
              <input
                type="checkbox"
                checked={reminder}
                onChange={(event) => setReminder(event.target.checked)}
              />
              <span>Reminder</span>
            </label>
          </div>

          <div className="booking-actions">
            <button
              className="btn booking-btn booking-btn-primary"
              onClick={bookDate}
              disabled={isPastDate || alreadyBooked}
              type="button"
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

          <div className="booking-stats">
            <div>
              <strong>{bookings.length}</strong>
              <span>Total</span>
            </div>
            <div>
              <strong>{upcomingBookings.length}</strong>
              <span>Upcoming</span>
            </div>
            <div>
              <strong>{nextBooking ? new Date(nextBooking.date).toDateString() : "—"}</strong>
              <span>Next</span>
            </div>
          </div>
        </div>
      </div>

      <div className="booking-list-card">
        <div className="booking-list-header">
          <div>
            <h3>Booked Dates</h3>
            <p>{filteredBookings.length} visible</p>
          </div>

          <div className="booking-toolbar">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search bookings"
            />
            <div className="booking-filter">
              <button
                className={showAll ? "filter-btn active" : "filter-btn"}
                onClick={() => setShowAll(true)}
                type="button"
              >
                All
              </button>
              <button
                className={!showAll ? "filter-btn active" : "filter-btn"}
                onClick={() => setShowAll(false)}
                type="button"
              >
                Upcoming
              </button>
            </div>
          </div>
        </div>

        <ul className="booking-list">
          {filteredBookings.length === 0 ? (
            <li className="booking-empty">No bookings match your current view.</li>
          ) : (
            filteredBookings.map((booking) => (
              <li key={booking.id} className="booking-list-item">
                <div className="booking-list-main">
                  <div className="booking-title-row">
                    <span className="booking-date">{parseLocalDate(booking.date).toDateString()}</span>
                    <span className={`booking-badge ${booking.category?.toLowerCase() || "meeting"}`}>
                      {booking.category || "Meeting"}
                    </span>
                  </div>
                  <div className="booking-list-content">
                    <h4>{booking.title || "Booked date"}</h4>
                    {booking.note && <p className="booking-note">{booking.note}</p>}
                    {booking.reminder && <p className="reminder-pill">Reminder set</p>}
                  </div>
                </div>
                <button
                  className="btn booking-btn booking-btn-danger"
                  onClick={() => deleteBooking(booking.id)}
                  type="button"
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>

        {bookings.length > 0 && (
          <div className="booking-actions secondary-actions">
            <button className="btn booking-btn booking-btn-secondary" onClick={clearBookings} type="button">
              Clear All
            </button>
            <button className="btn booking-btn booking-btn-secondary" onClick={removePastBookings} type="button">
              Remove Past
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingCalendar;
