// CoupleMissionData.ts - ORBIT Couple Mission Database
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// COUPLE MODE MISSIONS
// ============================================

export interface CoupleDailyMission {
    day: number;
    level: number;
    levelName: string;
    title: string;
}

export const COUPLE_REGULAR: CoupleDailyMission[] = [
    { day: 1, level: 1, levelName: '첫 만남', title: '인연에게 오늘 가장 좋았던 순간을 물어보라.' },
    { day: 2, level: 1, levelName: '첫 만남', title: '인연의 손을 5초간 가만히 잡아보라.' },
    { day: 3, level: 1, levelName: '첫 만남', title: '인연에게 좋아하는 음식을 물어보고 메모하라.' },
    { day: 4, level: 1, levelName: '첫 만남', title: '인연에게 어린 시절 별명을 물어보라.' },
    { day: 5, level: 1, levelName: '첫 만남', title: '인연과 함께 5분간 같은 하늘을 바라보라.' },
    { day: 6, level: 2, levelName: '탐색', title: '인연의 꿈이 무엇인지 진지하게 물어보라.' },
    { day: 7, level: 2, levelName: '탐색', title: '인연이 좋아하는 노래를 함께 들어보라.' },
    { day: 8, level: 2, levelName: '탐색', title: '인연에게 가장 행복했던 기억을 물어보라.' },
    { day: 9, level: 2, levelName: '탐색', title: '인연의 장점 3가지를 말해주라.' },
    { day: 10, level: 2, levelName: '탐색', title: '지난 9일간 인연에게 배운 점을 적어보라.' },
    { day: 11, level: 3, levelName: '솔직함', title: '인연에게 평소 말하지 못한 감사함을 전하라.' },
    { day: 12, level: 3, levelName: '솔직함', title: '인연에게 자신의 약점 하나를 솔직히 고백하라.' },
    { day: 13, level: 3, levelName: '솔직함', title: '인연과 가장 서운했던 순간을 차분히 나눠보라.' },
    { day: 14, level: 3, levelName: '솔직함', title: '인연에게 두려움 하나를 털어놓아라.' },
    { day: 15, level: 3, levelName: '솔직함', title: '인연이 나를 어떻게 생각하는지 물어보라.' },
    { day: 16, level: 4, levelName: '공감', title: '인연의 하루를 10분간 평가 없이 경청하라.' },
    { day: 17, level: 4, levelName: '공감', title: '인연이 힘들어할 때 안아주기만 하라.' },
    { day: 18, level: 4, levelName: '공감', title: '인연의 입장에서 오늘 하루를 상상해보라.' },
    { day: 19, level: 4, levelName: '공감', title: '인연에게 네 마음 이해해라고 전하라.' },
    { day: 20, level: 4, levelName: '공감', title: '인연을 위해 아무 말 없이 작은 배려를 하라.' },
    { day: 21, level: 5, levelName: '신뢰', title: '인연에게 절대 말하지 않은 비밀 하나를 나눠라.' },
    { day: 22, level: 5, levelName: '신뢰', title: '인연에게 미래의 불안함을 솔직히 털어놓아라.' },
    { day: 23, level: 5, levelName: '신뢰', title: '인연을 완전히 믿고 오늘의 결정을 맡겨보라.' },
    { day: 24, level: 5, levelName: '신뢰', title: '인연에게 널 믿어라고 진심으로 말하라.' },
    { day: 25, level: 5, levelName: '신뢰', title: '인연과 1년 후의 우리를 함께 상상해보라.' },
    { day: 26, level: 6, levelName: '친밀감', title: '인연의 손을 잡고 10분간 산책하라.' },
    { day: 27, level: 6, levelName: '친밀감', title: '인연의 눈을 3분간 말없이 바라보라.' },
    { day: 28, level: 6, levelName: '친밀감', title: '인연의 머리카락을 부드럽게 쓰다듬어주라.' },
    { day: 29, level: 6, levelName: '친밀감', title: '인연에게 따뜻한 포옹을 30초간 유지하라.' },
    { day: 30, level: 6, levelName: '친밀감', title: '인연과 함께 좋아하는 음식을 나눠 먹어라.' },
    { day: 31, level: 7, levelName: '깊이', title: '인연에게 왜 나를 좋아하는지 물어보라.' },
    { day: 32, level: 7, levelName: '깊이', title: '인연의 가족 이야기를 들어보라.' },
    { day: 33, level: 7, levelName: '깊이', title: '인연과 죽음에 대해 진지하게 이야기하라.' },
    { day: 34, level: 7, levelName: '깊이', title: '인연에게 평생 함께하고 싶은 이유를 말하라.' },
    { day: 35, level: 7, levelName: '깊이', title: '인연과 서로의 인생 가치관을 비교해보라.' },
    { day: 36, level: 8, levelName: '헌신', title: '인연을 위해 새벽에 일어나 아침을 준비하라.' },
    { day: 37, level: 8, levelName: '헌신', title: '인연이 싫어하는 자신의 습관을 고쳐보라.' },
    { day: 38, level: 8, levelName: '헌신', title: '인연을 위해 하루 일정을 양보하라.' },
    { day: 39, level: 8, levelName: '헌신', title: '인연에게 손편지를 정성껏 써서 전하라.' },
    { day: 40, level: 8, levelName: '헌신', title: '인연이 좋아하는 장소로 깜짝 데려가라.' },
    { day: 41, level: 9, levelName: '약속', title: '인연에게 앞으로 지킬 약속 하나를 하라.' },
    { day: 42, level: 9, levelName: '약속', title: '인연과 함께 이루고 싶은 목표를 세워라.' },
    { day: 43, level: 9, levelName: '약속', title: '인연에게 영원히 변하지 않을 것을 맹세하라.' },
    { day: 44, level: 9, levelName: '약속', title: '인연과 5년 후의 우리 모습을 그려보라.' },
    { day: 45, level: 9, levelName: '약속', title: '인연에게 가장 소중한 이유를 글로 적어 전하라.' },
    { day: 46, level: 10, levelName: '완성', title: '인연에게 진심으로 사랑한다고 말하라.' },
    { day: 47, level: 10, levelName: '완성', title: '인연과 서로를 더 사랑하는 방법을 약속하라.' },
    { day: 48, level: 10, levelName: '완성', title: '인연과 50일간의 변화를 함께 되돌아보라.' },
    { day: 49, level: 10, levelName: '완성', title: '인연에게 가장 아름다운 순간을 말해주라.' },
    { day: 50, level: 10, levelName: '완성', title: '인연과 서로를 바라보며 경의를 표하라. 우리는 해냈다.' },
];

