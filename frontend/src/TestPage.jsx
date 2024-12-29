import React, { useState } from "react";
import axios from "axios";
import { Container, Button, Alert } from "react-bootstrap";

const TestPage = () => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleTest = () => {
    axios.get("http://127.0.0.1:8000/test-api")
      .then((response) => {
        setMessage(response.data.message);
        setError("");
      })
      .catch((err) => {
        setError("Error");
        setMessage("");
      });
  };

  return (
    <Container className="my-4">
      <h2 className="text-center">Testowanie API</h2>
      <Button variant="primary" onClick={handleTest} className="mt-3">
        Test API
      </Button>
      {message && <Alert variant="success" className="mt-3">{message}</Alert>}
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    </Container>
  );
};

export default TestPage;
