import { useState, useEffect } from 'react';

/**
 * Breakpoints för responsive design
 */
const BREAKPOINTS = {
  mobile: 640,      // 0-640px (iPhone, Android phones)
  tablet: 1024,     // 641-1024px (iPad, Android tablets)
  desktop: 1280,    // 1025-1280px (laptops)
  wide: 1920        // 1281px+ (desktop monitors)
};

/**
 * Hook för att detektera skärmstorlek och enhet
 */
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isWide: false,
    // Specifika enheter
    isIOS: false,
    isAndroid: false,
    isIPhone: false,
    // Orientering
    isPortrait: true,
    isLandscape: false
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent;

      setScreenSize({ width, height });

      setDevice({
        // Skärmstorlekar
        isMobile: width <= BREAKPOINTS.mobile,
        isTablet: width > BREAKPOINTS.mobile && width <= BREAKPOINTS.tablet,
        isDesktop: width > BREAKPOINTS.tablet && width <= BREAKPOINTS.wide,
        isWide: width > BREAKPOINTS.wide,

        // Enhetstyper
        isIOS: /iPhone|iPad|iPod/.test(userAgent),
        isAndroid: /Android/.test(userAgent),
        isIPhone: /iPhone/.test(userAgent),

        // Orientering
        isPortrait: height > width,
        isLandscape: width > height
      });
    };

    // Kör en gång vid mount
    handleResize();

    // Lyssna på resize-events
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return {
    ...screenSize,
    ...device,
    // Hjälpfunktioner
    isMobileOrTablet: device.isMobile || device.isTablet,
    isSmallScreen: screenSize.width <= BREAKPOINTS.tablet
  };
};

/**
 * Hook för att få responsiva värden
 * @param {Object} values - Objekt med värden för olika skärmstorlekar
 * @returns {any} - Värdet för nuvarande skärmstorlek
 *
 * @example
 * const padding = useResponsiveValue({ mobile: '10px', tablet: '20px', desktop: '30px' });
 */
export const useResponsiveValue = (values) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  if (isMobile && values.mobile !== undefined) return values.mobile;
  if (isTablet && values.tablet !== undefined) return values.tablet;
  if (isDesktop && values.desktop !== undefined) return values.desktop;
  if (values.wide !== undefined) return values.wide;

  // Fallback till desktop eller första värdet
  return values.desktop || values.tablet || values.mobile || Object.values(values)[0];
};

/**
 * Enkel mediaquery hook
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

// Export breakpoints för användning i styled components eller direkta queries
export { BREAKPOINTS };
