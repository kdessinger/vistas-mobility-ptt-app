import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.innerWidth <= MOBILE_BREAKPOINT ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      : false
  );

  useEffect(() => {
    const check = () => {
      setIsMobile(
        window.innerWidth <= MOBILE_BREAKPOINT ||
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          )
      );
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}
