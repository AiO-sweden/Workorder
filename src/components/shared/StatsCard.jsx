import { colors, spacing, shadows, borderRadius, transitions } from './theme';

export default function StatsCard({ icon, label, value, trend, trendValue, gradient, onClick, active }) {
  const gradients = {
    blue: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    green: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
    orange: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    purple: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  };

  return (
    <div
      className="card-enter hover-lift"
      onClick={onClick}
      style={{
        background: gradient ? gradients[gradient] : 'white',
        borderRadius: borderRadius.xl,
        padding: spacing[6],
        boxShadow: active ? shadows.lg : shadows.md,
        border: gradient ? 'none' : `1px solid ${colors.neutral[200]}`,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: `all ${transitions.base}`,
        transform: active ? 'scale(1.02)' : 'scale(1)',
        outline: active ? `3px solid ${colors.primary[300]}` : 'none',
        outlineOffset: '2px',
      }}
    >
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: gradient ? 'rgba(255, 255, 255, 0.1)' : colors.neutral[100],
        opacity: 0.5,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], position: 'relative' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: borderRadius.lg,
          background: gradient ? 'rgba(255, 255, 255, 0.2)' : colors.primary[100],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: gradient ? 'white' : colors.primary[600],
        }}>
          {icon}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: gradient ? 'rgba(255, 255, 255, 0.9)' : colors.neutral[600],
            marginBottom: spacing[1],
          }}>
            {label}
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: gradient ? 'white' : colors.neutral[900],
          }}>
            {value}
          </div>
          {trend && (
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: trend === 'up' ? colors.success[500] : colors.error[500],
              marginTop: spacing[1],
            }}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
