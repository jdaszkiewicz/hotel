import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Button, Container, Table, Alert } from "react-bootstrap";
import Calendar from "./Calendar";

const BASE_URL = "http://127.0.0.1:8000";

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const AddReservation = () => {
  const [resource, setResource] = useState("");
  const [user, setUser] = useState(localStorage.getItem('username') || "");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [errors, setErrors] = useState({});
  const [reservations, setReservations] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log("No token found, redirecting to login");
      return;
    }

    axios
      .get(`${BASE_URL}/reservations/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'withCredentials': true
        }
      })
      .then((response) => {
        setReservations(response.data);
      })
      .catch((error) => {
        console.error("Error", error);
      });
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!resource.trim()) {
      newErrors.resource = 'Numer pokoju jest wymagany';
    }
    
    if (!user || !validateEmail(user)) {
      newErrors.user = 'Proszę podać poprawny adres email';
    }
    
    if (!start) {
      newErrors.start = 'Data rozpoczęcia jest wymagana';
    }
    
    if (!end) {
      newErrors.end = 'Data zakończenia jest wymagana';
    }
    
    if (start && end && new Date(start) >= new Date(end)) {
      newErrors.date = 'Data zakończenia musi być późniejsza niż data rozpoczęcia';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.post(`${BASE_URL}/reservations/`, {
        resource,
        start_time: start,
        end_time: end
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Pobierz zaktualizowane rezerwacje
      const response = await axios.get(`${BASE_URL}/reservations/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      setReservations(response.data);
      alert("Rezerwacja dodana pomyślnie!");
      
      // Reset form
      setResource("");
      setStart("");
      setEnd("");
    } catch (error) {
      console.error("Error", error);
      alert("Wystąpił błąd podczas dodawania rezerwacji");
    }
  };

  console.log("Reservations:", reservations);
  return (
    <Container className="my-4">
      <h2 className="text-center mb-4">Dodaj rezerwację</h2>
      <Form onSubmit={handleSubmit} className="form-container">
        {errors.date && <Alert variant="danger" className="mb-3">{errors.date}</Alert>}
        
        <Form.Group controlId="formResource" className="mb-3">
          <Form.Label>Pokój</Form.Label>
          <Form.Control
            type="text"
            placeholder="Numer pokoju"
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            isInvalid={!!errors.resource}
            className="form-input"
          />
          <Form.Control.Feedback type="invalid">
            {errors.resource}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="formUser" className="mb-3">
          <Form.Label>E-mail</Form.Label>
          <Form.Control
            type="email"
            placeholder="E-mail użytkownika"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            isInvalid={!!errors.user}
            className="form-input"
          />
          <Form.Control.Feedback type="invalid">
            {errors.user}
          </Form.Control.Feedback>
        </Form.Group>

        <div className="date-inputs">
          <Form.Group controlId="formStart" className="mb-3">
            <Form.Label>Data rozpoczęcia</Form.Label>
            <Form.Control
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              isInvalid={!!errors.start}
              className="form-input"
            />
            <Form.Control.Feedback type="invalid">
              {errors.start}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group controlId="formEnd" className="mb-3">
            <Form.Label>Data zakończenia</Form.Label>
            <Form.Control
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              isInvalid={!!errors.end}
              className="form-input"
            />
            <Form.Control.Feedback type="invalid">
              {errors.end}
            </Form.Control.Feedback>
          </Form.Group>
        </div>

        <Button 
          type="submit" 
          className="button mt-3"
        >
          Dodaj rezerwację
        </Button>
      </Form>
      
      <style>{`
        .form-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .form-input {
          padding: 0.75rem;
          border-radius: 4px;
          border: 1px solid #ddd;
          transition: border-color 0.2s;
        }
        
        .form-input:focus {
          border-color: #3498db;
          box-shadow: 0 0 0 0.2rem rgba(52,152,219,0.25);
        }
        
        .date-inputs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        
        @media (max-width: 768px) {
          .form-container {
            padding: 1rem;
          }
          
          .date-inputs {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="calendar-section mt-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Kalendarz rezerwacji</h3>
          <Button 
            variant="outline-primary" 
            onClick={() => setShowCalendar(!showCalendar)}
            className="button button--outline"
          >
            {showCalendar ? 'Ukryj kalendarz' : 'Pokaż kalendarz'}
          </Button>
        </div>
        
        {showCalendar && (
          <div className="calendar-wrapper">
            <Calendar />
          </div>
        )}
      </div>

      <style>{`
        .calendar-section {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .calendar-wrapper {
          margin-top: 1rem;
          overflow-x: auto;
        }
        
        @media (max-width: 768px) {
          .calendar-section {
            padding: 1rem;
          }
          
          .toggle-calendar-btn {
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
          }
        }
      `}</style>

      <div className="reservations-container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Lista aktualnych rezerwacji</h3>
          <input
            type="text"
            className="form-control search-input"
            placeholder="Szukaj rezerwacji..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="table-responsive">
          <Table striped bordered hover className="reservations-table">
            <thead>
              <tr>
                <th>Pokój</th>
                <th>E-mail</th>
                <th>Data rozpoczęcia</th>
                <th>Data zakończenia</th>
              </tr>
            </thead>
            <tbody>
              {reservations
                .filter(reservation => 
                  reservation.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  reservation.user.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((reservation, index) => (
                <tr key={index}>
                  <td className="resource-cell">{reservation.resource}</td>
                  <td className="email-cell">{reservation.user_email}</td>
                  <td className="date-cell">{new Date(reservation.start_time).toLocaleString()}</td>
                  <td className="date-cell">{new Date(reservation.end_time).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      <style>{`
        .reservations-container {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .search-input {
          max-width: 300px;
          border-radius: 20px;
          padding: 0.5rem 1rem;
        }
        
        .reservations-table {
          margin-top: 1rem;
        }
        
        .reservations-table th {
          background-color: #3498db;
          color: white;
          font-weight: 500;
          padding: 0.75rem;
        }
        
        .reservations-table td {
          padding: 0.5rem;
          vertical-align: middle;
        }
        
        .resource-cell {
          font-weight: 500;
          color: #2c3e50;
        }
        
        .email-cell {
          color: #3498db;
        }
        
        .date-cell {
          white-space: nowrap;
          color: #666;
        }
        
        .reservations-table tbody tr:hover {
          background-color: rgba(52, 152, 219, 0.05);
        }
        
        @media (max-width: 768px) {
          .reservations-container {
            padding: 1rem;
          }
          
          .search-input {
            max-width: 100%;
          }
          
          .reservations-table th,
          .reservations-table td {
            padding: 0.5rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </Container>
  );
};

export default AddReservation;
