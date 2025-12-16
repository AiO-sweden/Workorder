import { Loader2 } from "lucide-react";
import { colors, spacing } from "./theme";

export default function LoadingSpinner({ message = "Laddar...", size = 48 }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "50vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}
    className="page-enter"
    >
      <Loader2
        size={size}
        style={{
          color: colors.primary[500],
          marginBottom: spacing[4],
        }}
        className="spin-animation"
      />
      <p style={{ color: colors.neutral[600], fontSize: "1.1rem", fontWeight: 500 }}>{message}</p>
      <style>
        {`
          .spin-animation {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </div>
  );
}