export type CoupleMasteryCategory = 'Touch' | 'Talk' | 'Date' | 'Care' | 'Memory' | 'Growth' | 'Play' | 'Trust' | 'Future' | 'Special';

export interface CoupleMasteryMission { id: number; category: CoupleMasteryCategory; content: string; }

export const COUPLE_MASTERY: CoupleMasteryMission[] = [
    { id: 1, category: 'Touch', content: '인연의 손바닥에 하트를 그려주라.' },
    { id: 2, category: 'Touch', content: '인연의 어깨를 5분간 마사지해주라.' },
    { id: 3, category: 'Touch', content: '인연의 이마에 입맞춤을 하라.' },
    { id: 4, category: 'Touch', content: '인연과 손을 잡고 1분간 눈을 감아라.' },
    { id: 5, category: 'Touch', content: '인연을 뒤에서 안고 30초간 가만히 있어라.' },
    { id: 6, category: 'Touch', content: '인연의 뺨을 양손으로 감싸고 바라보라.' },
    { id: 7, category: 'Touch', content: '인연의 발을 따뜻한 물에 담가 씻겨주라.' },
    { id: 8, category: 'Touch', content: '인연의 귀에 사랑한다고 속삭여라.' },
    { id: 9, category: 'Touch', content: '인연과 팔짱을 끼고 10분간 걸어라.' },
    { id: 10, category: 'Touch', content: '인연의 머리카락 냄새를 맡으며 포옹하라.' },
    { id: 11, category: 'Talk', content: '인연에게 처음 만났을 때 느낌을 말해주라.' },
    { id: 12, category: 'Talk', content: '인연에게 가장 좋아하는 우리의 추억을 말하라.' },
    { id: 13, category: 'Talk', content: '인연에게 오늘 감사한 점 3가지를 전하라.' },
    { id: 14, category: 'Talk', content: '인연과 서로의 꿈에 대해 30분간 이야기하라.' },
    { id: 15, category: 'Talk', content: '인연에게 최근 고민을 솔직히 털어놓아라.' },
    { id: 16, category: 'Talk', content: '인연에게 나의 단점을 어떻게 봐주는지 물어보라.' },
    { id: 17, category: 'Talk', content: '인연과 서로 가장 서운했던 순간을 나눠라.' },
    { id: 18, category: 'Talk', content: '인연에게 어린 시절 상처를 이야기하라.' },
    { id: 19, category: 'Talk', content: '인연과 죽기 전에 꼭 하고 싶은 것을 나눠라.' },
    { id: 20, category: 'Talk', content: '인연에게 10분간 들어만 주라.' },
    { id: 21, category: 'Date', content: '인연과 해가 지는 풍경을 함께 보라.' },
    { id: 22, category: 'Date', content: '인연과 처음 만났던 장소를 다시 방문하라.' },
    { id: 23, category: 'Date', content: '인연과 함께 요리를 해서 나눠 먹어라.' },
    { id: 24, category: 'Date', content: '인연과 아무 계획 없이 1시간 산책하라.' },
    { id: 25, category: 'Date', content: '인연과 밤하늘의 별을 함께 올려다보라.' },
    { id: 26, category: 'Date', content: '인연과 영화를 보고 감상을 나눠라.' },
    { id: 27, category: 'Date', content: '인연과 서점에서 서로에게 책을 골라주라.' },
    { id: 28, category: 'Date', content: '인연과 사진을 찍으러 나가라.' },
    { id: 29, category: 'Date', content: '인연과 카페에서 다른 커플들을 관찰하라.' },
    { id: 30, category: 'Date', content: '인연과 새로운 동네를 탐험하라.' },
    { id: 31, category: 'Care', content: '인연이 일어나기 전에 아침을 준비하라.' },
    { id: 32, category: 'Care', content: '인연이 좋아하는 음료를 사다 주라.' },
    { id: 33, category: 'Care', content: '인연의 짐을 대신 들어주라.' },
    { id: 34, category: 'Care', content: '인연이 피곤할 때 발 마사지를 해주라.' },
    { id: 35, category: 'Care', content: '인연이 좋아하는 노래로 플레이리스트를 만들어라.' },
    { id: 36, category: 'Care', content: '인연에게 따뜻한 차 한 잔을 건네라.' },
    { id: 37, category: 'Care', content: '인연의 휴대폰을 충전해 놓아라.' },
    { id: 38, category: 'Care', content: '인연이 자는 동안 이불을 덮어주라.' },
    { id: 39, category: 'Care', content: '인연에게 오늘 수고했어라고 말하라.' },
    { id: 40, category: 'Care', content: '인연이 말하지 않아도 원하는 것을 해주라.' },
    { id: 41, category: 'Memory', content: '인연과 함께한 사진들을 보며 추억을 나눠라.' },
    { id: 42, category: 'Memory', content: '인연에게 우리의 첫 만남을 다시 이야기하라.' },
    { id: 43, category: 'Memory', content: '인연과 함께한 여행 중 가장 좋았던 순간을 말하라.' },
    { id: 44, category: 'Memory', content: '인연에게 가장 감동받았던 순간을 전하라.' },
    { id: 45, category: 'Memory', content: '인연과 커플 앨범을 만들어 보라.' },
    { id: 46, category: 'Memory', content: '인연에게 처음 사랑을 느꼈던 순간을 말하라.' },
    { id: 47, category: 'Memory', content: '인연과 우리의 특별한 기념일을 정해보라.' },
    { id: 48, category: 'Memory', content: '인연에게 가장 웃겼던 에피소드를 이야기하라.' },
    { id: 49, category: 'Memory', content: '인연과 함께 타임캡슐 편지를 써보라.' },
    { id: 50, category: 'Memory', content: '인연에게 내가 기억하는 우리의 모습을 그려보라.' },
    { id: 51, category: 'Growth', content: '인연에게 내가 고쳐야 할 점을 정중히 물어보라.' },
    { id: 52, category: 'Growth', content: '인연과 서로의 목표를 응원하는 방법을 정하라.' },
    { id: 53, category: 'Growth', content: '인연에게 관계에서 발전한 점을 말해주라.' },
    { id: 54, category: 'Growth', content: '인연과 다퉜던 일을 어떻게 해결할지 대화하라.' },
    { id: 55, category: 'Growth', content: '인연에게 나의 감정 표현 방식을 설명하라.' },
    { id: 56, category: 'Growth', content: '인연과 의견이 다를 때 존중하는 연습을 하라.' },
    { id: 57, category: 'Growth', content: '인연에게 감사의 표현을 더 자주 하겠다고 약속하라.' },
    { id: 58, category: 'Growth', content: '인연과 함께 읽을 책을 골라 시작하라.' },
    { id: 59, category: 'Growth', content: '인연과 서로에게 새로운 취미를 가르쳐주라.' },
    { id: 60, category: 'Growth', content: '인연에게 관계의 목표 3가지를 함께 세워라.' },
    { id: 61, category: 'Play', content: '인연과 보드게임을 하고 진 사람이 소원 들어주기.' },
    { id: 62, category: 'Play', content: '인연과 함께 춤을 추라.' },
    { id: 63, category: 'Play', content: '인연에게 재미있는 영상을 보여주고 웃어라.' },
    { id: 64, category: 'Play', content: '인연과 서로 변장하고 사진을 찍어라.' },
    { id: 65, category: 'Play', content: '인연에게 깜짝 장난을 쳐라.' },
    { id: 66, category: 'Play', content: '인연과 노래방에서 듀엣을 불러라.' },
    { id: 67, category: 'Play', content: '인연과 어린 시절 좋아했던 게임을 함께 하라.' },
    { id: 68, category: 'Play', content: '인연에게 아재개그를 3개 연속으로 해보라.' },
    { id: 69, category: 'Play', content: '인연과 1분 눈싸움을 해보라.' },
    { id: 70, category: 'Play', content: '인연과 함께 요리 대결을 펼쳐라.' },
    { id: 71, category: 'Trust', content: '인연에게 오늘 있었던 모든 일을 솔직히 말하라.' },
    { id: 72, category: 'Trust', content: '인연의 결정을 오늘 하루 무조건 따라라.' },
    { id: 73, category: 'Trust', content: '인연에게 내 휴대폰을 잠금 해제 상태로 건네라.' },
    { id: 74, category: 'Trust', content: '인연에게 가장 부끄러운 비밀을 고백하라.' },
    { id: 75, category: 'Trust', content: '인연의 친구를 진심으로 대해주라.' },
    { id: 76, category: 'Trust', content: '인연이 혼자 시간을 보낼 때 의심하지 않겠다고 약속하라.' },
    { id: 77, category: 'Trust', content: '인연에게 힘들 때 의지해도 된다고 말하라.' },
    { id: 78, category: 'Trust', content: '인연과 서로의 비밀번호를 공유하라.' },
    { id: 79, category: 'Trust', content: '인연에게 널 믿어라고 눈을 보며 말하라.' },
    { id: 80, category: 'Trust', content: '인연에게 나의 불안함을 털어놓고 안심시켜 달라.' },
    { id: 81, category: 'Future', content: '인연과 1년 뒤 함께 하고 싶은 일을 계획하라.' },
    { id: 82, category: 'Future', content: '인연과 여행 버킷리스트를 5개 만들어라.' },
    { id: 83, category: 'Future', content: '인연에게 10년 뒤 우리의 모습을 상상해 말하라.' },
    { id: 84, category: 'Future', content: '인연과 함께 살 집의 모습을 그려보라.' },
    { id: 85, category: 'Future', content: '인연에게 늙어서도 함께 하고 싶은 일을 말하라.' },
    { id: 86, category: 'Future', content: '인연과 결혼식에서 하고 싶은 것을 나눠라.' },
    { id: 87, category: 'Future', content: '인연에게 내가 줄 수 있는 평생의 약속을 전하라.' },
    { id: 88, category: 'Future', content: '인연과 함께 키우고 싶은 반려동물을 정해보라.' },
    { id: 89, category: 'Future', content: '인연에게 우리의 기념일을 어떻게 보낼지 계획하라.' },
    { id: 90, category: 'Future', content: '인연과 함께 세울 가족 규칙을 정해보라.' },
    { id: 91, category: 'Special', content: '인연에게 깜짝 선물을 준비하라.' },
    { id: 92, category: 'Special', content: '인연만을 위한 특별한 요리를 해주라.' },
    { id: 93, category: 'Special', content: '인연에게 손편지를 정성껏 써서 숨겨놓아라.' },
    { id: 94, category: 'Special', content: '인연과 함께 별을 보며 소원을 빌어라.' },
    { id: 95, category: 'Special', content: '인연에게 노래를 불러주거나 녹음해 보내라.' },
    { id: 96, category: 'Special', content: '인연과 커플 아이템을 함께 골라 착용하라.' },
    { id: 97, category: 'Special', content: '인연만 위한 하루를 계획하고 실행하라.' },
    { id: 98, category: 'Special', content: '인연에게 우리의 사랑을 영상으로 만들어 보여라.' },
    { id: 99, category: 'Special', content: '인연에게 평생 함께하자라고 진심으로 말하라.' },
];

