/**
 * 테마별 미션팩 데이터
 * 커플 맞춤형 미션 콘텐츠
 */

export interface Mission {
    id: string;
    text: string;
    difficulty: 'easy' | 'medium' | 'hard';
    duration: string; // 예상 소요 시간
    category: string;
}

export interface MissionPack {
    id: string;
    name: string;
    emoji: string;
    description: string;
    color: string;
    missions: Mission[];
}

// 신혼 부부용 미션팩
const newlywedMissions: Mission[] = [
    { id: 'nw1', text: '오늘 저녁 함께 요리하고 사진 찍기', difficulty: 'easy', duration: '1시간', category: '일상' },
    { id: 'nw2', text: '결혼 전 연애 시절 추억 장소 다시 방문하기', difficulty: 'medium', duration: '반나절', category: '추억' },
    { id: 'nw3', text: '서로의 가족 사진첩 보며 어린 시절 이야기 나누기', difficulty: 'easy', duration: '30분', category: '소통' },
    { id: 'nw4', text: '함께 미래 버킷리스트 10개 작성하기', difficulty: 'easy', duration: '30분', category: '미래' },
    { id: 'nw5', text: '집 안에서 피크닉 분위기 내며 식사하기', difficulty: 'easy', duration: '1시간', category: '일상' },
    { id: 'nw6', text: '서로에게 손편지 쓰고 교환하기', difficulty: 'medium', duration: '30분', category: '감정' },
    { id: 'nw7', text: '새로운 취미 함께 도전하기 (요가, 보드게임 등)', difficulty: 'medium', duration: '1시간', category: '성장' },
    { id: 'nw8', text: '결혼 후 가장 행복했던 순간 3가지 공유하기', difficulty: 'easy', duration: '20분', category: '소통' },
    { id: 'nw9', text: '커플 사진 촬영하고 액자에 넣기', difficulty: 'medium', duration: '1시간', category: '추억' },
    { id: 'nw10', text: '각자 좋아하는 노래 10곡으로 공동 플레이리스트 만들기', difficulty: 'easy', duration: '30분', category: '일상' },
    { id: 'nw11', text: '결혼 당시 영상/사진 함께 보며 추억 회상하기', difficulty: 'easy', duration: '30분', category: '추억' },
    { id: 'nw12', text: '1년 후 함께 읽을 타임캡슐 편지 쓰기', difficulty: 'medium', duration: '30분', category: '미래' },
    { id: 'nw13', text: '서로의 장점 10개씩 말해주기', difficulty: 'easy', duration: '15분', category: '감정' },
    { id: 'nw14', text: '함께 식물 키우기 시작하고 이름 짓기', difficulty: 'easy', duration: '30분', category: '성장' },
    { id: 'nw15', text: '오늘 하루 상대방 대신 집안일 해주기', difficulty: 'medium', duration: '2시간', category: '일상' },
    { id: 'nw16', text: '야경 보며 산책하고 소원 말하기', difficulty: 'easy', duration: '1시간', category: '일상' },
    { id: 'nw17', text: '서로의 부모님께 감사 전화하기', difficulty: 'easy', duration: '30분', category: '가족' },
    { id: 'nw18', text: '집 인테리어 함께 계획하고 하나 실행하기', difficulty: 'hard', duration: '반나절', category: '성장' },
    { id: 'nw19', text: '각자 요리 하나씩 해서 서로 대접하기', difficulty: 'medium', duration: '2시간', category: '일상' },
    { id: 'nw20', text: '함께 미래 가족 계획에 대해 진지하게 대화하기', difficulty: 'hard', duration: '1시간', category: '미래' },
];

// 장거리 연애용 미션팩
const longDistanceMissions: Mission[] = [
    { id: 'ld1', text: '영상통화로 함께 같은 영화 보기', difficulty: 'easy', duration: '2시간', category: '데이트' },
    { id: 'ld2', text: '오늘 본 하늘 사진 보내고 감정 공유하기', difficulty: 'easy', duration: '10분', category: '일상' },
    { id: 'ld3', text: '손편지 써서 우편으로 보내기', difficulty: 'medium', duration: '30분', category: '감정' },
    { id: 'ld4', text: '서로 같은 시간에 같은 음식 먹기', difficulty: 'easy', duration: '1시간', category: '일상' },
    { id: 'ld5', text: '다음 만남에 할 데이트 코스 함께 계획하기', difficulty: 'easy', duration: '30분', category: '미래' },
    { id: 'ld6', text: '영상통화로 서로에게 노래 불러주기', difficulty: 'medium', duration: '30분', category: '감정' },
    { id: 'ld7', text: '상대방이 좋아할 선물 온라인으로 주문해 보내기', difficulty: 'medium', duration: '30분', category: '서프라이즈' },
    { id: 'ld8', text: '각자의 하루 일과 사진 10장으로 공유하기', difficulty: 'easy', duration: '저녁', category: '일상' },
    { id: 'ld9', text: '화상으로 함께 운동하거나 요가하기', difficulty: 'medium', duration: '30분', category: '건강' },
    { id: 'ld10', text: '잠들기 전 5분 음성메시지로 하루 마무리하기', difficulty: 'easy', duration: '10분', category: '일상' },
    { id: 'ld11', text: '온라인 게임 함께 플레이하기', difficulty: 'easy', duration: '1시간', category: '재미' },
    { id: 'ld12', text: '각자의 친구/동료에게 상대방 자랑하고 인증하기', difficulty: 'medium', duration: '15분', category: '관계' },
    { id: 'ld13', text: '상대방 지역 날씨 확인하고 옷 추천해주기', difficulty: 'easy', duration: '5분', category: '일상' },
    { id: 'ld14', text: '서로의 일상 공간 영상통화로 투어하기', difficulty: 'easy', duration: '20분', category: '일상' },
    { id: 'ld15', text: '같은 책 읽고 감상 나누기', difficulty: 'hard', duration: '1주일', category: '성장' },
    { id: 'ld16', text: '화상으로 함께 요리하며 대화하기', difficulty: 'medium', duration: '1시간', category: '일상' },
    { id: 'ld17', text: '다음 만남까지 D-day 카운트다운 만들기', difficulty: 'easy', duration: '10분', category: '미래' },
    { id: 'ld18', text: '상대방 휴대폰 배경화면에 들어갈 셀카 보내기', difficulty: 'easy', duration: '10분', category: '일상' },
    { id: 'ld19', text: '서로의 고민 한 가지씩 진지하게 나누고 조언하기', difficulty: 'medium', duration: '30분', category: '소통' },
    { id: 'ld20', text: '영상통화 중 함께 잠들기 (굿나잇콜)', difficulty: 'easy', duration: '밤새', category: '일상' },
];

