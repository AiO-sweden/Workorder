# Modern Design System

Inspirerat av Mowin, Blikk & Seven Time. Detta design system innehåller moderna komponenter, färger, spacing och animationer.

## 🎨 Färgpalett

```javascript
import { colors } from './theme';

// Primary colors
colors.primary[500] // #3b82f6
colors.success[500] // #22c55e
colors.warning[500] // #f97316
colors.error[500]   // #ef4444

// Gradients
colors.gradients.primary // Blue-purple gradient
colors.gradients.success // Green gradient
```

## 📏 Spacing

```javascript
import { spacing } from './theme';

spacing[4]  // 1rem (16px)
spacing[8]  // 2rem (32px)
spacing[12] // 3rem (48px)
```

## 🌟 Komponenter

### Badge
Status badges med olika varianter.

```jsx
import Badge from './components/shared/Badge';

<Badge variant="success">Godkänd</Badge>
<Badge variant="warning">Väntande</Badge>
<Badge variant="error">Fel</Badge>
<Badge variant="info">Info</Badge>
```

### Toast
Toast notifications som ersätter alerts.

```jsx
import Toast from './components/shared/Toast';
import { useState } from 'react';

function MyComponent() {
  const [showToast, setShowToast] = useState(false);

  return (
    <>
      <button onClick={() => setShowToast(true)}>Visa Toast</button>
      {showToast && (
        <Toast
          message="Data sparad!"
          type="success"
          onClose={() => setShowToast(false)}
          duration={3000}
        />
      )}
    </>
  );
}
```

### ActionButton
Moderna knappar med gradients och hover-effekter.

```jsx
import ActionButton from './components/shared/ActionButton';
import { Save } from 'lucide-react';

<ActionButton variant="primary" icon={<Save />} onClick={handleSave}>
  Spara
</ActionButton>

<ActionButton variant="success" onClick={handleSubmit}>
  Skicka
</ActionButton>

<ActionButton variant="danger" onClick={handleDelete}>
  Radera
</ActionButton>

<ActionButton variant="secondary" onClick={handleCancel}>
  Avbryt
</ActionButton>
```

### StatsCard
Visuellt tilltalande stats-kort för Dashboard.

```jsx
import StatsCard from './components/shared/StatsCard';
import { Users } from 'lucide-react';

<StatsCard
  icon={<Users size={24} />}
  label="Totalt antal kunder"
  value="156"
  trend="up"
  trendValue="+12%"
  gradient="blue"
/>
```

### LoadingSpinner
Spinner med animation.

```jsx
import LoadingSpinner from './components/shared/LoadingSpinner';

<LoadingSpinner message="Laddar data..." size={48} />
```

## ✨ Animationer

Använd CSS-klasserna från animations.css:

```jsx
// Fade in
<div className="page-enter">Content</div>

// Slide in från höger
<div className="toast-enter">Notification</div>

// Card entrance
<div className="card-enter">Card content</div>

// Hover lift effect
<div className="hover-lift">Hoverable card</div>
```

## 🎯 Shadows

```javascript
import { shadows } from './theme';

// Liten skugga
boxShadow: shadows.sm

// Medium skugga
boxShadow: shadows.md

// Stor skugga
boxShadow: shadows.lg

// Glow effect
boxShadow: shadows.glow
```

## 📱 Responsiveness

Använd breakpoints från temat:

```javascript
import { breakpoints } from './theme';

// Mobile: < 640px
// Tablet: 640px - 1024px
// Desktop: > 1024px
```

## 📊 Charts (Recharts)

Exempel på hur man använder charts:

```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { colors } from './components/shared/theme';

const data = [
  { name: 'Jan', värde: 400 },
  { name: 'Feb', värde: 300 },
  { name: 'Mar', värde: 600 },
];

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="värde" stroke={colors.primary[500]} strokeWidth={3} />
  </LineChart>
</ResponsiveContainer>
```

## 🔄 Transitions

```javascript
import { transitions } from './theme';

// Fast transition
transition: `all ${transitions.fast}`

// Normal transition
transition: `all ${transitions.base}`

// Slow transition
transition: `all ${transitions.slow}`

// Bounce effect
transition: `all ${transitions.bounce}`
```

## 💡 Best Practices

1. **Använd komponenter istället för inline styles** där det är möjligt
2. **Använd theme-värden** istället för hardcoded färger och spacing
3. **Lägg till animationer** för bättre UX (card-enter, hover-lift, etc.)
4. **Använd Toast** istället för alert()
5. **Använd Badge** för status-indikatorer
6. **Använd StatsCard** för visuella nyckeltal

## 📦 Exempel: Modernisera en sida

**Före:**
```jsx
<div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px' }}>
  <button onClick={handleSave} style={{ backgroundColor: '#3b82f6' }}>
    Spara
  </button>
</div>
```

**Efter:**
```jsx
import { cardStyle } from './components/shared/styles';
import ActionButton from './components/shared/ActionButton';
import { Save } from 'lucide-react';

<div style={cardStyle} className="card-enter">
  <ActionButton variant="primary" icon={<Save />} onClick={handleSave}>
    Spara
  </ActionButton>
</div>
```
