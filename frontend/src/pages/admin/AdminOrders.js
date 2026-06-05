import React, { useEffect, useState } from "react";
import API, { assetUrl } from "../../api";
import { toast } from "react-toastify";
import "../../styles/admin-orders.css";

const STATUS_META = {
  pending: { label: "PENDING", color: "warning" },
  confirmed: { label: "CONFIRMED", color: "success" },
  cancelled: { label: "CANCELLED", color: "danger" },
  expired: { label: "EXPIRED", color: "danger" }
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const r = await API.get("/orders");
      setOrders(r.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders.");
    }
  };

  const normalizeStatus = (status) => {
    return status;
  };

  const orderItemsCount = (order) =>
    (order.items || []).reduce((sum, it) => sum + Number(it.quantity || 0), 0);

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await API.delete(`/orders/${id}`);
      toast.success("Order deleted.");
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete order.");
    }
  };

  const confirmOrder = async (id) => {
    if (!window.confirm("Confirm this order and start preparing it?")) return;
    try {
      await API.post(`/orders/${id}/confirm`);
      toast.success("Order confirmed.");
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Failed to confirm order.");
    }
  };

  const cancelOrder = async (id) => {
    if (!window.confirm("Cancel this request and restore stock?")) return;
    try {
      await API.post(`/orders/${id}/cancel`);
      toast.success("Order cancelled.");
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel order.");
    }
  };

  const downloadInvoice = (id) => {
    window.open(assetUrl(`invoices/invoice-${id}.pdf`), "_blank");
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => normalizeStatus(o.status) === "pending").length;
  const confirmedOrders = orders.filter(o => normalizeStatus(o.status) === "confirmed").length;
  const cancelledOrders = orders.filter(o => ["cancelled", "expired"].includes(normalizeStatus(o.status))).length;

  const totalRevenue = orders
    .filter(o => normalizeStatus(o.status) === "confirmed")
    .reduce((s, o) => s + Number(o.total || 0), 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const ordersToday = orders.filter(o => o.created_at?.startsWith(todayStr));

  const revenueToday = ordersToday
    .filter(o => normalizeStatus(o.status) === "confirmed")
    .reduce((s, o) => s + Number(o.total || 0), 0);

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const ordersThisWeek = orders.filter(o => {
    const d = new Date(o.created_at);
    return d >= startOfWeek && d <= endOfWeek;
  });

  const revenueThisWeek = ordersThisWeek
    .filter(o => normalizeStatus(o.status) === "confirmed")
    .reduce((s, o) => s + Number(o.total || 0), 0);

  const filtered = orders
    .filter(o => {
      const status = normalizeStatus(o.status);
      if (statusFilter === "confirmed") return status === "confirmed";
      if (statusFilter === "pending") return status === "pending";
      if (statusFilter === "cancelled") return status === "cancelled" || status === "expired";
      return true;
    })
    .filter(o =>
      (o.customer_name || "").toLowerCase().includes(q.toLowerCase()) ||
      (o.customer_phone || "").includes(q)
    )
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="admin-page">
      <div className="admin-container admin-orders">
        <h3>Orders</h3>

        <div className="row mb-2">
          <StatCard title="Total Orders" value={totalOrders} color="primary" />
          <StatCard title="Today" value={ordersToday.length} color="info" />
          <StatCard title="This Week" value={ordersThisWeek.length} color="secondary" />
        </div>

        <button
          className="btn btn-sm btn-outline-dark mb-3"
          onClick={() => setShowStats(!showStats)}
        >
          {showStats ? "Hide Statistics" : "Show Statistics"}
        </button>

        {showStats && (
          <div className="row mb-4">
            <StatCard title="Pending" value={pendingOrders} color="warning" />
            <StatCard title="Confirmed" value={confirmedOrders} color="success" />
            <StatCard title="Cancelled" value={cancelledOrders} color="danger" />
            <StatCard title="Revenue Today" value={`$${revenueToday}`} color="success" />
            <StatCard title="Revenue This Week" value={`$${revenueThisWeek}`} color="dark" />
            <StatCard title="Total Revenue" value={`$${totalRevenue}`} color="primary" />
          </div>
        )}

        <input
          className="form-control mb-2"
          placeholder="Search by name or phone"
          value={q}
          onChange={e => setQ(e.target.value)}
        />

        <div className="order-filter-bar">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setStatusFilter("all")}>All</button>
          <button className="btn btn-sm btn-outline-warning" onClick={() => setStatusFilter("pending")}>Pending</button>
          <button className="btn btn-sm btn-outline-success" onClick={() => setStatusFilter("confirmed")}>Confirmed</button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => setStatusFilter("cancelled")}>Cancelled</button>
        </div>

        {filtered.map(o => {
          const status = normalizeStatus(o.status);
          const meta = STATUS_META[status] || STATUS_META.pending;

          return (
            <div key={o.id} className={`order-card ${status}`}>
              <div className="order-card-main">
                <div>
                  <strong>#{o.id}</strong> - {o.customer_name} - ${o.total}{" "}
                  <span className={`badge bg-${meta.color}`}>{meta.label}</span>
                </div>

                <div className="order-card-actions">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => setSelected(o)}>
                    View
                  </button>

                  {status === "confirmed" && (
                    <button className="btn btn-sm btn-outline-dark" onClick={() => downloadInvoice(o.id)}>
                      Invoice
                    </button>
                  )}

                  {status === "pending" && (
                    <>
                      <button className="btn btn-sm btn-success" onClick={() => confirmOrder(o.id)}>
                        Confirm
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => cancelOrder(o.id)}>
                        Cancel
                      </button>
                    </>
                  )}

                  {(status === "cancelled" || status === "expired") && (
                    <button className="btn btn-sm btn-danger" onClick={() => deleteOrder(o.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="text-muted mt-1">
                {orderItemsCount(o)} items - {o.customer_phone} - Delivery: {o.estimatedDelivery || "2-5 business days after confirmation"}
              </div>
            </div>
          );
        })}

        {selected && (
          <div className="order-modal-backdrop">
            <div className="order-modal">
              <div className="d-flex justify-content-between mb-2">
                <h5>Order #{selected.id}</h5>
                <button className="btn btn-sm btn-secondary" onClick={() => setSelected(null)}>
                  Close
                </button>
              </div>

              <p><strong>Name:</strong> {selected.customer_name}</p>
              <p><strong>Phone:</strong> {selected.customer_phone}</p>
              <p><strong>Address:</strong> {selected.customer_address}</p>
              <p><strong>Delivery:</strong> {selected.estimatedDelivery || "2-5 business days after admin confirmation"}</p>

              <hr />

              <h6>Items</h6>
              {selected.items?.map((it, i) => (
                <div key={i}>
                  {it.product_name} - {it.size || "-"} x {it.quantity} - ${it.price}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className="col-md-4 col-lg-3 mb-2">
      <div className={`card text-center border-${color}`}>
        <div className={`card-body text-${color}`}>
          <h6>{title}</h6>
          <h4 className="fw-bold">{value}</h4>
        </div>
      </div>
    </div>
  );
}
