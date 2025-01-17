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
      <h2 className="text-center mb-4">Testowanie API</h2>
      <Button 
        variant="primary" 
        onClick={handleTest} 
        className="button mt-3"
      >
        Testuj API
      </Button>
      {message && <div className="alert alert-success mt-3">{message}</div>}
      {error && <div className="alert alert-danger mt-3">{error}</div>}
    </Container>
  );
};

export default TestPage;
