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

function extractYouTubeId(url = '') {
  const m = url.match(/(?:youtube\.com.*[?&]v=|youtu\.be\/)([^&?/]+)/);
  return m && m[1] ? m[1] : '';
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

  const {
    title,
    description,
    imageUrl,
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

  return (
    <article
      className="rounded-xl p-6 shadow-md space-y-4 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--recipe-card-bg)',
        color: 'var(--recipe-card-text)',
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <img
            src={avatar}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex flex-col">
            <span className="font-semibold">{displayName}</span>
            {timeAgo && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {timeAgo}
              </span>
            )}
          </div>
        </div>

        <div className="text-xs text-right space-y-1">
          <div>
            <span className="mr-1" style={{ color: 'var(--border-color)' }}>
              {t('difficulty')}
            </span>
            <StarRow value={difficulty} />
          </div>
          <div>
            <span className="mr-1" style={{ color: 'var(--border-color)' }}>
              {t('taste')}
            </span>
            <StarRow value={tasteValue} />
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold">{title}</h2>

      {materials.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[var(--border-color)] text-sm text-neutral-600 dark:text-neutral-400">
          <span className="font-medium">{t('prepare_items')}:</span>{' '}
          {materials.join(', ')}
        </div>
      )}

      <p className="leading-relaxed whitespace-pre-wrap">{description}</p>

      {minutes !== '' && (
        <div className="text-sm" style={{ color: 'var(--border-color)' }}>
          🕒 {t('cook_time_full', { count: minutes })}
        </div>
      )}

      {youtubeUrl ? (
        <>
          <div className="aspect-video w-full overflow-hidden rounded-lg">
            <iframe
              src={`https://www.youtube.com/embed/${extractYouTubeId(youtubeUrl)}`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            📌 {t('source')}:{" "}
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
      ) : (
        imageUrl && (
          <img
            src={imageUrl}
            alt={title}
            className="w-full rounded-lg object-cover"
          />
        )
      )}
    </article>
  );
}
