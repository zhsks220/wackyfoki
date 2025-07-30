import { useEffect, useState } from 'react';

export default function GoogleAdsense({ 
  slot, 
  format = 'auto', 
  responsive = true,
  style = {},
  className = '',
  layoutKey = null
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (error) {
        console.error('AdSense error:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [mounted]);

  if (!mounted) {
    return <div style={{ ...style }} className={className} />;
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: 'block', ...style }}
      data-ad-client="ca-pub-7735932028043375"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive.toString()}
      {...(layoutKey && { 'data-ad-layout-key': layoutKey })}
    />
  );
}