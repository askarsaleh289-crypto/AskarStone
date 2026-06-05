import React, { useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { isAdminUser, readStoredUser } from "../utils/auth";
import "../styles/Navbar.css";

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

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
  };

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

        <div className="navbar-collapse" id="navbarNav">

          {/* LEFT MENU */}
          <ul className="navbar-nav me-auto">

            {!isAdmin && (
              <>
                <li className="nav-item">
                  <NavLink to="/" className="nav-link">Home</NavLink>
                </li>

                <li className="nav-item">
                  <NavLink to="/about" className="nav-link">About</NavLink>
                </li>

                <li className="nav-item">
                  <NavLink to="/products" className="nav-link">Products</NavLink>
                </li>

                <li className="nav-item">
                  <NavLink to="/projects" className="nav-link">Projects</NavLink>
                </li>

                {isLoggedIn && (
                  <>
                    <li className="nav-item">
                      <NavLink to="/cart" className="nav-link">Cart</NavLink>
                    </li>

                    <li className="nav-item">
                      <NavLink to="/contact" className="nav-link">Contact</NavLink>
                    </li>
                  </>
                )}
              </>
            )}

            {isAdmin && (
              <>
                <li className="nav-item">
                  <NavLink to="/admin" className="nav-link">Dashboard</NavLink>
                </li>

                <li className="nav-item">
                  <NavLink to="/admin/products" className="nav-link">Products</NavLink>
                </li>

                <li className="nav-item">
                  <NavLink to="/admin/projects" className="nav-link">Projects</NavLink>
                </li>

                <li className="nav-item">
                  <NavLink to="/admin/messages" className="nav-link">Messages</NavLink>
                </li>

                <li className="nav-item">
                  <NavLink to="/admin/orders" className="nav-link">Orders</NavLink>
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