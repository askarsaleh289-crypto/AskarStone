import React from "react";
import {
  FaWhatsapp,
  FaInstagram,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
} from "react-icons/fa";
import "../styles/footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand-text">
          Premium Natural Stone Solutions - Crafted with Precision, Built to
          Endure.
        </div>

        <div className="footer-info">
          <div className="footer-info-item">
            <FaMapMarkerAlt aria-hidden="true" />
            <div>
              <span>Our Stone Yard</span>
              Orsal, Bekaa Valley
              <br />
              Lebanon
            </div>
          </div>

          <div className="footer-info-item">
            <FaPhone aria-hidden="true" />
            <div>
              <span>Speak With Us</span>
              <a href="tel:71096407">+961 71 096 407</a>
            </div>
          </div>

          <div className="footer-info-item">
            <FaEnvelope aria-hidden="true" />
            <div>
              <span>Professional Inquiries</span>
              <a href="mailto:askarsaleh289@gmail.com">
                askarsaleh289@gmail.com
              </a>
            </div>
          </div>

          <div className="footer-info-item">
            <FaClock aria-hidden="true" />
            <div>
              <span>Working Hours</span>
              Monday - Saturday
              <br />
              8:00 AM - 6:00 PM
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-social">
            <a
              href="https://wa.me/96171096407"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
            >
              <FaWhatsapp />
            </a>

            <a
              href="https://www.instagram.com/askar_stone/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
          </div>

          <p className="footer-copy">
            &copy; 2025 <strong>Askar Stone</strong>
            <span>Stone Excellence for Timeless Architecture</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
