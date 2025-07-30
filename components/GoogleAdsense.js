import { useEffect, useState } from 'react';

export default function GoogleAdsense({ 
  slot, 
  format = 'auto', 
  responsive = true,
  style = {},
  className = ''
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        // 광고가 이미 로드되었는지 확인
        const ads = document.getElementsByClassName('adsbygoogle');
        const currentAd = ads[ads.length - 1];
        
        if (currentAd && currentAd.innerHTML === '' && currentAd.offsetWidth > 0) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, [mounted, slot]);

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
    />
  );
}