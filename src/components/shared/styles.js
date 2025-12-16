// Updated shared styles with modern design system
import { colors, spacing, shadows, borderRadius, typography, transitions } from './theme';

export const cardStyle = {
  backgroundColor: "white",
  borderRadius: borderRadius.xl,
  padding: spacing[8],
  marginBottom: spacing[6],
  boxShadow: shadows.md,
  border: `1px solid ${colors.neutral[200]}`,
  transition: `all ${transitions.base}`,
};

export const cardHoverStyle = {
  ...cardStyle,
  boxShadow: shadows.lg,
  transform: 'translateY(-2px)',
};

export const sectionHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: spacing[3],
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.semibold,
  color: colors.neutral[900],
  marginBottom: spacing[6],
  paddingBottom: spacing[4],
  borderBottom: `2px solid ${colors.neutral[100]}`,
};

export const inputStyle = {
  width: "100%",
  padding: `${spacing[3]} ${spacing[4]}`,
  borderRadius: borderRadius.lg,
  border: `2px solid ${colors.neutral[200]}`,
  fontSize: typography.fontSize.base,
  color: colors.neutral[900],
  outline: "none",
  transition: `all ${transitions.base}`,
  backgroundColor: "white",
  fontFamily: typography.fontFamily.sans,
  fontWeight: typography.fontWeight.normal,
};

export const inputFocusStyle = {
  ...inputStyle,
  borderColor: colors.primary[500],
  boxShadow: `0 0 0 3px ${colors.primary[100]}`,
};

export const buttonStyle = {
  padding: `${spacing[3]} ${spacing[6]}`,
  borderRadius: borderRadius.lg,
  border: "none",
  fontWeight: typography.fontWeight.semibold,
  fontSize: typography.fontSize.base,
  cursor: "pointer",
  transition: `all ${transitions.base}`,
  display: "flex",
  alignItems: "center",
  gap: spacing[2],
  justifyContent: "center",
  textDecoration: "none",
  boxShadow: shadows.sm,
};

export const primaryButtonStyle = {
  ...buttonStyle,
  background: colors.gradients.primary,
  color: "white",
  boxShadow: shadows.md,
};

export const secondaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: "white",
  color: colors.primary[600],
  border: `2px solid ${colors.primary[200]}`,
};

export const successButtonStyle = {
  ...buttonStyle,
  background: colors.gradients.success,
  color: "white",
  boxShadow: shadows.md,
};

export const dangerButtonStyle = {
  ...buttonStyle,
  backgroundColor: colors.error[500],
  color: "white",
  boxShadow: shadows.md,
};

export const tableHeaderStyle = {
  padding: spacing[4],
  textAlign: "left",
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.semibold,
  color: colors.neutral[600],
  backgroundColor: colors.neutral[50],
  borderBottom: `2px solid ${colors.neutral[200]}`,
};

export const tableCellStyle = {
  padding: spacing[4],
  borderBottom: `1px solid ${colors.neutral[100]}`,
  fontSize: typography.fontSize.base,
  color: colors.neutral[900],
};

export const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: `${spacing[1]} ${spacing[3]}`,
  borderRadius: borderRadius.full,
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.semibold,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

export const statusColors = {
  success: {
    bg: colors.success[100],
    text: colors.success[700],
    border: colors.success[200],
  },
  warning: {
    bg: colors.warning[100],
    text: colors.warning[700],
    border: colors.warning[200],
  },
  error: {
    bg: colors.error[100],
    text: colors.error[700],
    border: colors.error[200],
  },
  info: {
    bg: colors.primary[100],
    text: colors.primary[700],
    border: colors.primary[200],
  },
  neutral: {
    bg: colors.neutral[100],
    text: colors.neutral[700],
    border: colors.neutral[200],
  },
};

// Export theme for use in components
export { colors, spacing, shadows, borderRadius, typography, transitions };
