import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const Calendar = () => {
  const [reservations, setReservations] = useState([]);
  const BASE_URL = "http://127.0.0.1:8000";

  const fetchReservations = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${BASE_URL}/reservations/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      setReservations(response.data);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchReservations, 5000); // Odśwież co 5 sekund
    return () => clearInterval(interval);
  }, []);
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
  ];

  const dayNames = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

  const days = [];
  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const firstDay = firstDayOfMonth(date);
  const totalDays = daysInMonth(date);

  for (let i = 0; i < firstDay; i++) {
    days.push(<td key={`empty-${i}`} className="calendar-day empty"></td>);
  }

  for (let i = 1; i <= totalDays; i++) {
    const day = new Date(date.getFullYear(), date.getMonth(), i);
    const hasReservation = reservations.some(reservation => {
        const dayTime = day.getTime();
        const parseDate = (dateString) => {
            return new Date(dateString).getTime();
        };
        const reservationStart = parseDate(reservation.start_time);
        const reservationEnd = parseDate(reservation.end_time);
        return dayTime >= reservationStart && dayTime < reservationEnd + 86400000;
    });
    days.push(
      <td key={i} className={`calendar-day ${hasReservation ? 'reserved' : ''}`}>
        {i}
        {hasReservation && (
          <div className="reservation-details">
            {reservations.filter(reservation => {
                const dayTime = day.getTime();
                const parseDate = (dateString) => {
                    return new Date(dateString).getTime();
                };
                const reservationStart = parseDate(reservation.start_time);
                const reservationEnd = parseDate(reservation.end_time);
                return dayTime >= reservationStart && dayTime < reservationEnd + 86400000;
            }).map((reservation, index) => (
              <div key={index} className="reservation-item">
                <div>{reservation.resource}</div>
                <div>{reservation.user}</div>
              </div>
            ))}
          </div>
        )}
      </td>
    );
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(<tr key={i}>{days.slice(i, i + 7)}</tr>);
  }

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button onClick={prevMonth}>&lt;</button>
        <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
        <button onClick={nextMonth}>&gt;</button>
      </div>
      <table className="calendar-table">
        <thead>
          <tr>
            {dayNames.map(day => <th key={day}>{day}</th>)}
          </tr>
        </thead>
        <tbody>
          {weeks}
        </tbody>
      </table>
    </div>
  );
};

export default Calendar;
