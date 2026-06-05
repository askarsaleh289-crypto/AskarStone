import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { assetUrl } from "../api";
import { toast } from "react-toastify";
import { clearCart, readCart, readStoredUser } from "../utils/auth";
import "../styles/checkout.css";

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [details, setDetails] = useState("");

  const navigate = useNavigate();
 useEffect(() => {
  const currentUser = readStoredUser();
  const c = readCart(currentUser);


  if (!Array.isArray(c) || c.length === 0) {
    navigate("/products");
    return;
  }

  setCart(c);
  setTotal(
    c.reduce((sum, it) => sum + it.price * (it.quantity || 1), 0)
  );
}, [navigate]);

  const isValidLebanesePhone = (p) => {
    const regex = /^(03|70|71|76|78|79|81)\d{6}$/;
    return regex.test(p);
  };

  const createOrder = async () => {

    if (!phone.trim()) {
      toast.warning("Please enter your phone number.");
      return;
    }

    if (!isValidLebanesePhone(phone)) {
      toast.warning("Invalid Lebanese phone number. Example: 03xxxxxx or 70xxxxxx.");
      return;
    }

    if (!city.trim()) {
      toast.warning("Please enter your city or village.");
      return;
    }

    if (!area.trim()) {
      toast.warning("Please enter your area or street.");
      return;
    }

    if (!details.trim()) {
      toast.warning("Please enter building and floor details for accurate delivery.");
      return;
    }

   
    const fullAddress = `${city} - ${area} - ${details}`;

    try {
      const payload = {
        cart: cart.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity || 1,
          size: i.size,
        })),
        total,
        phone,
        address: fullAddress,
      };

      const res = await API.post("/orders", payload);
      const { orderId } = res.data;

      clearCart(readStoredUser());

      toast.success("Order request submitted.");
      navigate(`/order/${orderId}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create order");
    }
  };

  
  if (!cart.length) {
    return (
      <div className="container mt-4">
        Your cart is empty.
      </div>
    );
  }

  return (
    <div className="container mt-4 checkout-container">
      <h3 className="mb-4">
        <span className="checkout-title">Checkout</span>
      </h3>

   
      <ul className="list-group mb-4">
        {cart.map((it, i) => (
          <li
            key={i}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div className="d-flex align-items-center">
              <img
                src={assetUrl(`uploads/products/${it.image}`)}
                alt={it.name}
                width="70"
                className="me-3 rounded"
                onError={(e) => {
                  e.currentTarget.src = "/images/hajar-arsali.png";
                }}
              />
              <div>
                <strong>{it.name}</strong>
                <div className="text-muted">
                  {it.size} - Qty: {it.quantity}
                </div>
              </div>
            </div>
            <div>
              ${(it.price * (it.quantity || 1)).toFixed(2)}
            </div>
          </li>
        ))}
      </ul>

 
      <h4 className="mb-4">
        Total: ${total.toFixed(2)}
      </h4>

   
      <div className="checkout-form">
        <input
          className="form-control mb-3"
          placeholder="Phone number (e.g. 03xxxxxx)"
          value={phone}
          maxLength={8}
          onChange={e =>
            setPhone(e.target.value.replace(/\D/g, ""))
          }
        />

        <input
          className="form-control mb-3"
          placeholder="City / Village"
          value={city}
          onChange={e => setCity(e.target.value)}
        />

        <input
          className="form-control mb-3"
          placeholder="Area / Street"
          value={area}
          onChange={e => setArea(e.target.value)}
        />

        <textarea
          className="form-control mb-4"
          placeholder="Building, floor, notes (required)"
          value={details}
          onChange={e => setDetails(e.target.value)}
          rows={3}
        />

        <button
          className="btn btn-success w-100"
          onClick={createOrder}
        >
          Submit Order Request
        </button>
      </div>
    </div>
  );
}
