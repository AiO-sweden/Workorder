import { useState } from "react";
import { buttonStyle, colors, spacing, typography, shadows, transitions } from "./styles";

export default function ActionButton({
  onClick,
  icon,
  children,
  disabled,
  fullWidth,
  color,
  hoverColor,
  size = "md",
  variant
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Size mappings
  const sizes = {
    sm: {
      padding: `${spacing[1]} ${spacing[3]}`,
      fontSize: typography.fontSize.xs,
    },
    md: {
      padding: `${spacing[3]} ${spacing[6]}`,
      fontSize: typography.fontSize.base,
    },
    lg: {
      padding: `${spacing[4]} ${spacing[8]}`,
      fontSize: typography.fontSize.lg,
    },
  };

  // Variant styles (backwards compatible)
  const variantStyles = {
    primary: {
      backgroundColor: '#3b82f6',
      color: "white",
      border: 'none',
    },
    secondary: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      color: '#fff',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    success: {
      backgroundColor: '#10b981',
      color: "white",
      border: 'none',
    },
    danger: {
      backgroundColor: '#ef4444',
      color: "white",
      border: 'none',
    },
  };

  const sizeStyle = sizes[size] || sizes.md;

  // Use custom color if provided, otherwise use variant
  const getButtonColor = () => {
    if (color) return color;
    if (variant && variantStyles[variant]) return variantStyles[variant].backgroundColor;
    return colors.neutral[500];
  };

  const getHoverColor = () => {
    if (hoverColor) return hoverColor;
    if (variant && variantStyles[variant]) {
      // Darker version for hover
      if (variant === "primary") return '#2563eb';
      if (variant === "secondary") return 'rgba(255, 255, 255, 0.12)';
      if (variant === "success") return '#059669';
      if (variant === "danger") return '#dc2626';
    }
    return '#64748b';
  };

  const buttonColor = getButtonColor();
  const buttonHoverColor = getHoverColor();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...buttonStyle,
        ...sizeStyle,
        ...(variant && variantStyles[variant]),
        backgroundColor: !variant && !isHovered ? buttonColor : undefined,
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: isHovered && !disabled ? shadows.lg : shadows.sm,
        transform: isHovered && !disabled ? 'translateY(-2px)' : 'translateY(0)',
        transition: `all ${transitions.base}`,
        color: !variant ? "white" : undefined,
      }}
      onMouseMove={(e) => {
        if (!variant && !disabled) {
          e.currentTarget.style.backgroundColor = buttonHoverColor;
        }
      }}
      onMouseOut={(e) => {
        if (!variant && !disabled) {
          e.currentTarget.style.backgroundColor = buttonColor;
        }
      }}
    >
      {icon}
      {children}
    </button>
  );
}
