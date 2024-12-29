import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";

const AboutPage = () => {
  const [authors, setAuthors] = useState("Loading...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/authors/") 
      .then((response) => response.json())
      .then((data) => setAuthors(data.message))
      .catch((error) => {
        console.error("Error", error);
        setAuthors("");
      });
  }, []);

  return (
    <Container className="my-4">
      <h2>Aplikacja napisana przez :</h2>
      <p>{authors}</p>
      <p>Technologie : Python + React</p>
    </Container>
  );
};

export default AboutPage;
