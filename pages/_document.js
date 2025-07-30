// pages/_document.js
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        {/* ✅ AdSense 사이트 소유 확인 코드 + 자동 광고 */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7735932028043375"
          crossOrigin="anonymous"
          data-ad-client="ca-pub-7735932028043375"
        ></script>


        {/* ✅ Google Fonts: Inter + Noto Sans KR */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Noto+Sans+KR:wght@400;700&display=swap"
          rel="stylesheet"
        />

        {/* ✅ 기존 favicon 유지 */}
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
