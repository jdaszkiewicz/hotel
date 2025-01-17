import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import axios from 'axios';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/register/', {
        username,
        email,
        password
      });
      setSuccess(true);
      setError('');
      setTimeout(() => {
        navigate('/logowanie');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.detail || 'Wystąpił błąd podczas rejestracji');
      setSuccess(false);
    }
  };

  return (
    <Container className="my-4">
      <h2 className="text-center mb-4">Rejestracja</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Rejestracja zakończona sukcesem! Przekierowywanie do logowania...</Alert>}
      <Form onSubmit={handleSubmit} className="form-container">
        <Form.Group controlId="formUsername" className="mb-3">
          <Form.Label>Nazwa użytkownika</Form.Label>
          <Form.Control
            type="text"
            placeholder="Wprowadź nazwę użytkownika"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="formEmail" className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="Wprowadź email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="formPassword" className="mb-3">
          <Form.Label>Hasło</Form.Label>
          <Form.Control
            type="password"
            placeholder="Wprowadź hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>

        <Button variant="primary" type="submit" className="w-100">
          Zarejestruj się
        </Button>
      </Form>
    </Container>
  );
};

export default RegisterPage;
