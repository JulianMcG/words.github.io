import React, { useState, useEffect } from "react";

export default function BuddyIcon({ size = 16, className = "" }) {
  const [expression, setExpression] = useState("idle");
  const [isDark, setIsDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const getUrl = (key) => `/buddy expressions/buddy${isDark ? 'dark' : 'light'}${key === "idle" ? "" : key}.png`;

  // Every icon instance blinks independently and naturally
  useEffect(() => {
    let timeoutId;
    let currentBlinkTimeouts = [];

    const clearBlinks = () => {
      currentBlinkTimeouts.forEach(clearTimeout);
      currentBlinkTimeouts = [];
    };

    const triggerBlink = () => {
      clearBlinks();
      setExpression("blink");
      
      const isDoubleBlink = Math.random() < 0.25; // 25% chance to double blink
      
      if (isDoubleBlink) {
        // Double-blink: 150ms blink -> 100ms pause -> 120ms blink
        currentBlinkTimeouts.push(setTimeout(() => {
          setExpression("idle"); // Pause starts
          currentBlinkTimeouts.push(setTimeout(() => {
            setExpression("blink"); // Second blink starts
            currentBlinkTimeouts.push(setTimeout(() => {
              setExpression("idle"); // Second blink ends
            }, 120));
          }, 100)); // 100ms pause
        }, 150));
      } else {
        // Standard Blink: 150ms
        currentBlinkTimeouts.push(setTimeout(() => {
          setExpression("idle");
        }, 150));
      }

      timeoutId = setTimeout(triggerBlink, Math.random() * 3500 + 2500); 
    };

    timeoutId = setTimeout(triggerBlink, Math.random() * 3500 + 2500);
    return () => {
      clearTimeout(timeoutId);
      clearBlinks();
    };
  }, []);

  return (
    <img 
      src={getUrl(expression)} 
      alt="Buddy" 
      style={{ width: size, height: size }}
      className={`object-contain block opacity-90 ${className}`}
      draggable="false"
    />
  );
}
