import { spacing, borderRadius, transitions } from './theme';

export default function StatsCard({ icon, label, value, trend, trendValue, gradient, onClick, active }) {
  const gradientColors = {
    blue: 'rgba(59, 130, 246, 0.15)',
    green: 'rgba(16, 185, 129, 0.15)',
    orange: 'rgba(251, 146, 60, 0.15)',
    purple: 'rgba(139, 92, 246, 0.15)',
  };

  const iconColors = {
    blue: '#60a5fa',
    green: '#34d399',
    orange: '#fb923c',
    purple: '#a78bfa',
  };

  return (
    <div
      className="card-enter hover-lift"
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: borderRadius.xl,
        padding: spacing[6],
        boxShadow: active ? '0 25px 50px rgba(0, 0, 0, 0.4)' : '0 10px 30px rgba(0, 0, 0, 0.3)',
        border: active ? '2px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: `all ${transitions.base}`,
        transform: active ? 'scale(1.02)' : 'scale(1)',
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
        background: gradient ? gradientColors[gradient] : 'rgba(255, 255, 255, 0.05)',
        opacity: 0.5,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], position: 'relative' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: borderRadius.lg,
          background: gradient ? gradientColors[gradient] : 'rgba(59, 130, 246, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: gradient ? iconColors[gradient] : '#60a5fa',
        }}>
          {icon}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#94a3b8',
            marginBottom: spacing[1],
          }}>
            {label}
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#fff',
          }}>
            {value}
          </div>
          {trend && (
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: trend === 'up' ? '#34d399' : '#f87171',
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
