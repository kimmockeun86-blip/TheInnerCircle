// API 설정 파일
// 로컬 터널(Ngrok/Localtunnel)을 사용할 때 이 주소를 변경하세요.

// 1. 현재 사용할 모드를 선택하세요 ('local', 'tunnel', 'production')
const MODE: 'local' | 'tunnel' | 'production' = 'tunnel';

// 2. 각 모드별 주소 설정
const CONFIG = {
    local: {
        // 로컬 테스트용 (에뮬레이터/웹)
        url: 'http://localhost:3000/api'
    },
    tunnel: {
        // 👉 여기에 Ngrok 또는 Localtunnel 주소를 입력하세요!
        // 예: 'https://your-tunnel-url.ngrok-free.app/api'
        url: 'https://theinnercircle-test.loca.lt/api'
    },
    production: {
        // 배포된 Render 서버
        url: 'https://theinnercircle-9xye.onrender.com/api'
    }
};

// 현재 선택된 모드의 URL을 내보냅니다.
export const API_URL = CONFIG[MODE].url;

// 디버깅용 로그
console.log(`[Config] Current Mode: ${MODE}`);
console.log(`[Config] API URL: ${API_URL}`);
