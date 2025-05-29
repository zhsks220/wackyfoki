import { useRef, useState, useEffect } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

export default function StarRating({ rating = 0, onRatingChange }) {
  const [currentRating, setCurrentRating] = useState(rating);
  const [isDragging, setIsDragging] = useState(false);
  const starRefs = useRef([]);

  useEffect(() => {
    setCurrentRating(rating);
  }, [rating]);

  const getRatingFromMouse = (e) => {
    for (let i = 0; i < 5; i++) {
      const rect = starRefs.current[i].getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      const mouseX = e.clientX;

      if (mouseX < rect.left) continue;
      if (mouseX <= midX) return i + 0.5;
      if (mouseX <= rect.right) return i + 1;
    }
    return 5; // fallback
  };

  const handleMouseDown = (e) => {
    const newRating = getRatingFromMouse(e);
    setCurrentRating(newRating);
    setIsDragging(true);
    if (onRatingChange) onRatingChange(newRating);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newRating = getRatingFromMouse(e);
    setCurrentRating(newRating);
    if (onRatingChange) onRatingChange(newRating);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const index = i + 1;
      const isFull = index <= currentRating;
      const isHalf = !isFull && index - 0.5 === currentRating;

      return (
        <span
          key={i}
          ref={(el) => (starRefs.current[i] = el)}
          style={{ pointerEvents: 'none' }} // 이벤트는 부모에서만
        >
          {isFull ? (
            <FaStar />
          ) : isHalf ? (
            <FaStarHalfAlt />
          ) : (
            <FaRegStar />
          )}
        </span>
      );
    });
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        display: 'flex',
        cursor: 'pointer',
        userSelect: 'none',
        fontSize: '2rem',
      }}
    >
      {renderStars()}
    </div>
  );
}
