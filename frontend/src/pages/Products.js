import React, { useEffect, useState } from "react";
import API, { assetUrl } from "../api";
import { Link } from "react-router-dom";
import "../styles/Products.css";
export default function Products() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    API.get("/products").then(r => setProducts(r.data)).catch(e => console.error(e));
  }, []);

  const filtered = products.filter(p =>
    String(p.name || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="products-page">
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3><span>Products</span></h3>

        <input className="form-control w-50" placeholder="Search products..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="products-empty">
          No products found. Please try another search.
        </div>
      ) : (
      <div className="row g-3">
        {filtered.map(p => (
          <div key={p.id} className="col-md-4">
            <div className="card admin-card h-100">
              <img
                src={assetUrl(`uploads/products/${p.variants?.[0]?.image || ""}`)}
                className="card-img-top"
                alt={p.name}
                onError={(e) => {
                  e.currentTarget.src = "/images/hajar-arsali.png";
                }}
              />
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{p.name}</h5>
                <p className="card-text">{p.description}</p>
                <div className="mt-auto d-flex justify-content-between align-items-center">
                  <small className="product-meta">{p.variants?.length || 0} sizes</small>
                  <Link className="btn btn-primary btn-sm" to={`/product/${p.id}`}>View</Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
    </div>
  );
}

