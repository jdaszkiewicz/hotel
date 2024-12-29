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

  // Fetch reservations on component mount
  useEffect(() => {
    axios
      .get(`${BASE_URL}/reservations/`)
      .then((response) => {
        setReservations(response.data);
      })
      .catch((error) => {
        console.error("Error fetching reservations", error);
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
        alert("Reservation added successfully!");
        // After adding a reservation, fetch the updated list
        axios
          .get(`${BASE_URL}/reservations/`)
          .then((response) => {
            setReservations(response.data);
          })
          .catch((error) => {
            console.error("Error fetching reservations", error);
          });
      })
      .catch((error) => {
        console.error("Error adding reservation", error);
      });
  };

  return (
    <Container className="my-4">
      <h2 className="text-center mb-4">Add Reservation</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formResource">
          <Form.Label>Resource</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter resource"
            value={resource}
            onChange={(e) => setResource(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="formUser">
          <Form.Label>User</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter user"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="formStart">
          <Form.Label>Start Time</Form.Label>
          <Form.Control
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="formEnd">
          <Form.Label>End Time</Form.Label>
          <Form.Control
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </Form.Group>

        <Button variant="primary" type="submit" className="mt-3">
          Add Reservation
        </Button>
      </Form>

      <h3 className="mt-4">Reservation List</h3>
      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <th>Resource</th>
            <th>User</th>
            <th>Start Time</th>
            <th>End Time</th>
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
