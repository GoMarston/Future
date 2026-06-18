import React, { useEffect, useState } from "react";

function WelcomeLoading({ userName, onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 5;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "#0D0D12",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        transition: "opacity 0.6s ease",
        opacity: progress === 100 ? 0 : 1,
        pointerEvents: progress === 100 ? "none" : "auto",
      }}
    >
      {/* Неоновые полоски */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "10%",
          width: "2px",
          height: "60%",
          background: "linear-gradient(to bottom, transparent, #00FF88, transparent)",
          boxShadow: "0 0 20px #00FF88, 0 0 60px #00FF8844",
          animation: "pulse 2s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "20%",
          right: "10%",
          width: "2px",
          height: "60%",
          background: "linear-gradient(to bottom, transparent, #00FF88, transparent)",
          boxShadow: "0 0 20px #00FF88, 0 0 60px #00FF8844",
          animation: "pulse 2s ease-in-out infinite 0.5s",
        }}
      />

      <h1
        style={{
          fontSize: "2.5rem",
          fontWeight: 700,
          color: "#FFFFFF",
          textAlign: "center",
          textShadow: "0 0 40px #00FF8866",
          marginBottom: "12px",
        }}
      >
        Добро пожаловать, <span style={{ color: "#00FF88" }}>{userName}</span>!
      </h1>
      <p
        style={{
          color: "#8B949E",
          fontSize: "1rem",
          marginBottom: "32px",
        }}
      >
        NEONHUB загружается для тебя...
      </p>

      <div
        style={{
          width: "200px",
          height: "2px",
          background: "#1A1A2E",
          borderRadius: "2px",
          overflow: "hidden",
          boxShadow: "0 0 20px #00FF8844",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "linear-gradient(90deg, #00FF88, #00CC66)",
            transition: "width 0.15s ease",
            boxShadow: "0 0 20px #00FF88",
          }}
        />
      </div>

      <p
        style={{
          color: "#5A6370",
          fontSize: "0.7rem",
          marginTop: "12px",
          letterSpacing: "2px",
        }}
      >
        {progress}%
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default WelcomeLoading;