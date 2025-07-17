import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-8 md:bottom-8 z-[150] p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          style={{
            backgroundColor: 'var(--button-bg, #3399ff)',
            color: 'white'
          }}
          aria-label="맨 위로 가기"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </>
  );
}