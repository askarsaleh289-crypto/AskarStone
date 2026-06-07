import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { isAdminUser, readStoredUser } from "../utils/auth";
import "../styles/Navbar.css";

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const storedUser = readStoredUser();
    if (storedUser && !user) {
      setUser(storedUser);
    }
  }, [user, setUser]);

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

        {/* Brand */}
        <Link className="navbar-brand" to="/">
          <img
            src="/images/60849bd0-ed72-47d7-a44d-68128c104534.png"
            alt="Askar Stone Logo"
            className="navbar-logo"
          />
          Askar Stone
        </Link>

        <button
          className={`navbar-toggler ${menuOpen ? 'open' : ''}`}
          aria-controls="navbarNav"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
          onClick={toggleMenu}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`navbar-collapse ${menuOpen ? 'mobile-open' : ''}`} id="navbarNav" onClick={(e) => {
          // close when a link is clicked on small screens
          if (menuOpen) {
            const target = e.target.closest && e.target.closest('a');
            if (target) closeMenu();
          }
        }}>

          {/* LEFT MENU */}
          <ul className="navbar-nav me-auto">

            {!isAdmin && (
              <>
                <li className="nav-item">
                  <NavLink to="/" className="nav-link" onClick={closeMenu}>Home</NavLink>
                </li>

                <li className="nav-item">
                  <NavLink to="/about" className="nav-link" onClick={closeMenu}>About</NavLink>
                </li>

                <li className="nav-item">
                  <NavLink to="/products" className="nav-link" onClick={closeMenu}>Products</NavLink>
                </li>

                <li className="nav-item">
                  <NavLink to="/projects" className="nav-link" onClick={closeMenu}>Projects</NavLink>
                </li>

                {isLoggedIn && (
                  <>
                    <li className="nav-item">
                      <NavLink to="/cart" className="nav-link" onClick={closeMenu}>Cart</NavLink>
                    </li>

                    <li className="nav-item">
                      <NavLink to="/contact" className="nav-link" onClick={closeMenu}>Contact</NavLink>
                    </li>
                  </>
                )}
              </>
            )}

            {isAdmin && (
              <>
                <li className="nav-item">
                  <NavLink to="/admin" className="nav-link" onClick={closeMenu}>Dashboard</NavLink>
                </li>

                <li className="nav-item">
                  <NavLink to="/admin/products" className="nav-link" onClick={closeMenu}>Products</NavLink>
                </li>

                <li className="nav-item">
                  <NavLink to="/admin/projects" className="nav-link" onClick={closeMenu}>Projects</NavLink>
                </li>

                <li className="nav-item">
                  <NavLink to="/admin/messages" className="nav-link" onClick={closeMenu}>Messages</NavLink>
                </li>

                <li className="nav-item">
                  <NavLink to="/admin/orders" className="nav-link" onClick={closeMenu}>Orders</NavLink>
                </li>
              </>
            )}
          </ul>

          {/* RIGHT MENU */}
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
                  <Link className="btn btn-outline-light" to="/login" onClick={closeMenu}>
                    Login
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="btn btn-light" to="/register" onClick={closeMenu}>
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