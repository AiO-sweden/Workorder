import React from "react";

export default function FormField({ label, required, children, helper, icon }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{
        display: "block",
        fontSize: "0.875rem",
        fontWeight: "600",
        color: "#e2e8f0",
        marginBottom: "0.5rem"
      }}>
        {icon && <span style={{ marginRight: "0.5rem" }}>{icon}</span>}
        {label}
        {required && <span style={{ color: "#f87171", marginLeft: "0.25rem" }}>*</span>}
      </label>
      {children}
      {helper && (
        <div style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "#94a3b8" }}>
          {helper}
        </div>
      )}
    </div>
  );
}
