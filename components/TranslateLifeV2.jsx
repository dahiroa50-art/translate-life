"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { MODES } from "../utils/constants";
import { saveToHistory, loadHistory } from "../utils/storage";
import { parseTimer, formatTime } from "../utils/timer";
import LoadingDots from "./ui/LoadingDots";
import CountdownTimer from "./ui/CountdownTimer";
import MessageDecode from "./ui/MessageDecode";
import StepCard from "./ui/StepCard";
import FeedbackWidget from "./FeedbackWidget";

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300;1,9..144,500&family=DM+Mono:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0C0F14; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(134,188,157,0.3); border-radius: 4px; }
  textarea, input { outline: none; }
  button { cursor: pointer; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  @keyframes bounce {
    0%,80%,100% { transform: scale(0.55); opacity: 0.35; }
    40%         { transform: scale(1);    opacity: 1; }
  }
  @keyframes ringPulse {
    0%   { box-shadow: 0 0 0 0 rgba(134,188,157,0.5); }
    70%  { box-shadow: 0 0 0 10px rgba(134,188,157,0); }
    100% { box-shadow: 0 0 0 0 rgba(134,188,157,0); }
  }
  @keyframes timerDone {
    0%,100% { background: rgba(255,196,92,0.15); }
    50%     { background: rgba(255,196,92,0.35); }
  }

  .fade-up   { animation: fadeUp 0.4s ease forwards; }
  .pulse-rec { animation: pulse 1.5s ease infinite; }

  .step-card { transition: transform 0.15s, border-color 0.15s; }
  .step-card:hover { transform: translateX(3px); }
  .step-card.completed { opacity: 0.45; }
  .step-card.active { border-color: rgba(134,188,157,0.55) !important; }

  .tab-btn { transition: all 0.2s; }
  .tab-btn:hover { color: #86BC9D !important; }

  .chip { transition: all 0.15s; }
  .chip:hover { border-color: rgba(134,188,157,0.6) !important; color: #86BC9D !important; }

  .ghost-btn { transition: all 0.2s; }
  .ghost-btn:hover { border-color: rgba(255,255,255,0.25) !important; color: rgba(240,237,232,0.75) !important; }

  .hist-item { transition: background 0.15s; }
  .hist-item:hover { background: rgba(255,255,255,0.07) !important; }

  .primary-btn { transition: all 0.2s; }
  .primary-btn:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
  .primary-btn:active:not(:disabled) { transform: translateY(0); }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function TranslateLifeV2() {
  const [mode, setMode] = useState(MODES.TASK);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [overwhelmMode, setOverwhelmMode] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [showHistory, setShowHistory] = useState(false);
const [history, setHistory] = useState([]);
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
  setHistory(loadHistory());
}, []);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // Check voice support
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
    if (SR) {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";
      rec.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join("");
        setInput(transcript);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const SYSTEM_TASK = `You are a compassionate assistant for autistic and ADHD people.
Break the given task into tiny, concrete, doable micro-steps.
Rules:
- Maximum 7 steps
- Each step 1–5 minutes
- Literal, plain language — no metaphors
- Include timers where helpful (e.g. "5 minutes")
- Optional short tip for steps that might cause friction
- Return ONLY valid JSON, no markdown, no backticks

JSON format:
{
  "summary": "One calming sentence restating the task simply",
  "steps": [
    { "text": "Step text", "timer": "5 minutes or null", "tip": "optional tip or null" }
  ]
}`;

  const SYSTEM_MESSAGE = `You are a compassionate assistant for autistic and ADHD people.
Decode the given message someone received and felt confused or overwhelmed by.
Return ONLY valid JSON, no markdown, no backticks.

JSON format:
{
  "meaning": "What the person likely means in plain, direct language",
  "tone": "Emotional tone: calm / urgent / frustrated / friendly / passive-aggressive / neutral / worried",
  "action": "The ONE thing you need to do, or: No action needed",
  "reply": "A short safe reply you could copy-paste, or: No reply needed"
}`;

  async function handleTranslate() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setActiveStep(0);
    setCompletedSteps(new Set());
    setShowAll(false);

    try {
      const res = await fetch("/api/translate", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          mode: mode,
          system: mode === MODES.TASK ? SYSTEM_TASK : SYSTEM_MESSAGE,
          input: input.trim()
        })
      }); 
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      const clean = text.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);

      const entry = { mode, input: input.trim(), result: parsed, ts: Date.now() };
      saveToHistory(entry);
      setHistory(loadHistory());
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleComplete = useCallback((index) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    if (result?.steps && index + 1 < result.steps.length) {
      setActiveStep(index + 1);
    }
  }, [result]);

  const resetAll = () => {
    setResult(null); setInput(""); setError(null);
    setActiveStep(0); setCompletedSteps(new Set()); setShowAll(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const restoreHistory = (h) => {
    setMode(h.mode);
    setInput(h.input);
    setResult(h.result);
    setActiveStep(0);
    setCompletedSteps(new Set());
    setShowAll(false);
    setShowHistory(false);
  };

  const examples = mode === MODES.TASK
    ? ["I need to clean my room","Reply to those emails","Make dinner tonight"]
    : ["Your report needs attention ASAP.","We should probably talk sometime.","Just checking in :)"];

  const allDone = result?.steps && completedSteps.size === result.steps.length;

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        minHeight:"100vh", background:"#0C0F14",
        backgroundImage:"radial-gradient(ellipse 90% 55% at 50% -10%, rgba(134,188,157,0.10) 0%, transparent 65%)",
        padding:"0 0 100px", color:"#F0EDE8"
      }}>

        {/* ── Header ── */}
        <div style={{ textAlign:"center", padding:"48px 24px 32px" }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:8,
            background:"rgba(134,188,157,0.1)", border:"1px solid rgba(134,188,157,0.25)",
            borderRadius:100, padding:"4px 16px", marginBottom:20,
            fontSize:10, color:"#86BC9D", fontFamily:"'DM Mono',monospace",
            letterSpacing:2.5, textTransform:"uppercase"
          }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#86BC9D" }}/>
            Translate Life · v2
          </div>

          <h1 style={{
            fontSize:"clamp(30px,6.5vw,50px)", fontWeight:600, fontFamily:"'Fraunces',serif",
            letterSpacing:"-0.5px", lineHeight:1.15, color:"#F0EDE8"
          }}>
            Make life{" "}
            <span style={{ color:"#86BC9D", fontStyle:"italic", fontWeight:300 }}>clearer.</span>
          </h1>
          <p style={{
            margin:"14px auto 0", maxWidth:400, color:"rgba(240,237,232,0.5)",
            fontSize:15, lineHeight:1.7, fontFamily:"'Fraunces',serif"
          }}>
            Tiny steps from big tasks. Plain words from confusing messages.
          </p>
        </div>

        {/* ── History toggle ── */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
          <button className="ghost-btn" onClick={() => setShowHistory(h=>!h)} style={{
            padding:"6px 16px", borderRadius:100,
            background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)",
            color:"rgba(240,237,232,0.45)", fontSize:12, fontFamily:"'DM Mono',monospace"
          }}>
{showHistory
  ? "↑ Close history"
  : `📋 History${
      mounted && history.length
        ? ` (${history.length})`
        : ""
    }`
}
          </button>
        </div>

        <div style={{ maxWidth:580, margin:"0 auto", padding:"0 20px" }}>

          {/* ── History Panel ── */}
          {showHistory && (
            <div className="fade-up" style={{
              background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:18, padding:20, marginBottom:20
            }}>
              <div style={{ fontSize:11, color:"rgba(240,237,232,0.35)", fontFamily:"'DM Mono',monospace", letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>
                Recent translations
              </div>
              <HistoryPanel history={history} onRestore={restoreHistory} onClear={() => {
                localStorage.removeItem(STORAGE_KEY); setHistory([]);
              }}/>
            </div>
          )}

          {/* ── Mode tabs ── */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
            <div style={{
              display:"inline-flex", background:"rgba(255,255,255,0.05)",
              border:"1px solid rgba(255,255,255,0.09)", borderRadius:100, padding:4, gap:4
            }}>
              {[
                { id:MODES.TASK,    label:"⚡ Break a Task" },
                { id:MODES.MESSAGE, label:"💬 Decode a Message" }
              ].map(m => (
                <button key={m.id} className="tab-btn" onClick={() => {
                  setMode(m.id); setResult(null); setInput(""); setError(null);
                }} style={{
                  padding:"9px 20px", borderRadius:100, border:"none",
                  fontSize:12.5, fontFamily:"'DM Mono',monospace", fontWeight:500,
                  background: mode===m.id ? "#86BC9D" : "transparent",
                  color: mode===m.id ? "#0C0F14" : "rgba(240,237,232,0.55)"
                }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Input Card ── */}
          {!result && (
            <div style={{
              background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)",
              borderRadius:20, padding:22
            }}>
              {/* Textarea + mic */}
              <div style={{
                background:"rgba(0,0,0,0.35)", border:"1.5px solid rgba(134,188,157,0.2)",
                borderRadius:14, marginBottom:14, position:"relative"
              }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key==="Enter" && (e.ctrlKey||e.metaKey)) handleTranslate(); }}
                  placeholder={mode===MODES.TASK
                    ? "e.g. I need to clean my room, call the doctor, reply to emails…"
                    : "Paste a confusing message, email, or text here…"}
                  rows={4}
                  style={{
                    width:"100%", background:"transparent", border:"none",
                    padding:"14px 46px 14px 16px", color:"#F0EDE8", fontSize:15,
                    fontFamily:"'Fraunces',serif", lineHeight:1.6, resize:"none",
                    caretColor:"#86BC9D"
                  }}
                />
                {/* Mic button */}
                {voiceSupported && (
                  <button onClick={toggleVoice} style={{
                    position:"absolute", right:12, top:12, width:28, height:28,
                    borderRadius:"50%", border:"none",
                    background: listening ? "rgba(239,68,68,0.2)" : "rgba(134,188,157,0.12)",
                    color: listening ? "#FCA5A5" : "#86BC9D",
                    fontSize:14, display:"flex", alignItems:"center", justifyContent:"center"
                  }} title="Voice input">
                    <span className={listening ? "pulse-rec" : ""}>{listening ? "⏹" : "🎙"}</span>
                  </button>
                )}
              </div>

              {listening && (
                <div style={{ fontSize:12, color:"#FCA5A5", fontFamily:"'DM Mono',monospace", marginBottom:10, textAlign:"center" }}>
                  🔴 Listening… speak your task
                </div>
              )}

              {/* Example chips */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
                {examples.map(ex => (
                  <button key={ex} className="chip" onClick={() => setInput(ex)} style={{
                    background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                    borderRadius:100, padding:"5px 14px", fontSize:11.5,
                    color:"rgba(240,237,232,0.5)", fontFamily:"'DM Mono',monospace"
                  }}>
                    {ex}
                  </button>
                ))}
              </div>

              <button className="primary-btn" onClick={handleTranslate} disabled={loading || !input.trim()} style={{
                width:"100%", padding:"14px",
                background: !input.trim() ? "rgba(134,188,157,0.25)" : "#86BC9D",
                border:"none", borderRadius:12, color:"#0C0F14",
                fontSize:14.5, fontWeight:600, fontFamily:"'DM Mono',monospace", letterSpacing:0.5
              }}>
                {mode===MODES.TASK ? "⚡ Break It Down" : "💬 Decode This"}
              </button>

              <div style={{ textAlign:"center", marginTop:8, fontSize:10.5, color:"rgba(240,237,232,0.2)", fontFamily:"'DM Mono',monospace" }}>
                Ctrl+Enter · {voiceSupported ? "🎙 voice supported" : "type or paste"}
              </div>
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div style={{ textAlign:"center" }}>
              <LoadingDots/>
              <p style={{ color:"rgba(240,237,232,0.35)", fontSize:12, fontFamily:"'DM Mono',monospace", marginTop:6 }}>
                Making this manageable…
              </p>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div style={{
              padding:"14px 18px", background:"rgba(239,68,68,0.08)",
              border:"1px solid rgba(239,68,68,0.25)", borderRadius:12,
              color:"#FCA5A5", fontSize:14, fontFamily:"'Fraunces',serif"
            }}>
              {error}
            </div>
          )}

          {/* ── Results ── */}
          {result && !loading && (
            <div style={{ animation:"fadeIn 0.3s ease" }}>

              {/* Summary */}
              {result.summary && (
                <div className="fade-up" style={{
                  background:"rgba(134,188,157,0.08)", border:"1px solid rgba(134,188,157,0.2)",
                  borderRadius:14, padding:"14px 18px", marginBottom:16,
                  color:"#86BC9D", fontSize:15, fontStyle:"italic",
                  fontFamily:"'Fraunces',serif", lineHeight:1.6
                }}>
                  {result.summary}
                </div>
              )}

              {/* Task mode controls */}
              {result.steps && (
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                  <div style={{ fontSize:11, color:"rgba(240,237,232,0.35)", fontFamily:"'DM Mono',monospace" }}>
                    {completedSteps.size}/{result.steps.length} done
                  </div>
                  <div style={{ flex:1 }}/>
                  {/* Overwhelm mode toggle */}
                  <button className="chip" onClick={() => { setOverwhelmMode(o=>!o); setShowAll(false); }} style={{
                    padding:"5px 14px", borderRadius:100, border:"none",
                    background: overwhelmMode ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.06)",
                    color: overwhelmMode ? "#A78BFA" : "rgba(240,237,232,0.45)",
                    fontSize:11, fontFamily:"'DM Mono',monospace"
                  }}>
                    {overwhelmMode ? "🌿 One step at a time: ON" : "🌿 Overwhelm mode"}
                  </button>
                  {overwhelmMode && !showAll && (
                    <button className="chip" onClick={() => setShowAll(true)} style={{
                      padding:"5px 12px", borderRadius:100, border:"1px solid rgba(255,255,255,0.08)",
                      background:"transparent", color:"rgba(240,237,232,0.35)",
                      fontSize:11, fontFamily:"'DM Mono',monospace"
                    }}>
                      Show all
                    </button>
                  )}
                </div>
              )}

              {/* Steps */}
              {result.steps && (
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
                  {result.steps.map((step, i) => (
                    <StepCard
                      key={i} step={step} index={i} delay={i*0.07}
                      overwhelmMode={overwhelmMode} showAll={showAll}
                      isActive={overwhelmMode ? i === activeStep && !completedSteps.has(i) : false}
                      isCompleted={completedSteps.has(i)}
                      onComplete={handleComplete}
                    />
                  ))}
                </div>
              )}

              {/* All done celebration */}
              {allDone && (
                <div className="fade-up" style={{
                  textAlign:"center", padding:"20px",
                  background:"rgba(134,188,157,0.08)", border:"1px solid rgba(134,188,157,0.2)",
                  borderRadius:14, marginBottom:16
                }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>🎉</div>
                  <div style={{ color:"#86BC9D", fontFamily:"'Fraunces',serif", fontSize:16, fontStyle:"italic" }}>
                    All done. You did it.
                  </div>
                </div>
              )}

              {/* Message decode */}
              {result.meaning && <MessageDecode data={result}/>}

              {/* Actions */}
              <div style={{ display:"flex", gap:10, marginTop:20 }}>
                <button className="ghost-btn" onClick={resetAll} style={{
                  flex:1, padding:"12px", border:"1px solid rgba(255,255,255,0.09)",
                  borderRadius:12, background:"transparent",
                  color:"rgba(240,237,232,0.35)", fontSize:12, fontFamily:"'DM Mono',monospace"
                }}>
              {/* Feedback Widget */}
              <div style={{
                 marginTop: 20,
                 padding: "18px 20px",
                 background: "#FDF9F3",
                 border: "1px solid #E8E0D5",
                 borderRadius: 16,
               }}>
                 <FeedbackWidget mode={mode} input={input} />
        </div>

        <button onClick={resetAll}>

                  ↩ Try another
                </button>
                {result.steps && (
                  <button className="ghost-btn" onClick={() => {
                    setActiveStep(0); setCompletedSteps(new Set()); setShowAll(false);
                  }} style={{
                    flex:1, padding:"12px", border:"1px solid rgba(255,255,255,0.09)",
                    borderRadius:12, background:"transparent",
                    color:"rgba(240,237,232,0.35)", fontSize:12, fontFamily:"'DM Mono',monospace"
                  }}>
                    ↺ Restart steps
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign:"center", marginTop:70,
          color:"rgba(240,237,232,0.18)", fontSize:11, fontFamily:"'DM Mono',monospace", lineHeight:2
        }}>
          Not medical advice · Just a translation tool<br/>
          You've got this.
        </div>
      </div>
    </>
  );
}