// 권태기 극복용 미션팩
const rekindlingMissions: Mission[] = [
    { id: 'rk1', text: '첫 데이트했던 장소 다시 가보기', difficulty: 'medium', duration: '반나절', category: '추억' },
    { id: 'rk2', text: '연애 초기처럼 설레는 메시지 보내기', difficulty: 'easy', duration: '10분', category: '감정' },
    { id: 'rk3', text: '서로 모르는 새로운 모습 한 가지씩 보여주기', difficulty: 'medium', duration: '30분', category: '발견' },
    { id: 'rk4', text: '상대방이 요즘 힘든 점 진지하게 들어주기', difficulty: 'medium', duration: '1시간', category: '소통' },
    { id: 'rk5', text: '예전에 좋아했던 습관 하나 다시 시작하기', difficulty: 'easy', duration: '30분', category: '추억' },
    { id: 'rk6', text: '서프라이즈 데이트 계획하고 실행하기', difficulty: 'hard', duration: '반나절', category: '서프라이즈' },
    { id: 'rk7', text: '스킨십 없이 30분 동안 눈 맞추며 대화하기', difficulty: 'medium', duration: '30분', category: '소통' },
    { id: 'rk8', text: '서로에게 솔직하게 아쉬웠던 점 한 가지씩 말하기', difficulty: 'hard', duration: '1시간', category: '소통' },
    { id: 'rk9', text: '함께 새로운 곳으로 여행 계획 세우기', difficulty: 'easy', duration: '30분', category: '미래' },
    { id: 'rk10', text: '연애 초기 사진들 함께 보며 추억 나누기', difficulty: 'easy', duration: '30분', category: '추억' },
    { id: 'rk11', text: '서로의 버킷리스트 중 하나 함께 실행하기', difficulty: 'hard', duration: '하루', category: '성장' },
    { id: 'rk12', text: '오늘 하루 연인이 아닌 친구처럼 대화하기', difficulty: 'easy', duration: '하루', category: '관계' },
    { id: 'rk13', text: '상대방의 취미에 진심으로 관심 가지고 함께하기', difficulty: 'medium', duration: '2시간', category: '성장' },
    { id: 'rk14', text: '지금까지 고마웠던 점 5가지 진심으로 말하기', difficulty: 'easy', duration: '20분', category: '감정' },
    { id: 'rk15', text: '서로 마사지해주며 편안한 시간 보내기', difficulty: 'easy', duration: '30분', category: '일상' },
    { id: 'rk16', text: '핸드폰 없이 하루 데이트하기', difficulty: 'hard', duration: '하루', category: '집중' },
    { id: 'rk17', text: '상대방의 친구/가족과 함께 시간 보내기', difficulty: 'medium', duration: '2시간', category: '관계' },
    { id: 'rk18', text: '서로에게 원하는 것 솔직하게 요청하기', difficulty: 'hard', duration: '30분', category: '소통' },
    { id: 'rk19', text: '함께 새로운 레스토랑/카페 탐방하기', difficulty: 'easy', duration: '2시간', category: '일상' },
    { id: 'rk20', text: '서로의 꿈에 대해 진지하게 대화하기', difficulty: 'medium', duration: '1시간', category: '미래' },
];

export const MISSION_PACKS: MissionPack[] = [
    {
        id: 'newlywed',
        name: '신혼 부부',
        emoji: '💒',
        description: '새로운 시작을 함께하는 특별한 미션',
        color: '#FF6B6B',
        missions: newlywedMissions,
    },
    {
        id: 'longDistance',
        name: '장거리 연애',
        emoji: '✈️',
        description: '거리를 넘어 마음을 잇는 미션',
        color: '#4ECDC4',
        missions: longDistanceMissions,
    },
    {
        id: 'rekindling',
        name: '권태기 극복',
        emoji: '🔥',
        description: '다시 불꽃을 피우는 특별한 미션',
        color: '#FFE66D',
        missions: rekindlingMissions,
    },
];

// 헬퍼 함수: 팩에서 랜덤 미션 선택
export function getRandomMission(packId: string): Mission | null {
    const pack = MISSION_PACKS.find(p => p.id === packId);
    if (!pack) return null;

    const randomIndex = Math.floor(Math.random() * pack.missions.length);
    return pack.missions[randomIndex];
}

// 헬퍼 함수: 오늘의 미션 (날짜 기반)
export function getTodaysMission(packId: string): Mission | null {
    const pack = MISSION_PACKS.find(p => p.id === packId);
    if (!pack) return null;

    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % pack.missions.length;

    return pack.missions[index];
}

export default MISSION_PACKS;