export const COUPLE_CATEGORY_LABELS: Record<CoupleMasteryCategory, string> = {
    Touch: '스킨십', Talk: '대화', Date: '데이트', Care: '배려', Memory: '추억',
    Growth: '성장', Play: '놀이', Trust: '믿음', Future: '미래', Special: '특별',
};

// AsyncStorage keys
const COUPLE_COMPLETED_KEY = 'couple_mastery_completed_ids';
const COUPLE_LAST_CAT_KEY = 'couple_mastery_last_category';
const COUPLE_CYCLE_KEY = 'couple_mastery_cycle_count';

export function getCoupleRegularMission(dayCount: number): CoupleDailyMission | null {
    if (dayCount < 1 || dayCount > 50) return null;
    return COUPLE_REGULAR.find(m => m.day === dayCount) || null;
}

async function getCoupleCompletedIds(): Promise<number[]> {
    try { const data = await AsyncStorage.getItem(COUPLE_COMPLETED_KEY); return data ? JSON.parse(data) : []; } catch { return []; }
}
async function saveCoupleCompletedId(id: number): Promise<void> {
    const completed = await getCoupleCompletedIds(); if (!completed.includes(id)) { completed.push(id); await AsyncStorage.setItem(COUPLE_COMPLETED_KEY, JSON.stringify(completed)); }
}
async function getCoupleLastCategory(): Promise<CoupleMasteryCategory | null> {
    try { const data = await AsyncStorage.getItem(COUPLE_LAST_CAT_KEY); return data as CoupleMasteryCategory | null; } catch { return null; }
}
async function saveCoupleLastCategory(category: CoupleMasteryCategory): Promise<void> { await AsyncStorage.setItem(COUPLE_LAST_CAT_KEY, category); }

