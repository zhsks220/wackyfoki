export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-6">개인정보 처리방침</h1>

      <p className="mb-4">
        WackyFoki(이하 ‘서비스’)는 이용자의 개인정보를 중요시하며, 『개인정보 보호법』을 준수합니다. 본 방침은 서비스가 이용자의 개인정보를 어떻게 수집, 이용, 보호하는지를 설명합니다.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">1. 수집하는 개인정보 항목</h2>
      <p className="mb-4">
        서비스는 Google 로그인 시 다음 정보를 수집합니다:
        <br />- 이름, 이메일 주소, 프로필 사진
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">2. 개인정보 수집 방법</h2>
      <p className="mb-4">
        서비스는 Google OAuth를 통해 사용자 인증 과정에서 개인정보를 수집합니다.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">3. 개인정보의 이용 목적</h2>
      <p className="mb-4">
        수집된 개인정보는 다음의 목적을 위해 사용됩니다:
        <br />- 로그인 및 사용자 식별
        <br />- 사용자 맞춤 콘텐츠 제공
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">4. 개인정보의 보유 및 이용기간</h2>
      <p className="mb-4">
        이용자가 서비스 탈퇴 시 또는 별도의 요청이 있을 경우, 해당 정보는 즉시 파기됩니다.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">5. 개인정보 제공</h2>
      <p className="mb-4">
        서비스는 이용자의 개인정보를 외부에 제공하지 않으며, 법적 요구가 있을 경우에만 예외적으로 제공할 수 있습니다.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">6. 쿠키(Cookie)의 운영</h2>
      <p className="mb-4">
        본 서비스는 광고 분석, 방문자 추적을 위해 Google Analytics 및 Google AdSense에서 제공하는 쿠키를 사용할 수 있습니다.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">7. 개인정보 보호책임자</h2>
      <p className="mb-4">
        개인정보 보호와 관련된 문의사항은 아래 이메일로 연락 주시기 바랍니다:
        <br />📧 <span className="underline">example@wackyfoki.com</span>
      </p>

      <p className="mt-12 text-sm text-gray-500">시행일: 2025년 5월 25일</p>
    </div>
  );
}
