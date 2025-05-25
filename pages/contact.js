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
          WackyFoki에 대해 궁금한 점이 있으신가요? 또는 제휴, 문제 신고, 피드백이 있으신가요?
          아래 이메일을 통해 언제든지 연락 주세요.
        </p>

        <div className="bg-[var(--card-bg)] text-[var(--card-text)] border border-[var(--border-color)] rounded-lg p-6 mt-6">
          <p className="text-lg font-semibold">📧 이메일</p>
          <p className="mt-1 select-all">contact@wackyfoki.com</p>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          ※ 현재는 이메일 문의만 받고 있으며, 추후 커뮤니티 기능이 추가될 예정입니다.
        </p>
      </div>
    </>
  );
}
