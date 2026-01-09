import React from "react";

export default function InfoRow({ label, value }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.75rem 0",
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
    }}>
      <span style={{ fontSize: "0.875rem", color: "#94a3b8", fontWeight: "500" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.95rem", color: "#e2e8f0", fontWeight: "600" }}>
        {value}
      </span>
    </div>
  );
}
