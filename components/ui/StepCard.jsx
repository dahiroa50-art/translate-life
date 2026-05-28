import { useState } from "react";
import CountdownTimer from "./CountdownTimer";
import { parseTimer } from "../../utils/timer";

export default function StepCard({
  step,
  index,
  delay,
  overwhelmMode,
  isActive,
  isCompleted,
  onComplete,
  showAll
}) {
  const [checked, setChecked] = useState(false);
  const timerSecs = parseTimer(step.timer);

  const handleCheck = () => {
    setChecked(true);
    setTimeout(() => onComplete(index), 300);
  };

  if (overwhelmMode && !isActive && !isCompleted && !showAll) return null;

  return (
    <div
      className={`step-card fade-up ${isCompleted || checked ? "completed" : ""} ${isActive ? "active" : ""}`}
      style={{
        display:"flex", alignItems:"flex-start", gap:14,
        background: isActive ? "rgba(134,188,157,0.07)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${isCompleted || checked ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)"}`,
        borderRadius:16, padding:"16px 18px",
        animationDelay:`${delay}s`, opacity:0,
        position:"relative", overflow:"hidden"
      }}
    >
      {/* Checkbox */}
      <button
        onClick={handleCheck}
        disabled={isCompleted || checked}
        style={{
          minWidth:28, height:28, borderRadius:"50%",
          background: isCompleted || checked ? "rgba(134,188,157,0.3)" : "rgba(134,188,157,0.1)",
          border: `2px solid ${isCompleted || checked ? "#86BC9D" : "rgba(134,188,157,0.4)"}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:12, color:"#86BC9D", transition:"all 0.2s",
          animation: isActive ? "ringPulse 2s ease infinite" : "none",
          cursor: isCompleted || checked ? "default" : "pointer"
        }}
      >
        {isCompleted || checked ? "✓" : index + 1}
      </button>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          color: isCompleted || checked ? "rgba(240,237,232,0.4)" : "#F0EDE8",
          fontSize:15, lineHeight:1.55, fontFamily:"'Fraunces',serif",
          textDecoration: isCompleted || checked ? "line-through" : "none",
          transition:"all 0.3s"
        }}>
          {step.text}
        </div>

        {timerSecs && !isCompleted && !checked && (
          <CountdownTimer seconds={timerSecs} />
        )}

        {step.tip && !isCompleted && !checked && (
          <div style={{
            marginTop:8, fontSize:12, color:"rgba(240,237,232,0.45)",
            fontFamily:"'Fraunces',serif", fontStyle:"italic", lineHeight:1.5
          }}>
            💡 {step.tip}
          </div>
        )}
      </div>
    </div>
  );
}

