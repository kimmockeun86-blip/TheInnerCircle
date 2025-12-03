// API 설정 파일
// 로컬 터널(Ngrok/Localtunnel)을 사용할 때 이 주소를 변경하세요.

// 1. 현재 사용할 모드를 선택하세요 ('local', 'tunnel', 'production')
// - 'local': 로컬 서버와 앱을 같은 네트워크에서 테스트할 때 (에뮬레이터/웹)
// - 'tunnel': 물리 디바이스 테스트용, Ngrok/Localtunnel 사용 시
// - 'production': Render/Vercel 등 배포된 서버 사용 시 ✅ 배포 환경에서는 이것 사용!
const MODE: 'local' | 'tunnel' | 'production' = 'tunnel';

// 2. 각 모드별 주소 설정
const CONFIG = {
    local: {
        // 로컬 테스트용 (에뮬레이터/웹)
        // Android 에뮬레이터: 'http://10.0.2.2:3000/api'
        // iOS 시뮬레이터/웹: 'http://localhost:3000/api'
        url: 'http://localhost:3000/api'
    },
    tunnel: {
        // 👉 여기에 Ngrok 또는 Localtunnel 주소를 입력하세요!
        // 예: 'https://your-tunnel-url.ngrok-free.app/api'
        url: 'https://theinnercircle-test.loca.lt/api'
    },
    production: {
        // 배포된 Render 서버
        // ⚠️ 배포 후 반드시 이 주소가 실제 서버와 일치하는지 확인하세요!
        url: 'https://theinnercircle-9xye.onrender.com/api'
    }
};

// 현재 선택된 모드의 URL을 내보냅니다.
export const API_URL = CONFIG[MODE].url;

// 디버깅용 로그
console.log(`[Config] Current Mode: ${MODE}`);
console.log(`[Config] API URL: ${API_URL}`);
