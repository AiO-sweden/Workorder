import React from "react";

export default function InfoRow({ label, value }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.75rem 0",
      borderBottom: "1px solid #f1f5f9"
    }}>
      <span style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: "500" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.95rem", color: "#0f172a", fontWeight: "600" }}>
        {value}
      </span>
    </div>
  );
}
