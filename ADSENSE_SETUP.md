# Google AdSense 설정 가이드

## 광고 슬롯 ID 교체 필요

현재 코드에서 다음 부분들을 실제 Google AdSense 광고 슬롯 ID로 교체해야 합니다:

### 1. 사이드바 광고 (160x600)
**파일**: `pages/_app.js`
**위치**: 163번째 줄
```javascript
<GoogleAdsense 
  slot="YOUR_SIDE_AD_SLOT"  // <- 여기를 실제 슬롯 ID로 변경
  format="vertical"
  style={{ width: '160px', height: '600px' }}
/>
```

### 2. PC 하단 배너 광고 (728x90)
**파일**: `pages/_app.js`
**위치**: 311번째 줄
```javascript
<GoogleAdsense 
  slot="YOUR_BOTTOM_AD_SLOT"  // <- 여기를 실제 슬롯 ID로 변경
  format="horizontal"
  style={{ width: '100%', height: '90px' }}
/>
```

### 3. 모바일 인피드 광고
**파일**: `pages/index.js`
**위치**: 446번째 줄
```javascript
<GoogleAdsense 
  slot="YOUR_MOBILE_INFEED_SLOT"  // <- 여기를 실제 슬롯 ID로 변경
  format="auto"
  style={{ width: '100%', minHeight: '100px' }}
  responsive={true}
/>
```

## Google AdSense에서 광고 단위 만들기

1. [Google AdSense](https://www.google.com/adsense/) 대시보드 접속
2. **광고 > 광고 단위** 메뉴 클릭
3. 각 광고 유형별로 새 광고 단위 생성:
   - **디스플레이 광고** (사이드바, PC 하단용)
   - **인피드 광고** (모바일 레시피 사이용)
4. 생성된 광고 코드에서 `data-ad-slot="숫자"` 부분의 숫자를 복사
5. 위의 코드에서 해당 슬롯 ID로 교체

## 주의사항
- 광고가 실제로 표시되려면 사이트가 Google AdSense 승인을 받아야 합니다
- 개발 환경에서는 광고가 제대로 표시되지 않을 수 있습니다
- 실제 광고는 프로덕션 환경에서 확인하세요