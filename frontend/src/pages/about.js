import React from "react";
import "../styles/about.css";

export default function About() {
  return (
    <section className="about">
      <div className="about-content">
        <h1>
          About <span>Askar Stone</span>
        </h1>

        <p className="about-intro">
          Founded in <strong>1990</strong>, Askar Stone specializes in premium
          Arsali honey stone crafted from natural limestone. With decades of
          experience, we focus on quality, durability, and timeless architectural
          elegance.
        </p>

        <div className="about-stats">
          <div>
            <strong>1990</strong>
            <span>Founded</span>
          </div>
          <div>
            <strong>30+</strong>
            <span>Years of Experience</span>
          </div>
          <div>
            <strong>Premium</strong>
            <span>Natural Stone</span>
          </div>
        </div>

        
        <div className="about-factory">
          <div className="about-factory-img">
            <img src="/images/askar.png" alt="Askar Stone Factory" />
          </div>

          <div className="about-factory-text">
            <h4>Crafted with Precision</h4>
            <p>
              Our production process is built on experience and attention to
              detail, ensuring consistent quality and accurate finishing for
              every project.
            </p>
          </div>
        </div>

        <div className="about-sections">
          <div>
            <h4>Our Story</h4>
            <p>
              What began in 1990 as a local stone operation has grown into a
              trusted name in natural stone craftsmanship, built on experience,
              consistency, and attention to detail.
            </p>
          </div>

          <div>
            <h4>Our Mission</h4>
            <p>
              To provide high-quality stone solutions that combine strength,
              refined aesthetics, and precise sizing for every project.
            </p>
          </div>

          <div>
            <h4>Why Askar Stone</h4>
            <p>
              Premium materials, accurate sizing, honest pricing, professional
              support
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
