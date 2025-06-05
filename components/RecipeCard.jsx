import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { useTranslation } from 'next-i18next';

/* 별점 한 줄 -------------------------------------------------- */
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

/* YouTube ID 추출 -------------------------------------------- */
function extractYouTubeId(url = '') {
  const m = url.match(/(?:youtube\.com.*[?&]v=|youtu\.be\/)([^&?\/]+)/);
  return m && m[1] ? m[1] : '';
}

/* 레시피 카드 -------------------------------------------------- */
export default function RecipeCard({ recipe }) {
  const { t } = useTranslation('common');

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
    authorAvatar,
    ingredients = '',
    materials: _materials,
  } = recipe;

  /* 준비물 필드 통일 */
  const materials = Array.isArray(_materials)
    ? _materials
    : ingredients
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  const minutes     = cookingTime ?? cookTime ?? '';
  const tasteValue  = rating ?? taste ?? 0;
  const displayName = authorName || t('anonymous');

  return (
    <article
      className="rounded-xl p-6 shadow-md space-y-4 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--recipe-card-bg)',
        color:          'var(--recipe-card-text)',
      }}
    >
      {/* ── 상단: 작성자 + 별점 ── */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          {authorAvatar && (
            <img
              src={authorAvatar}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <span className="font-semibold">{displayName}</span>
        </div>

        <div className="space-y-1 text-xs text-right">
          <div>
            <span style={{ color: 'var(--border-color)' }} className="mr-1">
              {t('difficulty')}
            </span>
            <StarRow value={difficulty} />
          </div>
          <div>
            <span style={{ color: 'var(--border-color)' }} className="mr-1">
              {t('taste')}
            </span>
            <StarRow value={tasteValue} />
          </div>
        </div>
      </div>

      {/* ── 제목 ── */}
      <h2 className="text-xl font-bold">{title}</h2>

      {/* ── 준비물 ── */}
      {materials.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[var(--border-color)] text-sm text-neutral-600 dark:text-neutral-400">
          <span className="font-medium">{t('prepare_items')}:</span>{' '}
          {materials.join(', ')}
        </div>
      )}

      {/* ── 설명 ── */}
      <p className="leading-relaxed whitespace-pre-wrap">{description}</p>

      {/* ── 조리 시간 ── */}
      {minutes !== '' && (
        <div style={{ color: 'var(--border-color)' }} className="text-sm">
          🕒 {minutes}
          {t('cook_time')}
        </div>
      )}

      {/* ── 썸네일 / YouTube ── */}
      {youtubeUrl ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <iframe
            src={`https://www.youtube.com/embed/${extractYouTubeId(youtubeUrl)}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
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
