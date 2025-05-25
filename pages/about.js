// pages/about.js
import Head from 'next/head';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About - WackyFoki</title>
        <meta name="description" content="WackyFoki는 전 세계의 기묘하고 독특한 레시피를 공유하는 플랫폼입니다." />
      </Head>

      <div className="max-w-3xl mx-auto px-6 py-12 text-[var(--foreground)]">
        <h1 className="text-3xl font-bold mb-6">🤪 WackyFoki란?</h1>

        <p className="mb-4 text-lg leading-relaxed">
          <strong>WackyFoki</strong>는 전 세계 사람들이 즐기는 기묘하고 독특한 레시피를 공유하는 커뮤니티 기반 플랫폼입니다.
          우리는 전통적인 맛의 경계를 넘나드는 창의적이고 엉뚱한 음식들을 기록하고, 즐겁게 나누는 공간을 지향합니다.
        </p>

        <p className="mb-4 text-lg leading-relaxed">
          누구나 쉽게 레시피를 업로드하고, 다른 사람들의 작품을 감상하고, 댓글과 좋아요로 반응을 남길 수 있습니다.
          음식의 모양이 이상하다고 해서 맛도 이상한 건 아니니까요!
        </p>

        <p className="mb-4 text-lg leading-relaxed">
          재미와 창의력을 바탕으로, 음식에 대한 새로운 시선을 나누고 싶은 분들께 열린 공간입니다. WackyFoki는 그런 순간들을 환영합니다.
        </p>

        <p className="text-sm text-gray-500 mt-8">
          ※ 본 플랫폼은 유저가 직접 작성한 콘텐츠를 기반으로 하며, 관리자는 부적절한 내용에 대해 사전 경고 없이 삭제할 수 있습니다.
        </p>
      </div>
    </>
  );
}
