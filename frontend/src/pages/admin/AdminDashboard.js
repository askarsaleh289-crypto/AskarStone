import React, { useEffect, useState } from "react";
import API from "../../api";
import "../../styles/admin.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    projects: 0,
    orders: 0,
    messages: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const [p, pr, o, m] = await Promise.all([
          API.get("/products"),
          API.get("/projects"),
          API.get("/orders"),
          API.get("/messages"),
        ]);

        setStats({
          products: p.data.length,
          projects: pr.data.length,
          orders: o.data.length,
          messages: m.data.length,
        });
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-container">
        <h3>Admin Dashboard</h3>

        <div className="row g-3 mt-3">
          <div className="col-md-3">
            <div className="card p-3 admin-card">
              Products
              <h4>{stats.products}</h4>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 admin-card">
              Projects
              <h4>{stats.projects}</h4>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 admin-card">
              Orders
              <h4>{stats.orders}</h4>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 admin-card">
              Messages
              <h4>{stats.messages}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
