import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../api";
import "../../styles/admin-products.css";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [variants, setVariants] = useState([
    { id: null, size: "", price: "", quantity: 0, image: null },
  ]);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Fetch products error:", err);
      toast.error("Failed to load products.");
    }
  };

  const addVariantRow = () =>
    setVariants([
      ...variants,
      { id: null, size: "", price: "", quantity: 0, image: null },
    ]);

  const setVariant = (i, field, value) => {
    const copy = [...variants];
    copy[i][field] = value;
    setVariants(copy);
  };

  const removeVariant = (i) => {
    setVariants(variants.filter((_, idx) => idx !== i));
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setVariants(
      product.variants.map((v) => ({
        id: v.id,
        size: v.size,
        price: v.price,
        quantity: v.quantity ?? 0,
        image: null,
      }))
    );
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName("");
    setDescription("");
    setVariants([{ id: null, size: "", price: "", quantity: 0, image: null }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("description", description);
      fd.append(
        "variants",
        JSON.stringify(
          variants.map((v, i) => ({
            id: v.id,
            size: v.size,
            price: v.price,
            quantity: Number(v.quantity) || 0,
            imageKey: v.id ? `image_${v.id}` : `image_new_${i}`,
          }))
        )
      );

      variants.forEach((v, i) => {
        if (v.image) {
          const key = v.id ? `image_${v.id}` : `image_new_${i}`;
          fd.append(key, v.image);
        }
      });

      if (editingProduct) {
        await API.put(`/products/${editingProduct.id}`, fd);
        toast.success("Product updated.");
      } else {
        await API.post("/products", fd);
        toast.success("Product created.");
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Failed to submit product.");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete product?")) return;

    try {
      await API.delete(`/products/${id}`);
      toast.success("Product deleted.");
      fetchProducts();
    } catch (err) {
      console.error("Delete product error:", err);
      toast.error("Failed to delete product.");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <h3>{editingProduct ? "Edit Product" : "Create Product"}</h3>

        <form className="admin-form" onSubmit={handleSubmit}>
          <input
            className="form-control"
            placeholder="Product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <textarea
            className="form-control"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <h6 className="mt-3">Variants</h6>

          {variants.map((v, i) => (
            <div key={i} className="variant-row">
              <input
                className="form-control"
                placeholder="Size"
                value={v.size}
                onChange={(e) => setVariant(i, "size", e.target.value)}
                required
              />
              <input
                className="form-control"
                placeholder="Price"
                type="number"
                value={v.price}
                onChange={(e) => setVariant(i, "price", e.target.value)}
                required
              />
              <input
                className="form-control"
                placeholder="Quantity"
                type="number"
                min="0"
                value={v.quantity}
                onChange={(e) => setVariant(i, "quantity", e.target.value)}
                required
              />
              <input
                className="form-control"
                type="file"
                onChange={(e) => setVariant(i, "image", e.target.files[0])}
              />
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => removeVariant(i)}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary mt-2"
            onClick={addVariantRow}
          >
            + Add Variant
          </button>

          <div className="mt-3">
            <button className="btn btn-primary me-2" type="submit">
              {editingProduct ? "Update Product" : "Create Product"}
            </button>

            {editingProduct && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <h5 className="mt-5">Existing Products</h5>

        <table className="table admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Variants</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.description}</td>
                <td>
                  {p.variants.map((v, idx) => (
                    <div key={idx} className="variant-view">
                      {v.imageUrl && <img src={v.imageUrl} alt={v.size} />}
                      <span>
                        {v.size} (${v.price}) - Qty: {v.quantity}
                      </span>
                    </div>
                  ))}
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => startEdit(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteProduct(p.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
