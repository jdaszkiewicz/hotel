import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import axios from 'axios';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/token/', {
        username,
        password,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      onLogin(response.data.access_token, username);
      navigate('/');
    } catch (error) {
      setError('Nieprawidłowa nazwa użytkownika lub hasło');
    }
  };

  return (
    <Container className="my-4">
      <h2 className="text-center mb-4">Logowanie</h2>
      {error && <Alert variant="danger">{error}</Alert>}
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
          Zaloguj się
        </Button>
      </Form>
    </Container>
  );
};

export default LoginPage;
