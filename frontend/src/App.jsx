import React from "react";
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AddReservation from "./AddReservation";
import TestPage from "./TestPage"; 
import AboutPage from "./AboutPage"; 

const App = () => {
  return (
    <Router>
      <div className="col-12">
        <nav className="p-3 navbar navbar-expand-lg">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/testowanie">Testowanie</Link>
            </li>
            <li className="nav-item"> 
              <Link className="nav-link" to="/aplikacja">O aplikacji</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<AddReservation />} />
          <Route path="/testowanie" element={<TestPage />} />
          <Route path="/aplikacja" element={<AboutPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
