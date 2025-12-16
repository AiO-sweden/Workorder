import React from "react";

export default function FormField({ label, required, children, helper, icon }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{
        display: "block",
        fontSize: "0.875rem",
        fontWeight: "600",
        color: "#374151",
        marginBottom: "0.5rem"
      }}>
        {icon && <span style={{ marginRight: "0.5rem" }}>{icon}</span>}
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: "0.25rem" }}>*</span>}
      </label>
      {children}
      {helper && (
        <div style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "#64748b" }}>
          {helper}
        </div>
      )}
    </div>
  );
}
