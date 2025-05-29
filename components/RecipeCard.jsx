import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

/* 별점 한 줄 */
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

/* YouTube ID 추출 */
function extractYouTubeId(url = '') {
  const m = url.match(/(?:youtube\.com.*[?&]v=|youtu\.be\/)([^&?/]+)/);
  return m && m[1] ? m[1] : '';
}

export default function RecipeCard({ recipe }) {
  /* 필드 이름이 다를 때 대응 */
  const {
    title,
    description,
    imageUrl,
    youtubeUrl,
    cookingTime,            // 표준 필드
    cookTime,               // 예전/다른 이름
    difficulty = 0,
    rating,                 // 표준: 맛 평가
    taste,                  // 예전/다른 이름
    authorName,
    authorAvatar,
  } = recipe;

  /* 최종 값 매핑 */
  const minutes = cookingTime ?? cookTime ?? '';
  const tasteValue = rating ?? taste ?? 0;

  return (
    <article className="bg-neutral-900 text-neutral-100 rounded-xl p-6 shadow-md space-y-4">
      {/* ─── 상단: 작성자 + 별점 ─── */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          {authorAvatar && (
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <span className="font-semibold">{authorName}</span>
        </div>
        <div className="space-y-1 text-xs text-right">
          <div>
            <span className="mr-1 text-neutral-400">난이도</span>
            <StarRow value={difficulty} />
          </div>
          <div>
            <span className="mr-1 text-neutral-400">맛</span>
            <StarRow value={tasteValue} />
          </div>
        </div>
      </div>

      {/* ─── 제목 ─── */}
      <h2 className="text-xl font-bold">{title}</h2>

      {/* ─── 설명 ─── */}
      <p className="leading-relaxed whitespace-pre-wrap">{description}</p>

      {/* ─── 조리 시간 ─── */}
      {minutes !== '' && (
        <div className="text-sm text-neutral-400">🕒 {minutes}분 소요</div>
      )}

      {/* ─── 썸네일 or YouTube ─── */}
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
