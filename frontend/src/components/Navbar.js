import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { isAdminUser } from "../utils/auth";
import "../styles/Navbar.css";

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
    setMenuOpen(false);
  };

  const toggleMenu = () => setMenuOpen((s) => !s);
  const closeMenu = () => setMenuOpen(false);

  const isAdmin = user && isAdminUser(user);
  const isLoggedIn = !!user;

  return (
    <nav className="navbar navbar-expand-xl navbar-dark Gold-navbar">
      <div className="container">

        <Link className="navbar-brand" to="/">
          <img
            src="/images/60849bd0-ed72-47d7-a44d-68128c104534.png"
            alt="Askar Stone Logo"
            className="navbar-logo"
          />
          Askar Stone
        </Link>

        <button
          className="navbar-toggler"
          onClick={toggleMenu}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`navbar-collapse ${menuOpen ? "mobile-open" : ""}`}>

          <ul className="navbar-nav me-auto">

            <li className="nav-item">
              <NavLink to="/" className="nav-link" onClick={closeMenu}>Home</NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/about" className="nav-link" onClick={closeMenu}>About</NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/products" className="nav-link" onClick={closeMenu}>Products</NavLink>
            </li>

            {isLoggedIn && (
              <li className="nav-item">
                <NavLink to="/cart" className="nav-link" onClick={closeMenu}>Cart</NavLink>
              </li>
            )}
          </ul>

          <ul className="navbar-nav ms-auto">

            {isLoggedIn ? (
              <>
                <li className="nav-item">
                  <span className="nav-link">Hi, {user.name}</span>
                </li>

                <li className="nav-item">
                  <button className="btn btn-outline-light" onClick={logout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item me-2">
                  <Link className="btn btn-outline-light" to="/login">
                    Login
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="btn btn-light" to="/register">
                    Register
                  </Link>
                </li>
              </>
            )}

          </ul>

        </div>
      </div>
    </nav>
  );
}