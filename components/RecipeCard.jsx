import { useEffect, useRef, useState } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

/* ───── 유틸 ─────────────────────────────────────────────── */
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
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?/]+)/);
  return m?.[1] ? `https://www.youtube.com/embed/${m[1]}` : '';
}

function formatSmartTime(date, t) {
  const now   = new Date();
  const diff  = now - date;
  const min   = Math.floor(diff / 60000);
  const hrs   = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  const mon   = Math.floor(days / 30);
  const yrs   = Math.floor(days / 365);

  if (yrs  >= 1) return t('time_year',   { count: yrs  });
  if (mon  >= 1) return t('time_month',  { count: mon  });
  if (weeks>= 1) return t('time_week',   { count: weeks});
  if (days >= 1) return t('time_day',    { count: days });
  if (hrs  >= 1) return t('time_hour',   { count: hrs  });
  if (min  >= 1) return t('time_minute', { count: min  });
  return t('time_just_now');
}

/* ───── 메인 컴포넌트 ─────────────────────────────────────── */
export default function RecipeCard({ recipe }) {
  const { t }      = useTranslation('common');
  const textRef    = useRef(null);
  const [overflow, setOverflow] = useState(false);

  const {
    title,
    description,
    descriptions = [],
    imageUrls    = [],
    youtubeUrl,
    cookingTime,
    cookTime,
    difficulty   = 0,
    rating,
    taste,
    authorName,
    authorImage,
    createdAt,
    ingredients  = '',
    materials: _mat,
  } = recipe;

  /* ------- 파생 데이터 -------- */
  const materials  = Array.isArray(_mat)
    ? _mat
    : ingredients.split(',').map(s => s.trim()).filter(Boolean);

  const minutes    = cookingTime ?? cookTime ?? '';
  const tasteValue = rating ?? taste ?? 0;
  const name       = authorName || t('anonymous');
  const avatar     = authorImage?.trim() ? authorImage : '/default-avatar.png';
  const timeAgo    = createdAt?.toDate?.() ? formatSmartTime(createdAt.toDate(), t) : null;

  /* ------- overflow 체크 -------- */
  useEffect(() => {
    const check = () => {
      if (textRef.current) setOverflow(textRef.current.scrollHeight > 650);
    };

    const imgs = textRef.current?.querySelectorAll('img') || [];
    if (!imgs.length) return check();

    let done = 0;
    imgs.forEach(img => {
      const cb = () => { if (++done === imgs.length) check(); };
      img.complete ? cb() : (img.onload = img.onerror = cb);
    });
  }, [recipe]);

  /* ── render ────────────────────────────────────────────── */
  return (
    <article
      className="relative rounded-xl p-6 shadow-md transition-colors duration-300 space-y-4 recipe-card overflow-hidden"
    >
      {/* 헤더 */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover" />
          <div className="flex flex-col">
            <span className="font-semibold">{name}</span>
            {timeAgo && (
              <span style={{ color: 'var(--border-color)', fontSize: '0.75rem' }}>
                {timeAgo}
              </span>
            )}
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', textAlign: 'right', lineHeight: 1.2 }}>
          <div>
            <span style={{ marginRight: 4, color: 'var(--border-color)' }}>
              {t('difficulty')}
            </span>
            <StarRow value={difficulty} />
          </div>
          <div>
            <span style={{ marginRight: 4, color: 'var(--border-color)' }}>
              {t('taste')}
            </span>
            <StarRow value={tasteValue} />
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold">{title}</h2>

      {materials.length > 0 && (
        <div
          className="mt-2 pt-2 text-sm"
          style={{ borderTop: '1px solid var(--border-color)', color: 'var(--border-color)' }}
        >
          <span className="font-medium">{t('prepare_items')}:</span> {materials.join(', ')}
        </div>
      )}

      {/* 본문 */}
      <div className="relative">
        <div
          ref={textRef}
          className={overflow ? 'max-h-[450px] overflow-hidden space-y-4' : 'space-y-4'}
        >
          {description && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap mt-2">{description}</p>
          )}

          {minutes !== '' && (
            <div className="text-sm" style={{ color: 'var(--border-color)' }}>
              🕒 {t('cook_time_full', { count: minutes })}
            </div>
          )}

          {imageUrls.map((url, i) => (
            <div key={i} className="space-y-2">
              <img src={url} alt={`step-${i}`} className="w-full rounded-lg object-cover" />
              {descriptions[i] && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {descriptions[i]}
                </p>
              )}
            </div>
          ))}
        </div>

        {overflow && (
          <div
            className="absolute bottom-0 left-0 w-full h-24 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to top, var(--recipe-card-bg), transparent)',
              WebkitBackgroundImage:
                'linear-gradient(to top, var(--recipe-card-bg), transparent)',
            }}
          />
        )}
      </div>

      {/* YouTube */}
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

          <div
            className="mt-2 text-sm relative z-20"
            style={{ color: 'var(--border-color)' }}
          >
            📌 {t('source')}:&nbsp;
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:brightness-125"
              style={{ color: 'var(--card-text)' }}
            >
              {t('youtube_link')}
            </a>
          </div>
        </>
      )}
    </article>
  );
}
