import React, { useState, useEffect } from "react";
import './App.css';
import './css-tricks-styles.css';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import AddReservation from "./AddReservation";
import TestPage from "./TestPage";
import AboutPage from "./AboutPage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";

const App = () => {
  const [theme, setTheme] = useState('light');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = (token, username) => {
    console.log("Storing token:", token);
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    setIsAuthenticated(true);
    setUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && username) {
      setIsAuthenticated(true);
      setUser(username);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  return (
    <Router>
      <div className="col-12">
        <nav className="navbar">
          <div className="container">
            <a href="/" className="navbar-brand">Rezerwacje</a>
            <button className="menu-toggle" onClick={() => document.querySelector('.navbar-nav').classList.toggle('open')}>
              ☰
            </button>
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link className="nav-link" to="/">Strona główna</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/testowanie">Testowanie</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/aplikacja">O aplikacji</Link>
              </li>
              {isAuthenticated ? (
                <>
                  <li className="nav-item">
                    <button className="nav-link" onClick={handleLogout}>Wyloguj</button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/logowanie">Logowanie</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/rejestracja">Rejestracja</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={isAuthenticated ? <AddReservation /> : <Navigate to="/logowanie" />} />
          <Route path="/testowanie" element={<TestPage />} />
          <Route path="/aplikacja" element={<AboutPage />} />
          <Route path="/logowanie" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/rejestracja" element={<RegisterPage />} />
        </Routes>
      </div>
      <button className="theme-switcher" onClick={toggleTheme}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </Router>
  );
};

export default App;
