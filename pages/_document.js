// pages/_document.js
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        {/* ✅ AdSense 사이트 소유 확인 코드 */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7735932028043375"
          crossOrigin="anonymous"
        ></script>

        {/* ✅ Google Fonts: Inter + Noto Sans KR */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Noto+Sans+KR:wght@400;700&display=swap"
          rel="stylesheet"
        />

        {/* ✅ 기존 favicon 유지 */}
        <link rel="icon" href="/favicon.ico" />

        {/* ✅ 카카오 애드핏 스크립트 */}
        <script
          type="text/javascript"
          src="//t1.daumcdn.net/kas/static/ba.min.js"
          async
        ></script>
        
        {/* ✅ 카카오 픽셀 */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
              document,'script','//t1.daumcdn.net/adfit/static/kp.js');
              window.kakaoPixel = window.kakaoPixel || function() { (window.kakaoPixel.q = window.kakaoPixel.q || []).push(arguments); };
              // pageView는 나중에 호출하도록 제거
            `
          }}
        />
        
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
