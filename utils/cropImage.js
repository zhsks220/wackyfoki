export default function getCroppedImg(file, croppedAreaPixels) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl); // 메모리 정리
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Blob 변환 실패'));
          }
        },
        'image/jpeg',
        0.9 // 품질 조절 (선택사항)
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl); // 오류 시도 정리
      reject(new Error('이미지 로딩 실패'));
    };
  });
}
