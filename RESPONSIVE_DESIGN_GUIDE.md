# 📱 Responsive Design Guide

Guiden visar hur du gör appen mobilanpassad för iPhone, Android och desktop.

## Vad är implementerat

✅ **useResponsive hook** - Detekterar skärmstorlek och enhet
✅ **responsive.css** - Globala media queries och utilities
✅ **Touch-optimering** - Större klickytor på mobil
✅ **iOS Safe Area** - Stöd för notch/dynamic island
✅ **Landscape-stöd** - Anpassar sig när du roterar enheten

## Snabbstart

### 1. Importera CSS (lägg till i App.js)

```javascript
import './styles/responsive.css';
```

### 2. Använd hook i komponenter

```javascript
import { useResponsive } from './hooks/useResponsive';

function MyComponent() {
  const { isMobile, isTablet, isIPhone, width } = useResponsive();

  return (
    <div style={{
      padding: isMobile ? '12px' : '24px',
      fontSize: isMobile ? '14px' : '16px'
    }}>
      {isMobile && <p>Du är på mobil!</p>}
      {isIPhone && <p>Du använder iPhone!</p>}
    </div>
  );
}
```

## Användningsexempel

### Exempel 1: Responsiv Layout

```javascript
import { useResponsive } from '../hooks/useResponsive';

function Dashboard() {
  const { isMobile, isTablet } = useResponsive();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile
        ? '1fr'  // 1 kolumn på mobil
        : isTablet
          ? 'repeat(2, 1fr)'  // 2 kolumner på surfplatta
          : 'repeat(3, 1fr)', // 3 kolumner på desktop
      gap: isMobile ? '12px' : '24px'
    }}>
      {/* Innehåll */}
    </div>
  );
}
```

### Exempel 2: Dölj/Visa baserat på enhet

```javascript
function Header() {
  const { isMobile } = useResponsive();

  return (
    <header>
      <h1>AIO Arbetsorder</h1>

      {/* Visa hamburger-meny på mobil */}
      {isMobile ? (
        <button>☰</button>
      ) : (
        <nav>
          <a href="/orders">Ordrar</a>
          <a href="/schedule">Schema</a>
          <a href="/reports">Rapporter</a>
        </nav>
      )}
    </header>
  );
}
```

### Exempel 3: Responsiva värden

```javascript
import { useResponsiveValue } from '../hooks/useResponsive';

function Card() {
  const padding = useResponsiveValue({
    mobile: '12px',
    tablet: '20px',
    desktop: '32px'
  });

  const columns = useResponsiveValue({
    mobile: 1,
    tablet: 2,
    desktop: 3
  });

  return (
    <div style={{ padding }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`
      }}>
        {/* Innehåll */}
      </div>
    </div>
  );
}
```

### Exempel 4: Modal anpassad för mobil

```javascript
function Modal({ isOpen, onClose, children }) {
  const { isMobile, width, height } = useResponsive();

  return isOpen && (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? 0 : '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: isMobile ? 0 : '12px',
        width: isMobile ? '100%' : 'min(600px, 90%)',
        height: isMobile ? '100%' : 'auto',
        maxHeight: isMobile ? '100%' : '90vh',
        overflow: 'auto',
        padding: isMobile ? '16px' : '32px'
      }}>
        {children}
      </div>
    </div>
  );
}
```

## CSS Utility Classes

### Visa/Dölj baserat på enhet

```html
<!-- Dölj på mobil -->
<div className="hide-on-mobile">
  Visas endast på surfplatta/desktop
</div>

<!-- Visa endast på mobil -->
<div className="show-on-mobile">
  Visas endast på mobil
</div>

<!-- Dölj på surfplatta -->
<div className="hide-on-tablet">
  Visas på mobil och desktop
</div>
```

### Responsiv flex direction

```html
<!-- Kolumn på mobil, rad på desktop -->
<div className="flex-col-mobile" style={{ display: 'flex' }}>
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

## Touch-optimering

### Större klickytor på mobil

