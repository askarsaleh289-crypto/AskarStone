import React, { useState } from "react";
import API from "../api";
import "../styles/contact.css";
import { toast } from "react-toastify";
export default function Contact() {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("message", message);
      if (image) fd.append("image", image);
      await API.post("/messages", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Message sent successfully.");
      setMessage(""); setImage(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message.");
    }
  };

  return (
    <div className="contact-page">
    <div>
      <h3><span>Contact</span></h3>
      <p className="contact-intro">
       Our team is ready to assist you with materials, sizes, and custom stone solutions.
      </p>
      <form onSubmit={send}>
        <textarea className="form-control mb-2" rows="4" placeholder="Your message" value={message} onChange={e=>setMessage(e.target.value)} required />
        <input className="form-control mb-2" type="file" onChange={e=>setImage(e.target.files[0])} />
        <button className="btn btn-primary">Send</button>
      </form>
    </div>
    </div>
  );
}
