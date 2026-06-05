import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API, { assetUrl } from "../api";
import { toast } from "react-toastify";
import { getCartKey, readCart, readStoredUser } from "../utils/auth";
import "../styles/ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [chatOpen, setChatOpen] = useState(false);
  const [isSquare, setIsSquare] = useState(true);
  const [houseArea, setHouseArea] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [wallHeight, setWallHeight] = useState("");
  const [windows, setWindows] = useState(0);
  const [doors, setDoors] = useState(0);
  const [stoneResult, setStoneResult] = useState(null);
  const [loadingStone, setLoadingStone] = useState(false);
  const currentUser = readStoredUser();
  const userCartKey = getCartKey(currentUser);

  useEffect(() => {
    API.get(`/products/${id}`)
      .then((r) => {
        setProduct(r.data);
        setVariant(r.data.variants?.[0] || null);
      })
      .catch(() => navigate("/products"));
  }, [id, navigate]);


  useEffect(() => {
    if (variant) {
      setQuantity(variant.quantity > 0 ? 1 : 0);
    }
  }, [variant]);

  const addToCart = () => {
    if (!variant) return toast.warning("Select a size.");
    if (variant.quantity === 0) return toast.warning("Out of stock.");
    if (quantity > variant.quantity)
      return toast.warning("Quantity exceeds available stock.");

    const storedCart = readCart(currentUser);

    const existingIndex = storedCart.findIndex(
      (i) =>
        i.productId === product.id && i.variantId === variant.id
    );

    if (existingIndex >= 0) {
      const newQty = storedCart[existingIndex].quantity + quantity;
      if (newQty > variant.quantity)
        return toast.warning("Quantity exceeds available stock.");

      storedCart[existingIndex].quantity = newQty;
    } else {
      storedCart.push({
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        size: variant.size,
        price: parseFloat(variant.price),
        image: variant.image,
        quantity: quantity,
      });
    }

    localStorage.setItem(userCartKey, JSON.stringify(storedCart));
    toast.success(`${product.name} added to cart.`);
    navigate("/cart");
  };

  const calculateStone = async () => {
    setLoadingStone(true);

    try {
      const payload = isSquare
        ? {
            isSquare: true,
            area: Number(houseArea),
            height: Number(wallHeight),
            windows: Number(windows) || 0,
            doors: Number(doors) || 0,
          }
        : {
            isSquare: false,
            length: Number(length),
            width: Number(width),
            height: Number(wallHeight),
            windows: Number(windows) || 0,
            doors: Number(doors) || 0,
          };

      const res = await API.post("/stone-ai/calculate", payload);
      setStoneResult(res.data.required_m2);
    } catch (err) {
      console.error(err);
      toast.error("Calculation failed. Please check the inputs.");
    }

    setLoadingStone(false);
  };

  if (!product) return <div>Loading...</div>;
  return (
    <div className="product-detail-page">
      <div className="row g-4">
        
        <div className="col-md-6">
          <img
            src={assetUrl(`uploads/products/${variant?.image || ""}`)}
            alt={product.name}
            className="product-image"
            onError={(e) => {
              e.currentTarget.src = "/images/hajar-arsali.png";
            }}
          />
        </div>

       
        <div className="col-md-6">
          <h3>{product.name}</h3>
          <p>{product.description}</p>

         
          <div className="mb-3">
            <label className="form-label">Size & Price</label>
            <select
              className="form-select"
              value={variant?.id || ""}
              onChange={(e) => {
                const v = (product.variants || []).find(
                  (x) => x.id === parseInt(e.target.value)
                );
                setVariant(v);
              }}
            >
              {(product.variants || []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.size} - ${v.price}
                </option>
              ))}
            </select>
          </div>

          
          {variant && (
            <p
              style={{
                fontWeight: "bold",
                color: variant.quantity > 0 ? "green" : "red",
              }}
            >
              {variant.quantity > 0
                ? `In stock: ${variant.quantity}`
                : "Out of stock"}
            </p>
          )}

         
          <div className="mb-3">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              className="form-control w-25"
              min="1"
              max={variant?.quantity || 0}
              disabled={!variant || variant.quantity === 0}
              value={quantity}
              onChange={(e) => {
                let v = Number(e.target.value);
                if (v < 1) v = 1;
                if (v > variant.quantity) v = variant.quantity;
                setQuantity(v);
              }}
            />
          </div>

          
          <div className="d-flex gap-2">
            <button
              className="btn btn-success"
              disabled={!variant || variant.quantity === 0}
              onClick={addToCart}
            >
              Add to Cart
            </button>

            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>
        </div>

        
        <div className="chatbox">
          {chatOpen ? (
            <div className="chatbox-panel">
              <div className="chatbox-header">
                Stone Quantity Calculator
                <button
                  className="chatbox-close"
                  onClick={() => setChatOpen(false)}
                >
                  x
                </button>
              </div>

              <div className="chatbox-body">
                <label>Is the house square?</label>
                <div className="chatbox-radio">
                  <label>
                    <input
                      type="radio"
                      checked={isSquare}
                      onChange={() => setIsSquare(true)}
                    />{" "}
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={!isSquare}
                      onChange={() => setIsSquare(false)}
                    />{" "}
                    No
                  </label>
                </div>

                {isSquare ? (
                  <>
                    <label>House Area (m2)</label>
                    <input
                      type="number"
                      value={houseArea}
                      onChange={(e) => setHouseArea(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <label>Length (m)</label>
                    <input
                      type="number"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                    />
                    <label>Width (m)</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                    />
                  </>
                )}

                <label>Wall Height (m)</label>
                <input
                  type="number"
                  value={wallHeight}
                  onChange={(e) => setWallHeight(e.target.value)}
                />

                <label>Windows</label>
                <input
                  type="number"
                  value={windows}
                  onChange={(e) => setWindows(e.target.value)}
                />

                <label>Doors</label>
                <input
                  type="number"
                  value={doors}
                  onChange={(e) => setDoors(e.target.value)}
                />

                <button
                  className="chatbox-btn"
                  onClick={calculateStone}
                  disabled={loadingStone}
                >
                  {loadingStone ? "Calculating..." : "Calculate"}
                </button>

                {stoneResult !== null && (
                  <div className="chatbox-result">
                    <span>Required Stone Quantity</span>
                    <strong>{stoneResult} m2</strong>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              className="chatbox-toggle"
              onClick={() => setChatOpen(true)}
            >
              Calc
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