```javascript
function Button({ children, onClick }) {
  const { isMobile } = useResponsive();

  return (
    <button style={{
      minHeight: isMobile ? '44px' : '36px',  // iOS recommended: 44px
      minWidth: isMobile ? '44px' : 'auto',
      padding: isMobile ? '12px 20px' : '8px 16px',
      fontSize: isMobile ? '16px' : '14px'
    }} onClick={onClick}>
      {children}
    </button>
  );
}
```

### Input fields - förhindra zoom på iOS

```javascript
// Font-size på minst 16px förhindrar auto-zoom på iOS
<input style={{
  fontSize: '16px',  // Viktigt för iOS!
  padding: '12px'
}} />
```

## iOS-specifika fixes

### Safe Area Insets (för notch/dynamic island)

CSS är redan konfigurerad i `responsive.css`:

```css
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Förhindra bounce-scroll

```css
body {
  overscroll-behavior: none;
}
```

## Vanliga Use Cases

### OrderDetails - Responsiv layout

```javascript
function OrderDetails() {
  const { isMobile } = useResponsive();

  return (
    <div style={{
      padding: isMobile ? '16px' : '32px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{
        display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
        gap: isMobile ? '16px' : '32px'
      }}>
        <div>Huvudinnehåll</div>
        <div>Sidebar</div>
      </div>
    </div>
  );
}
```

### Schema - Stack på mobil

```javascript
function Schema() {
  const { isMobile } = useResponsive();

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: '16px'
    }}>
      <aside style={{
        width: isMobile ? '100%' : '300px',
        order: isMobile ? 2 : 1  // Sidebar flyttas ner på mobil
      }}>
        Sidebar
      </aside>

      <main style={{
        flex: 1,
        order: isMobile ? 1 : 2  // Kalender först på mobil
      }}>
        <FullCalendar />
      </main>
    </div>
  );
}
```

### Dashboard Cards - Responsive Grid

```javascript
function Dashboard() {
  return (
    <div className="grid-responsive" style={{
      display: 'grid',
      gap: '16px'
      // grid-template-columns hanteras av responsive.css:
      // 1 kolumn på mobil (0-640px)
      // 2 kolumner på surfplatta (641-1024px)
      // 3 kolumner på desktop (1025px+)
    }}>
      <Card />
      <Card />
      <Card />
    </div>
  );
}
```

## Testing på olika enheter

### Chrome DevTools

1. Öppna DevTools (F12)
2. Klicka på "Toggle device toolbar" (Ctrl+Shift+M)
3. Välj enhet: iPhone 14, iPad Pro, etc.
4. Testa både portrait och landscape

### Safari Responsive Design Mode

1. Öppna Safari
2. Develop → Enter Responsive Design Mode
3. Välj olika iOS-enheter

### Verkliga enheter

Testa alltid på riktiga enheter:
- iPhone (Safari)
- Android phone (Chrome)
- iPad
- Android tablet

## Breakpoints

```
Mobile:   0-640px    (iPhone, Android phones)
Tablet:   641-1024px (iPad, Android tablets)
Desktop:  1025-1280px (Laptops)
Wide:     1281px+    (Desktop monitors)
```

## Best Practices

✅ **Mobile-first**: Designa för mobil först, lägg till features för desktop
✅ **Touch targets**: Minst 44x44px på mobila enheter
✅ **Font sizes**: Minst 16px på inputs för att undvika zoom på iOS
✅ **Safe areas**: Använd env() för iOS notch/dynamic island
✅ **Test på riktiga enheter**: Emulatorer är inte perfekta
✅ **Performance**: Mindre bilder och lazy loading på mobil

## Vanliga Problem & Lösningar

### Problem: Innehåll är för smalt på desktop
**Lösning**: Använd max-width och centrering
```javascript
<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
```

### Problem: Text för liten på mobil
**Lösning**: Använd större font på mobil
```javascript
fontSize: isMobile ? '16px' : '14px'
```

### Problem: Modal täcker hela skärmen på desktop
**Lösning**: Använd olika storlekar
```javascript
width: isMobile ? '100%' : 'min(600px, 90%)'
```

### Problem: Sidebar tar för mycket plats på mobil
**Lösning**: Gör den collapsible eller stack vertikalt
```javascript
flexDirection: isMobile ? 'column' : 'row'
```

---

**Tips**: Börja med att göra en komponent i taget responsiv. Testa ofta på riktiga enheter!
