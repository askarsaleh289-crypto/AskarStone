import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api";
import "../styles/order-status.css";

export default function OrderStatus() {
  const { orderId } = useParams();
  const [order, setOrder] = useState({
    status: "pending",
    estimatedDelivery: "2-5 business days after admin confirmation"
  });

  useEffect(() => {
    let active = true;

    const fetchStatus = async () => {
      try {
        const res = await API.get(`/orders/${orderId}/status`);
        if (active) setOrder(res.data);
      } catch {
        if (active) setOrder(prev => ({ ...prev, status: "missing" }));
      }
    };

    fetchStatus();
    const timer = setInterval(fetchStatus, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [orderId]);

  const isConfirmed = order.status === "confirmed";
  const isCancelled = order.status === "cancelled" || order.status === "expired";

  return (
    <div className="order-status-page">
      <div className="order-status-panel">
        <div className={`order-status-badge ${order.status}`}>
          {isConfirmed ? "Confirmed" : isCancelled ? "Not approved" : "Waiting for admin"}
        </div>

        <h2>
          {isConfirmed
            ? "Your order is confirmed"
            : isCancelled
            ? "Your order was not approved"
            : "Your request was sent"}
        </h2>

        <p>
          {isConfirmed
            ? "The team has started preparing your stone order."
            : isCancelled
            ? "Please contact us or create a new request if you still need this order."
            : "An admin will review the order details, confirm availability, and then the team will start preparing it."}
        </p>

        <div className="order-status-details">
          <div>
            <span>Order</span>
            <strong>#{orderId}</strong>
          </div>
          <div>
            <span>Current status</span>
            <strong>{order.status}</strong>
          </div>
          <div>
            <span>Estimated delivery</span>
            <strong>{order.estimatedDelivery}</strong>
          </div>
          {order.transaction_id && (
            <div>
              <span>Confirmation reference</span>
              <strong>{order.transaction_id}</strong>
            </div>
          )}
        </div>

        <div className="order-status-actions">
          <Link to="/products" className="btn btn-outline-secondary">
            Continue shopping
          </Link>
          <Link to="/contact" className="btn btn-primary">
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
