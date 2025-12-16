import { badgeStyle, statusColors } from './styles';

export default function Badge({ children, variant = 'neutral', icon }) {
  const colors = statusColors[variant] || statusColors.neutral;

  return (
    <span style={{
      ...badgeStyle,
      backgroundColor: colors.bg,
      color: colors.text,
      border: `1px solid ${colors.border}`,
    }}>
      {icon && <span style={{ marginRight: '0.25rem' }}>{icon}</span>}
      {children}
    </span>
  );
}
