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
      backgroundColor: colors.primary[500],
      color: "white",
    },
    secondary: {
      backgroundColor: "white",
      color: colors.primary[600],
      border: `2px solid ${colors.primary[200]}`,
    },
    success: {
      backgroundColor: colors.success[500],
      color: "white",
    },
    danger: {
      backgroundColor: colors.error[500],
      color: "white",
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
      if (variant === "primary") return colors.primary[600];
      if (variant === "success") return colors.success[600];
      if (variant === "danger") return colors.error[600];
    }
    return colors.neutral[600];
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
