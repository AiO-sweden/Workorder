import { useState, useEffect } from 'react';

/**
 * Custom hook för att detektera enhetstyp
 * @returns {Object} - Objekt med information om enheten
 */
export const useDeviceDetection = () => {
  const [device, setDevice] = useState({
    isIPhone: false,
    isIPad: false,
    isIOS: false,
    isAndroid: false,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isSafari: false,
    osVersion: null
  });

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // Detektera iPhone
    const isIPhone = /iPhone/.test(userAgent);

    // Detektera iPad
    const isIPad = /iPad/.test(userAgent) ||
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Detektera iOS generellt
    const isIOS = isIPhone || isIPad || /iPod/.test(userAgent);

    // Detektera Android
    const isAndroid = /Android/.test(userAgent);

    // Detektera Safari
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);

    // Detektera mobil (inklusive iPhone)
    const isMobile = /Mobi|Android|iPhone|iPod/.test(userAgent);

    // Detektera surfplatta
    const isTablet = /iPad|Android(?!.*Mobile)/.test(userAgent);

    // Desktop är allt som inte är mobil eller surfplatta
    const isDesktop = !isMobile && !isTablet;

    // Hämta iOS version om det är iOS
    let osVersion = null;
    if (isIOS) {
      const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
      if (match) {
        osVersion = `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}`;
      }
    }

    setDevice({
      isIPhone,
      isIPad,
      isIOS,
      isAndroid,
      isMobile,
      isTablet,
      isDesktop,
      isSafari,
      osVersion
    });
  }, []);

  return device;
};

// Hjälpfunktioner som kan användas direkt
export const detectDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  return {
    isIPhone: /iPhone/.test(userAgent),
    isIPad: /iPad/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    isIOS: /iPhone|iPad|iPod/.test(userAgent),
    isAndroid: /Android/.test(userAgent),
    isMobile: /Mobi|Android|iPhone|iPod/.test(userAgent),
    isTablet: /iPad|Android(?!.*Mobile)/.test(userAgent),
    isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent)
  };
};

// Enkel hjälpfunktion för endast iPhone-detektion
export const isIPhone = () => {
  return /iPhone/.test(navigator.userAgent);
};

// PWA-detektion (om appen körs som installerad app)
export const isStandalone = () => {
  return window.navigator.standalone === true ||
         window.matchMedia('(display-mode: standalone)').matches;
};
