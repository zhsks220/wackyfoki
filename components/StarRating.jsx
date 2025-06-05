import { useRef, useState, useEffect } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

export default function StarRating({ rating = 0, onRatingChange }) {
  const [currentRating, setCurrentRating] = useState(rating);
  const [isDragging, setIsDragging] = useState(false);
  const starRefs = useRef([]);

  useEffect(() => {
    setCurrentRating(rating);
  }, [rating]);

  const getRatingFromClientX = (clientX) => {
    for (let i = 0; i < 5; i++) {
      const rect = starRefs.current[i]?.getBoundingClientRect();
      if (!rect) continue;
      const midX = rect.left + rect.width / 2;

      if (clientX < rect.left) continue;
      if (clientX <= midX) return i + 0.5;
      if (clientX <= rect.right) return i + 1;
    }
    return 5;
  };

  const handleMouseDown = (e) => {
    const newRating = getRatingFromClientX(e.clientX);
    setCurrentRating(newRating);
    setIsDragging(true);
    onRatingChange?.(newRating);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newRating = getRatingFromClientX(e.clientX);
    setCurrentRating(newRating);
    onRatingChange?.(newRating);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const newRating = getRatingFromClientX(touch.clientX);
    setCurrentRating(newRating);
    setIsDragging(true);
    onRatingChange?.(newRating);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const newRating = getRatingFromClientX(touch.clientX);
    setCurrentRating(newRating);
    onRatingChange?.(newRating);
  };

  const handleTouchEnd = () => {
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
          style={{ pointerEvents: 'none' }} // 이벤트는 부모 div에서 처리
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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
