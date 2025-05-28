// pages/contact.js
import Head from 'next/head';

export default function ContactPage() {
  return (
    <>
      <Head>
        <title>Contact - WackyFoki</title>
        <meta name="description" content="WackyFoki에 문의하고 싶으신가요? 언제든지 연락 주세요." />
      </Head>

      <div className="max-w-3xl mx-auto px-6 py-12 text-[var(--foreground)]">
        <h1 className="text-3xl font-bold mb-6">📬 Contact Us</h1>

        <p className="mb-4 text-lg leading-relaxed">
          WackyFoki에 대해 궁금한 점이 있으신가요? 제휴 문의, 문제 신고, 피드백은 아래 이메일을 통해 언제든지 연락 주세요.
        </p>

        <div className="bg-[var(--card-bg)] text-[var(--card-text)] border border-[var(--border-color)] rounded-lg p-6 mt-6">
          <p className="text-lg font-semibold">📧 이메일</p>
          <p className="mt-1 select-all">
            <a href="mailto:contact@wackyfoki.com" className="underline text-blue-500">contact@wackyfoki.com</a>
          </p>
        </div>

        <h2 className="text-2xl font-semibold mt-10 mb-4">👤 운영자 정보</h2>
        <p className="text-base leading-relaxed">
          본 사이트는 <strong>오리진 (OriJin)</strong>이 개인적으로 운영하고 있으며, 현재는 테스트 중인 프로젝트입니다.
          모든 문의는 <a href="mailto:contact@wackyfoki.com" className="underline text-blue-500">contact@wackyfoki.com</a> 으로 받습니다.
        </p>

        <p className="text-sm text-gray-500 mt-8">
          ※ 회신은 평일 기준 1~2일 이내에 드릴 수 있습니다.
        </p>
      </div>
    </>
  );
}
