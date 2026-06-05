import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assetUrl } from "../api";
import { getCartKey, readCart, readStoredUser } from "../utils/auth";
import "../styles/Cart.css";

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);

  const currentUser = readStoredUser();
  const userCartKey = getCartKey(currentUser);

  useEffect(() => {
    setCart(readCart(currentUser));
  }, [userCartKey]);
  useEffect(() => {
  const syncCart = () => {
    setCart(readCart(currentUser));
  };

  
  window.addEventListener("storage", syncCart);
  window.addEventListener("focus", syncCart);

  return () => {
    window.removeEventListener("storage", syncCart);
    window.removeEventListener("focus", syncCart);
  };
}, [userCartKey]);


  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem(userCartKey, JSON.stringify(newCart));
  };

  const removeItem = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    saveCart(newCart);
  };

  const total = cart.reduce(
    (s, it) => s + it.price * (it.quantity || 1),
    0
  );

  return (
    <div className="cart-page">
      <div className="container mt-3">
        <h3>
          Your <span>Cart</span>
        </h3>

        {cart.length === 0 ? (
          <p>
            Your cart is currently empty.  
            Explore our premium collections to begin your order.
          </p>
        ) : (
          <>
            <ul className="list-group mb-3">
              {cart.map((it, idx) => (
                <li
                  key={idx}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center">
                    <img
                      src={assetUrl(`uploads/products/${it.image}`)}
                      alt={it.name}
                      width="70"
                      className="me-3"
                      onError={(e) => {
                        e.currentTarget.src = "/images/hajar-arsali.png";
                      }}
                    />
                    <div>
                      <div>
                        <strong>{it.name}</strong>
                      </div>
                      <div className="text-muted">
                        {it.size} - Qty: {it.quantity}
                      </div>
                    </div>
                  </div>

                  <div>
                    ${(it.price * (it.quantity || 1)).toFixed(2)}
                    <button
                      className="btn btn-sm btn-outline-danger ms-3"
                      onClick={() => removeItem(idx)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-muted">
              Premium natural stone - Precise sizing - Secure checkout
            </p>

            <div className="d-flex justify-content-between align-items-center">
              <h4>Estimated Order Total: ${total.toFixed(2)}</h4>

              <div>
                <button
                  className="btn btn-outline-secondary me-2"
                  onClick={() => navigate(-1)}
                >
                  Continue Shopping
                </button>

                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/checkout")}
                >
                  Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
