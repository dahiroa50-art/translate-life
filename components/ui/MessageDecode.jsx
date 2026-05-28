export default function MessageDecode({ data }) {
  const sections = [
    {
      label: "What they mean",
      value: data.meaning,
      color: "#86BC9D",
      icon: "💭"
    },
    {
      label: "Emotional tone",
      value: data.tone,
      color: "#A78BFA",
      icon: "🌊"
    },
    {
      label: "Your one action",
      value: data.action,
      color: "#FFC45C",
      icon: "⚡"
    },
    {
      label: "Safe reply",
      value: data.reply,
      color: "#F472B6",
      icon: "💬"
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sections.map((s, i) => (
        <div
          key={s.label}
          style={{
            background: `${s.color}0d`,
            border: `1px solid ${s.color}33`,
            borderLeft: `3px solid ${s.color}`,
            borderRadius: 14,
            padding: "14px 18px"
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: s.color,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: 1.8,
              textTransform: "uppercase",
              marginBottom: 7
            }}
          >
            {s.icon} {s.label}
          </div>

          <div
            style={{
              color: "#F0EDE8",
              fontSize: 15,
              lineHeight: 1.6,
              fontFamily: "'Fraunces', serif"
            }}
          >
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
