import { useEffect, useState, useCallback } from "react";

const KEYBOARD_ROWS = [
  [
    { key: "`", shift: "~", w: 1 }, { key: "1", shift: "!", w: 1 }, { key: "2", shift: "@", w: 1 },
    { key: "3", shift: "#", w: 1 }, { key: "4", shift: "$", w: 1 }, { key: "5", shift: "%", w: 1 },
    { key: "6", shift: "^", w: 1 }, { key: "7", shift: "&", w: 1 }, { key: "8", shift: "*", w: 1 },
    { key: "9", shift: "(", w: 1 }, { key: "0", shift: ")", w: 1 }, { key: "-", shift: "_", w: 1 },
    { key: "=", shift: "+", w: 1 }, { key: "Backspace", label: "⌫", w: 1.5 },
  ],
  [
    { key: "Tab", label: "Tab", w: 1.5 },
    { key: "q", w: 1 }, { key: "w", w: 1 }, { key: "e", w: 1 }, { key: "r", w: 1 }, { key: "t", w: 1 },
    { key: "y", w: 1 }, { key: "u", w: 1 }, { key: "i", w: 1 }, { key: "o", w: 1 }, { key: "p", w: 1 },
    { key: "[", shift: "{", w: 1 }, { key: "]", shift: "}", w: 1 }, { key: "\\", shift: "|", w: 1 },
  ],
  [
    { key: "CapsLock", label: "Caps", w: 1.75 },
    { key: "a", w: 1 }, { key: "s", w: 1 }, { key: "d", w: 1 }, { key: "f", w: 1 }, { key: "g", w: 1 },
    { key: "h", w: 1 }, { key: "j", w: 1 }, { key: "k", w: 1 }, { key: "l", w: 1 },
    { key: ";", shift: ":", w: 1 }, { key: "'", shift: '"', w: 1 }, { key: "Enter", label: "↵", w: 1.75 },
  ],
  [
    { key: "Shift", label: "Shift", w: 2.25 },
    { key: "z", w: 1 }, { key: "x", w: 1 }, { key: "c", w: 1 }, { key: "v", w: 1 }, { key: "b", w: 1 },
    { key: "n", w: 1 }, { key: "m", w: 1 }, { key: ",", shift: "<", w: 1 }, { key: ".", shift: ">", w: 1 },
    { key: "/", shift: "?", w: 1 }, { key: "Shift_R", label: "Shift", w: 2.25 },
  ],
  [
    { key: " ", label: "Space", w: 8 },
  ],
];

// Finger color zones for home row guidance
const FINGER_ZONES: Record<string, string> = {
  "`": "finger-pinky-l", "1": "finger-pinky-l", "q": "finger-pinky-l", "a": "finger-pinky-l", "z": "finger-pinky-l",
  "2": "finger-ring-l", "w": "finger-ring-l", "s": "finger-ring-l", "x": "finger-ring-l",
  "3": "finger-mid-l", "e": "finger-mid-l", "d": "finger-mid-l", "c": "finger-mid-l",
  "4": "finger-index-l", "r": "finger-index-l", "f": "finger-index-l", "v": "finger-index-l",
  "5": "finger-index-l", "t": "finger-index-l", "g": "finger-index-l", "b": "finger-index-l",
  "6": "finger-index-r", "y": "finger-index-r", "h": "finger-index-r", "n": "finger-index-r",
  "7": "finger-index-r", "u": "finger-index-r", "j": "finger-index-r", "m": "finger-index-r",
  "8": "finger-mid-r", "i": "finger-mid-r", "k": "finger-mid-r", ",": "finger-mid-r",
  "9": "finger-ring-r", "o": "finger-ring-r", "l": "finger-ring-r", ".": "finger-ring-r",
  "0": "finger-pinky-r", "p": "finger-pinky-r", ";": "finger-pinky-r", "/": "finger-pinky-r",
  "-": "finger-pinky-r", "[": "finger-pinky-r", "'": "finger-pinky-r",
  "=": "finger-pinky-r", "]": "finger-pinky-r",
  "\\": "finger-pinky-r",
};

interface ReactiveKeyboardProps {
  activeKey?: string | null;
  nextKey?: string | null;
  showFingerZones?: boolean;
}

const ReactiveKeyboard = ({ activeKey, nextKey, showFingerZones = false }: ReactiveKeyboardProps) => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const normalizeKey = (key: string) => key.toLowerCase();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setPressedKeys(prev => new Set(prev).add(normalizeKey(e.key)));
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setPressedKeys(prev => {
      const next = new Set(prev);
      next.delete(normalizeKey(e.key));
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const isPressed = (keyDef: { key: string }) => {
    const k = normalizeKey(keyDef.key);
    if (k === "shift_r") return pressedKeys.has("shift");
    return pressedKeys.has(k);
  };

  const isNextKey = (keyDef: { key: string }) => {
    if (!nextKey) return false;
    const k = keyDef.key.toLowerCase();
    const nk = nextKey.toLowerCase();
    if (k === " " && nk === " ") return true;
    if (k === "enter" && nk === "\n") return true;
    if (k === "tab" && nk === "\t") return true;
    return k === nk;
  };

  const getFingerClass = (key: string) => {
    if (!showFingerZones) return "";
    const zone = FINGER_ZONES[key.toLowerCase()];
    if (!zone) return "";
    const zoneColors: Record<string, string> = {
      "finger-pinky-l": "border-b-2 border-b-rose-400/30",
      "finger-ring-l": "border-b-2 border-b-amber-400/30",
      "finger-mid-l": "border-b-2 border-b-emerald-400/30",
      "finger-index-l": "border-b-2 border-b-sky-400/30",
      "finger-index-r": "border-b-2 border-b-sky-400/30",
      "finger-mid-r": "border-b-2 border-b-emerald-400/30",
      "finger-ring-r": "border-b-2 border-b-amber-400/30",
      "finger-pinky-r": "border-b-2 border-b-rose-400/30",
    };
    return zoneColors[zone] || "";
  };

  return (
    <div className="w-full select-none">
      <div className="flex flex-col items-center gap-[3px] w-full max-w-[680px] mx-auto">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-[3px] w-full justify-center">
            {row.map((keyDef, ki) => {
              const pressed = isPressed(keyDef);
              const next = isNextKey(keyDef);
              const label = keyDef.label || keyDef.key.toUpperCase();
              const isWide = keyDef.w > 1;

              return (
                <div
                  key={ki}
                  className={`
                    relative flex items-center justify-center rounded-md border text-[10px] sm:text-xs font-mono
                    transition-all duration-75 select-none
                    ${isWide ? "px-1" : ""}
                    ${pressed
                      ? "bg-primary text-primary-foreground border-primary scale-95 shadow-sm shadow-primary/30"
                      : next
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "bg-card/80 border-border/40 text-muted-foreground hover:bg-muted/30"
                    }
                    ${getFingerClass(keyDef.key)}
                  `}
                  style={{
                    flex: `${keyDef.w} 0 0%`,
                    height: "32px",
                    minWidth: 0,
                  }}
                >
                  {label.length === 1 ? label : (
                    <span className="text-[9px] sm:text-[10px] tracking-tight">{label}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReactiveKeyboard;
