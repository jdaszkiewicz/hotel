import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Button, Container, Table } from "react-bootstrap";

const BASE_URL = "http://127.0.0.1:8000";

const AddReservation = () => {
  const [resource, setResource] = useState("");
  const [user, setUser] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/reservations/`)
      .then((response) => {
        setReservations(response.data);
      })
      .catch((error) => {
        console.error("Error", error);
      });
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();

    const data = {
      resource,
      user,
      start_time: start,
      end_time: end,
    };

    axios
      .post(`${BASE_URL}/reservations/`, data)
      .then((response) => {
        alert(response.data.message);
        axios
          .get(`${BASE_URL}/reservations/`)
          .then((response) => {
            setReservations(response.data);
          })
          .catch((error) => {
            console.error("Error", error);
          });
      })
      .catch((error) => {
        console.error("Error", error);
      });
  };

  return (
    <Container className="my-4">
      <h2 className="text-center mb-4">Dodaja rezerwacje</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formResource">
          <Form.Label>Pokoj</Form.Label>
          <Form.Control
            type="text"
            placeholder="Numer pokoju"
            value={resource}
            onChange={(e) => setResource(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="formUser">
          <Form.Label>E-mail</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter user"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="formStart">
          <Form.Label>Data rozpoczęcia</Form.Label>
          <Form.Control
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="formEnd">
          <Form.Label>Data zakończenia</Form.Label>
          <Form.Control
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </Form.Group>

        <Button variant="primary" type="submit" className="mt-3">
          Dodaj rezerwacje
        </Button>
      </Form>

      <h3 className="mt-4">Lista aktualnych rezerwacji</h3>
      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <th>Pokoj</th>
            <th>E-mail</th>
            <th>Data rozpoczęcia</th>
            <th>Data zakończenia</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((reservation, index) => (
            <tr key={index}>
              <td>{reservation.resource}</td>
              <td>{reservation.user}</td>
              <td>{reservation.start_time}</td>
              <td>{reservation.end_time}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default AddReservation;