const COUPLE_CAT_ORDER: CoupleMasteryCategory[] = ['Touch', 'Talk', 'Date', 'Care', 'Memory', 'Growth', 'Play', 'Trust', 'Future', 'Special'];
function getCoupleNextCategory(lastCategory: CoupleMasteryCategory | null): CoupleMasteryCategory {
    if (!lastCategory) return COUPLE_CAT_ORDER[0]; return COUPLE_CAT_ORDER[(COUPLE_CAT_ORDER.indexOf(lastCategory) + 1) % COUPLE_CAT_ORDER.length];
}

export async function getDailyCoupleMasteryMission(): Promise<{ mission: CoupleMasteryMission; isNewCycle: boolean; cycleCount: number; completedCount: number; totalCount: number; }> {
    let completedIds = await getCoupleCompletedIds(); let isNewCycle = false; let cycleCount = 1;
    try { const storedCycle = await AsyncStorage.getItem(COUPLE_CYCLE_KEY); if (storedCycle) cycleCount = parseInt(storedCycle, 10); } catch { }
    if (completedIds.length >= COUPLE_MASTERY.length) { await AsyncStorage.setItem(COUPLE_COMPLETED_KEY, JSON.stringify([])); completedIds = []; isNewCycle = true; cycleCount += 1; await AsyncStorage.setItem(COUPLE_CYCLE_KEY, cycleCount.toString()); }
    const lastCategory = await getCoupleLastCategory(); const preferredCategory = getCoupleNextCategory(lastCategory);
    const availableMissions = COUPLE_MASTERY.filter(m => !completedIds.includes(m.id)); let categoryMissions = availableMissions.filter(m => m.category === preferredCategory);
    if (categoryMissions.length === 0) { for (const cat of COUPLE_CAT_ORDER) { categoryMissions = availableMissions.filter(m => m.category === cat); if (categoryMissions.length > 0) break; } }
    const selectedMission = categoryMissions[Math.floor(Math.random() * categoryMissions.length)]; await saveCoupleLastCategory(selectedMission.category);
    return { mission: selectedMission, isNewCycle, cycleCount, completedCount: completedIds.length, totalCount: COUPLE_MASTERY.length };
}

