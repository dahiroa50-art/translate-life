import { useState, useRef, useEffect } from "react";
import { formatTime } from "../../utils/timer";

export default function CountdownTimer({ seconds, onDone }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const interval = useRef(null);

  useEffect(() => {
    if (running) {
      interval.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clearInterval(interval.current);
            setRunning(false);
            setDone(true);
            onDone?.();
            return 0;
          }

          return r - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval.current);
  }, [running, onDone]);

  const pct = ((seconds - remaining) / seconds) * 100;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
        flexWrap: "wrap"
      }}
    >
      <div style={{ position: "relative", width: 36, height: 36 }}>
        <svg
          width="36"
          height="36"
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="rgba(255,196,92,0.15)"
            strokeWidth="2.5"
          />

          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="#FFC45C"
            strokeWidth="2.5"
            strokeDasharray={`${2 * Math.PI * 14}`}
            strokeDashoffset={`${2 * Math.PI * 14 * (1 - pct / 100)}`}
            style={{
              transition: "stroke-dashoffset 1s linear"
            }}
          />
        </svg>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            fontFamily: "'DM Mono', monospace",
            color: "#FFC45C"
          }}
        >
          {done ? "✓" : formatTime(remaining)}
        </div>
      </div>

      {!done ? (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setRunning((r) => !r)}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              background: running
                ? "rgba(239,68,68,0.15)"
                : "rgba(255,196,92,0.15)",
              border: `1px solid ${
                running
                  ? "rgba(239,68,68,0.4)"
                  : "rgba(255,196,92,0.4)"
              }`,
              color: running ? "#FCA5A5" : "#FFC45C",
              fontSize: 11,
              fontFamily: "'DM Mono', monospace"
            }}
          >
            {running
              ? "⏸ Pause"
              : remaining < seconds
              ? "▶ Resume"
              : "▶ Start"}
          </button>

          {remaining < seconds && !running && (
            <button
              onClick={() => {
                setRemaining(seconds);
                setDone(false);
              }}
              style={{
                padding: "4px 10px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(240,237,232,0.5)",
                fontSize: 11,
                fontFamily: "'DM Mono', monospace"
              }}
            >
              ↺
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            padding: "4px 12px",
            borderRadius: 20,
            background: "rgba(134,188,157,0.15)",
            border: "1px solid rgba(134,188,157,0.4)",
            color: "#86BC9D",
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            animation: "timerDone 1s ease 3"
          }}
        >
          ✓ Done!
        </div>
      )}
    </div>
  );
}
