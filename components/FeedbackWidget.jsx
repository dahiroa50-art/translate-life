const WEBHOOK_URL = "https://eopb2r33spw1blu.m.pipedream.net";

function FeedbackWidget({ mode, input }) {
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    if (!rating) return;
    setSending(true);
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString(),
          rating: rating === "up" ? "👍 Helpful" : "👎 Not helpful",
          comment: comment.trim() || "No comment",
          mode: mode,
          input: input,
        }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSending(false);
    }
  }

  if (submitted) return (
    <div style={{
      padding: "16px", textAlign: "center",
      background: "#EAF3EC", border: "1px solid #B8D4BE",
      borderRadius: 14,
    }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>🌿</div>
      <div style={{ color: "#4A7C59", fontSize: 14, fontWeight: 600 }}>
        Thank you. Your feedback helps this grow.
      </div>
    </div>
  );

  return (
    <div>
      <div style={{
        fontSize: 11, color: "#A8998A", letterSpacing: 1.8,
        textTransform: "uppercase", marginBottom: 14, textAlign: "center"
      }}>
        Was this helpful?
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 14 }}>
        {[{ id: "up", emoji: "👍" }, { id: "down", emoji: "👎" }].map(btn => (
          <button key={btn.id} onClick={() => setRating(btn.id)} style={{
            padding: "10px 28px", borderRadius: 100, border: "none",
            background: rating === btn.id
              ? btn.id === "up" ? "#4A7C59" : "#DC2626"
              : "#FFFFFF",
            fontSize: 22, cursor: "pointer", transition: "all 0.2s",
            transform: rating === btn.id ? "scale(1.1)" : "scale(1)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            {btn.emoji}
          </button>
        ))}
      </div>
      {rating && (
        <div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={rating === "up" ? "What helped? (optional)" : "What could be better? (optional)"}
            rows={2}
            style={{
              width: "100%", border: "1px solid #E8E0D5",
              borderRadius: 10, padding: "10px 14px",
              fontSize: 13, lineHeight: 1.5,
              marginBottom: 10, resize: "none", outline: "none"
            }}
          />
          <button onClick={handleSubmit} disabled={sending} style={{
            width: "100%", padding: "11px",
            background: "#4A7C59", border: "none", borderRadius: 10,
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            opacity: sending ? 0.7 : 1
          }}>
            {sending ? "Sending…" : "Send feedback"}
          </button>
        </div>
      )}
    </div>
  );
}
