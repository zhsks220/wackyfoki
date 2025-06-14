import { useEffect, useRef, useState } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

function StarRow({ value = 0 }) {
  const v = Number(value) || 0;
  return (
    <div className="flex text-yellow-400 text-sm">
      {Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        const full = n <= v;
        const half = !full && n - 0.5 === v;
        return (
          <span key={i}>
            {full ? <FaStar /> : half ? <FaStarHalfAlt /> : <FaRegStar />}
          </span>
        );
      })}
    </div>
  );
}

function getYouTubeEmbedUrl(url = '') {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?/]+)/);
  const videoId = match?.[1];
  return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
}

function formatSmartTime(date, t) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years >= 1) return t('time_year', { count: years });
  if (months >= 1) return t('time_month', { count: months });
  if (weeks >= 1) return t('time_week', { count: weeks });
  if (days >= 1) return t('time_day', { count: days });
  if (hours >= 1) return t('time_hour', { count: hours });
  if (minutes >= 1) return t('time_minute', { count: minutes });
  return t('time_just_now');
}

export default function RecipeCard({ recipe }) {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const {
    title,
    description,
    descriptions = [],
    imageUrls = [],
    youtubeUrl,
    cookingTime,
    cookTime,
    difficulty = 0,
    rating,
    taste,
    authorName,
    authorImage,
    createdAt,
    ingredients = '',
    materials: _materials,
  } = recipe;

  const materials = Array.isArray(_materials)
    ? _materials
    : ingredients.split(',').map((i) => i.trim()).filter(Boolean);

  const minutes = cookingTime ?? cookTime ?? '';
  const tasteValue = rating ?? taste ?? 0;
  const displayName = authorName || t('anonymous');
  const avatar = authorImage && authorImage.trim() !== '' ? authorImage : '/default-avatar.png';
  const timeAgo = createdAt?.toDate?.() ? formatSmartTime(createdAt.toDate(), t) : null;

  // ✅ 이미지 로딩 감지하여 overflow 체크
  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const height = textRef.current.scrollHeight;
        setIsOverflowing(height > 650);
      }
    };

    const images = textRef.current?.querySelectorAll('img') || [];
    let loadedCount = 0;

    if (images.length === 0) {
      checkOverflow();
    } else {
      images.forEach((img) => {
        if (img.complete) {
          loadedCount++;
          if (loadedCount === images.length) checkOverflow();
        } else {
          const onLoadOrError = () => {
            loadedCount++;
            if (loadedCount === images.length) checkOverflow();
          };
          img.addEventListener('load', onLoadOrError);
          img.addEventListener('error', onLoadOrError);
        }
      });
    }
  }, [recipe]);

  return (
    <article
      className="relative rounded-xl p-6 shadow-md transition-colors duration-300 space-y-4"
      style={{
        backgroundColor: 'var(--recipe-card-bg)',
        color: 'var(--recipe-card-text)',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <img src={avatar} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
          <div className="flex flex-col">
            <span className="font-semibold">{displayName}</span>
            {timeAgo && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</span>
            )}
          </div>
        </div>
        <div className="text-xs text-right space-y-1">
          <div>
            <span className="mr-1" style={{ color: 'var(--border-color)' }}>{t('difficulty')}</span>
            <StarRow value={difficulty} />
          </div>
          <div>
            <span className="mr-1" style={{ color: 'var(--border-color)' }}>{t('taste')}</span>
            <StarRow value={tasteValue} />
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold">{title}</h2>

      {materials.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[var(--border-color)] text-sm text-neutral-600 dark:text-neutral-400">
          <span className="font-medium">{t('prepare_items')}:</span> {materials.join(', ')}
        </div>
      )}

      {/* ✅ 글/이미지 영역 (제한됨) */}
      <div className="relative">
        <div
          ref={textRef}
          className={`${isOverflowing ? 'max-h-[450px] overflow-hidden' : ''} space-y-4`}
        >
          {description && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap mt-2">{description}</p>
          )}

          {minutes !== '' && (
            <div className="text-sm" style={{ color: 'var(--border-color)' }}>
              🕒 {t('cook_time_full', { count: minutes })}
            </div>
          )}

          {imageUrls.length > 0 &&
            imageUrls.map((url, i) => (
              <div key={i} className="space-y-2">
                <img src={url} alt={`step-${i}`} className="w-full rounded-lg object-cover" />
                {descriptions[i] && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{descriptions[i]}</p>
                )}
              </div>
            ))}
        </div>

        {/* ✅ 그라데이션은 글/이미지 영역 안쪽에만 */}
        {isOverflowing && (
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[var(--recipe-card-bg)] to-transparent pointer-events-none z-10" />
        )}
      </div>

      {/* ✅ 유튜브는 항상 완전 노출 + 글 아래 */}
      {youtubeUrl && (
        <>
          <div className="aspect-video w-full overflow-hidden rounded-lg mt-4 relative z-20">
            <iframe
              src={getYouTubeEmbedUrl(youtubeUrl)}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 relative z-20">
            📌 {t('source')}:{' '}
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-600"
            >
              {t('youtube_link')}
            </a>
          </div>
        </>
      )}
    </article>
  );
}
