// Spline 애니메이션 URL 상수 파일
// 모든 Spline URL을 한 곳에서 관리

export const SPLINE_URLS = {
    // 메인 배경 애니메이션 (MysticVisualizer 기본)
    MAIN_BACKGROUND: 'https://prod.spline.design/gjz7s8UmZl4fmUa7/scene.splinecode',

    // 헤더 작은 애니메이션 (ORBIT 로고 뒤)
    HEADER_LOGO: 'https://prod.spline.design/cecqF9q8Ct3dtFcA/scene.splinecode',

    // Spline Viewer 스크립트 URL (latest version)
    VIEWER_SCRIPT: 'https://unpkg.com/@splinetool/viewer@latest/build/spline-viewer.js',
};

export const SPLINE_CONFIG = {
    // 헤더 애니메이션 스케일
    HEADER_SCALE: 0.15,

    // 페이드인 애니메이션 시간 (ms)
    FADE_DURATION: 3000,

    // 로딩 타임아웃 (ms)
    LOADING_TIMEOUT: 10000,
};

export default SPLINE_URLS;
