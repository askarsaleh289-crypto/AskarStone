import React from "react";
import { Link } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  return (
    <section
      className="luxury-hero"
      style={{
        backgroundImage: `
          linear-gradient(
            90deg,
            rgba(244,240,231,0.96) 0%,
            rgba(244,240,231,0.88) 42%,
            rgba(244,240,231,0.55) 60%,
            rgba(0,0,0,0.25) 100%
          ),
          url(${process.env.PUBLIC_URL}/images/hajar-arsali.png)
        `
      }}
    >
      <div className="hero-content">
        <h1>
          Askar <span>Stone</span>
        </h1>

        <p>
          Premium Arsali honey stone crafted from natural limestone,
          bringing warmth, durability, and timeless elegance to
          residential and commercial architecture.
        </p>

        <div className="hero-buttons">
          <Link to="/products" className="btn-gold">Shop Products</Link>
          <Link to="/projects" className="btn-outline">Our Projects</Link>
        </div>
      </div>
    </section>
  );
}
