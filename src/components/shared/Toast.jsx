import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import { colors, shadows, borderRadius, spacing } from './theme';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: colors.success[50],
      border: colors.success[500],
      text: colors.success[700],
      icon: <CheckCircle size={20} />,
    },
    error: {
      bg: colors.error[50],
      border: colors.error[500],
      text: colors.error[700],
      icon: <AlertCircle size={20} />,
    },
    info: {
      bg: colors.primary[50],
      border: colors.primary[500],
      text: colors.primary[700],
      icon: <Info size={20} />,
    },
    warning: {
      bg: colors.warning[50],
      border: colors.warning[500],
      text: colors.warning[700],
      icon: <AlertCircle size={20} />,
    },
  };

  const style = styles[type] || styles.info;

  return (
    <div
      className="toast-enter"
      style={{
        position: 'fixed',
        top: spacing[6],
        right: spacing[6],
        zIndex: 9999,
        backgroundColor: style.bg,
        border: `2px solid ${style.border}`,
        borderRadius: borderRadius.lg,
        padding: spacing[4],
        boxShadow: shadows.xl,
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        minWidth: '300px',
        maxWidth: '500px',
        animation: 'slideInRight 0.3s ease-out',
      }}
    >
      <div style={{ color: style.text, flexShrink: 0 }}>
        {style.icon}
      </div>
      <div style={{ flex: 1, color: style.text, fontWeight: 500 }}>
        {message}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: style.text,
            padding: spacing[1],
            display: 'flex',
            alignItems: 'center',
            borderRadius: borderRadius.base,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${style.border}20`}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
