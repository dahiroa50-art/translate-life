export function parseTimer(timerStr: string | null) {
  if (!timerStr) return null;

  const m = timerStr.match(/(\d+)\s*min/i);
  const s = timerStr.match(/(\d+)\s*sec/i);

  if (m) return parseInt(m[1]) * 60;
  if (s) return parseInt(s[1]);

  return null;
}

export function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;

  return `${m}:${s.toString().padStart(2, "0")}`;
}
