import React, { useState, useEffect } from "react";

function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "#0a0a0f",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      transition: "opacity 0.8s ease",
      opacity: progress === 100 ? 0 : 1,
      pointerEvents: progress === 100 ? "none" : "auto",
    }}>
      {/* Неоновые полоски (как у костюма стелс) */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "10%",
        width: "2px",
        height: "60%",
        background: "linear-gradient(to bottom, transparent, #00ff88, transparent)",
        boxShadow: "0 0 20px #00ff88, 0 0 60px #00ff8844",
        animation: "pulse 2s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute",
        top: "20%",
        right: "10%",
        width: "2px",
        height: "60%",
        background: "linear-gradient(to bottom, transparent, #00ff88, transparent)",
        boxShadow: "0 0 20px #00ff88, 0 0 60px #00ff8844",
        animation: "pulse 2s ease-in-out infinite 0.5s",
      }} />

      {/* Логотип / Название */}
      <h1 style={{
        fontSize: "3rem",
        fontWeight: 700,
        color: "#fff",
        letterSpacing: "4px",
        textShadow: "0 0 40px #00ff8866, 0 0 80px #00ff8833",
        marginBottom: "40px",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        NEON<span style={{ color: "#00ff88" }}>HUB</span>
      </h1>

      {/* Прогресс-бар */}
      <div style={{
        width: "200px",
        height: "2px",
        background: "#1a1a2e",
        borderRadius: "2px",
        overflow: "hidden",
        boxShadow: "0 0 20px #00ff8844",
      }}>
        <div style={{
          width: `${progress}%`,
          height: "100%",
          background: "linear-gradient(90deg, #00ff88, #00cc66)",
          transition: "width 0.15s ease",
          boxShadow: "0 0 20px #00ff88",
        }} />
      </div>

      <p style={{
        color: "#8b949e",
        fontSize: "0.8rem",
        marginTop: "16px",
        letterSpacing: "2px",
      }}>
        загрузка системы {progress}%
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default LoadingScreen;