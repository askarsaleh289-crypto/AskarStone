import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API, { assetUrl } from "../../api";
import "../../styles/admin-messages.css";

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [q, setQ] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [emailText, setEmailText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const r = await API.get("/messages");
      setMessages(r.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load messages.");
    }
  };

  const filtered = messages.filter((m) =>
    (m.user_name || "").toLowerCase().includes(q.toLowerCase())
  );

  const sendEmail = async () => {
    if (!emailText.trim()) {
      toast.warning("Write email message first.");
      return;
    }

    try {
      setSending(true);
      await API.post("/messages/send-email", {
        userId: selectedMessage.user_id,
        subject: "Regarding your message",
        message: emailText,
      });
      toast.success("Email sent successfully.");
      setEmailText("");
      setSelectedMessage(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <h3>Messages</h3>

        <input
          className="form-control admin-search"
          placeholder="Search by user name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="messages-list">
          {filtered.map((m) => (
            <div key={m.id} className="message-card">
              <div className="message-header">
                <strong>{m.user_name}</strong>
                <small>{new Date(m.created_at).toLocaleString()}</small>
              </div>

              <div className="message-body">{m.message}</div>

              {m.image && (
                <img
                  src={assetUrl(`uploads/contact/${m.image}`)}
                  alt=""
                  className="message-image"
                />
              )}

              <button
                className="btn btn-sm btn-outline-primary mt-2"
                onClick={() => setSelectedMessage(m)}
              >
                Send Email
              </button>
            </div>
          ))}
        </div>

        {selectedMessage && (
          <div className="email-panel">
            <h5>Send Email to {selectedMessage.user_name}</h5>

            <textarea
              className="form-control mb-3"
              rows="4"
              placeholder="Write email message..."
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
            />

            <div className="d-flex gap-2">
              <button
                className="btn btn-primary"
                disabled={sending}
                onClick={sendEmail}
              >
                {sending ? "Sending..." : "Send Email"}
              </button>

              <button
                className="btn btn-outline-secondary"
                onClick={() => setSelectedMessage(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
