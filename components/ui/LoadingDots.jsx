export default function LoadingDots() {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 0"
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "#86BC9D",
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
          }}
        />
      ))}
    </div>
  );
}