export async function completeCoupleMasteryMission(missionId: number): Promise<void> { await saveCoupleCompletedId(missionId); }
export async function getCoupleMasteryProgress(): Promise<{ completedCount: number; totalCount: number; cycleCount: number; percentComplete: number; }> {
    const completedIds = await getCoupleCompletedIds(); let cycleCount = 1;
    try { const storedCycle = await AsyncStorage.getItem(COUPLE_CYCLE_KEY); if (storedCycle) cycleCount = parseInt(storedCycle, 10); } catch { }
    return { completedCount: completedIds.length, totalCount: COUPLE_MASTERY.length, cycleCount, percentComplete: Math.round((completedIds.length / COUPLE_MASTERY.length) * 100) };
}
export async function resetCoupleMasteryProgress(): Promise<void> { await AsyncStorage.removeItem(COUPLE_COMPLETED_KEY); await AsyncStorage.removeItem(COUPLE_LAST_CAT_KEY); await AsyncStorage.removeItem(COUPLE_CYCLE_KEY); }

export async function getCoupleMission(dayCount: number): Promise<{ type: 'regular' | 'mastery'; mission: CoupleDailyMission | CoupleMasteryMission; level?: number; levelName?: string; isNewCycle?: boolean; cycleCount?: number; completedCount?: number; totalCount?: number; }> {
    if (dayCount <= 50) { const regularMission = getCoupleRegularMission(dayCount); if (regularMission) { return { type: 'regular', mission: regularMission, level: regularMission.level, levelName: regularMission.levelName }; } }
    const masteryResult = await getDailyCoupleMasteryMission(); return { type: 'mastery', mission: masteryResult.mission, isNewCycle: masteryResult.isNewCycle, cycleCount: masteryResult.cycleCount, completedCount: masteryResult.completedCount, totalCount: masteryResult.totalCount };
}

export default COUPLE_MASTERY;
