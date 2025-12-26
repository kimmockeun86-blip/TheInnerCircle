// MissionData.ts - ORBIT Mission Database
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// SPECIAL DAY MISSIONS (특별한 날 미션)
// ============================================

export interface SpecialDayMission {
    date: string; // MM-DD 형식
    name: string;
    mission: string;
    feedback: string;
}

export const SPECIAL_DAY_MISSIONS: SpecialDayMission[] = [
    // 어버이날
    { date: '05-08', name: '어버이날', mission: '부모님께 감사의 전화를 걸거나 편지를 써서 마음을 전하라.', feedback: '부모님의 사랑은 우주보다 깊습니다. 오늘 당신이 전한 마음이 그들에게 큰 선물이 되었을 것입니다.' },
    // 크리스마스
    { date: '12-25', name: '크리스마스', mission: '소중한 사람에게 진심 어린 감사와 사랑을 담은 메시지를 보내라.', feedback: '사랑을 나눌 때 비로소 우리는 풍요로워집니다. 따뜻한 마음을 전한 당신은 이미 충분합니다.' },
    // 설날
    { date: '01-01', name: '새해 첫날', mission: '올해 이루고 싶은 목표 3가지를 적고, 가장 중요한 가치를 정하라.', feedback: '새로운 시작의 에너지가 당신을 감싸고 있습니다. 당신의 의도가 우주에 새겨졌습니다.' },
    // 발렌타인 데이
    { date: '02-14', name: '발렌타인 데이', mission: '사랑하는 사람(친구, 가족, 연인 누구든)에게 따뜻한 마음을 표현하라.', feedback: '사랑은 표현할 때 빛납니다. 오늘 당신이 건넨 마음은 영원히 기억될 것입니다.' },
    // 화이트 데이
    { date: '03-14', name: '화이트 데이', mission: '받았던 사랑에 보답하는 작은 행동을 실천하라.', feedback: '사랑을 되돌려주는 것, 그것이 진정한 연결의 시작입니다.' },
    // 추석 (음력이라 양력 날짜는 매년 다르므로 대표 날짜 사용)
    { date: '09-17', name: '추석', mission: '가족에게 연락하고 함께했던 좋은 기억 하나를 떠올려 기록하라.', feedback: '가족의 유대는 시간과 공간을 초월합니다. 뿌리를 기억하는 것이 성장의 시작입니다.' },
    // 빼빼로 데이
    { date: '11-11', name: '빼빼로 데이', mission: '누군가에게 작은 간식이나 선물과 함께 응원의 메시지를 전하라.', feedback: '작은 정성이 큰 행복을 만듭니다. 당신의 따뜻함이 누군가의 하루를 밝혔습니다.' },
];

// 오늘이 특별한 날인지 확인하고 해당 미션 반환
export function getSpecialDayMission(): SpecialDayMission | null {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${month}-${day}`;

    return SPECIAL_DAY_MISSIONS.find(m => m.date === todayStr) || null;
}

// ============================================
// SOLO MODE MISSIONS
// ============================================

export interface DailyMission {
    day: number;
    level: number;
    levelName: string;
    title: string;
}

export const SOLO_REGULAR: DailyMission[] = [
    { day: 1, level: 1, levelName: '각성', title: '5분간 아무것도 하지 말고 하늘만 응시하라.' },
    { day: 2, level: 1, levelName: '각성', title: '일어나자마자 따뜻한 물 한 잔을 천천히 마셔라.' },
    { day: 3, level: 1, levelName: '각성', title: '평소 쓰지 않는 손으로 양치질하라.' },
    { day: 4, level: 1, levelName: '각성', title: '감사한 일 3가지를 구체적으로 기록하라.' },
    { day: 5, level: 1, levelName: '각성', title: '잠들기 전 10분, 스마트폰을 끄고 침묵하라.' },
    { day: 6, level: 2, levelName: '직면', title: '거울 속 자신의 눈을 1분간 피하지 말고 바라보라.' },
    { day: 7, level: 2, levelName: '직면', title: '가장 미루고 있던 연락 한 통을 지금 하라.' },
    { day: 8, level: 2, levelName: '직면', title: '나의 가장 큰 단점 하나를 소리 내어 말하라.' },
    { day: 9, level: 2, levelName: '직면', title: 'SNS 앱을 삭제하거나 24시간 로그아웃하라.' },
    { day: 10, level: 2, levelName: '직면', title: '지난 9일간의 기록을 정독하고 변화를 적어라.' },
    { day: 11, level: 3, levelName: '파괴', title: '출근이나 등교 시, 평소와 완전히 다른 길로 가라.' },
    { day: 12, level: 3, levelName: '파괴', title: '가장 싫어하는 음식을 한 입이라도 먹어보라.' },
    { day: 13, level: 3, levelName: '파괴', title: '타인의 부탁을 정중하지만 단호하게 거절하라.' },
    { day: 14, level: 3, levelName: '파괴', title: '옷장 속에서 가장 안 입는 옷을 입고 외출하라.' },
    { day: 15, level: 3, levelName: '파괴', title: '아무런 목적 없이 30분간 낯선 동네를 걸어라.' },
    { day: 16, level: 4, levelName: '재구축', title: '나를 위한 작은 선물을 사라.' },
    { day: 17, level: 4, levelName: '재구축', title: '누군가에게 진심 어린 칭찬을 건네라.' },
    { day: 18, level: 4, levelName: '재구축', title: '도움이 필요한 순간, 자존심을 버리고 요청하라.' },
    { day: 19, level: 4, levelName: '재구축', title: '과거의 실수 하나를 떠올리고, 스스로를 용서하라.' },
    { day: 20, level: 4, levelName: '재구축', title: '내가 듣고 싶은 말을 스스로에게 해주어라.' },
    { day: 21, level: 5, levelName: '통합', title: '나의 묘비명을 미리 작성해 보라.' },
    { day: 22, level: 5, levelName: '통합', title: '인생에서 절대 포기할 수 없는 가치 3가지를 정하라.' },
    { day: 23, level: 5, levelName: '통합', title: '1년 뒤의 나에게 편지를 써라.' },
    { day: 24, level: 5, levelName: '통합', title: '오늘 하루, 거짓말을 단 한마디도 하지 마라.' },
    { day: 25, level: 5, levelName: '통합', title: '방의 가구 배치를 조금이라도 바꿔보라.' },
    { day: 26, level: 6, levelName: '확장', title: '길에 떨어진 쓰레기를 3개 주워라.' },
    { day: 27, level: 6, levelName: '확장', title: '낯선 사람에게 가벼운 눈인사나 미소를 건네라.' },
    { day: 28, level: 6, levelName: '확장', title: '오랫동안 연락하지 않은 친구에게 안부를 물어라.' },
    { day: 29, level: 6, levelName: '확장', title: '서점에 가서 평소 읽지 않는 분야의 책을 읽어라.' },
    { day: 30, level: 6, levelName: '확장', title: '누군가의 이야기를 평가하지 않고 10분간 경청하라.' },
    { day: 31, level: 7, levelName: '심화', title: '꿈을 기록하라. 기억나지 않으면 기분이라도 적어라.' },
    { day: 32, level: 7, levelName: '심화', title: '어린 시절의 사진을 보고 그때의 나에게 말을 걸어라.' },
    { day: 33, level: 7, levelName: '심화', title: '가장 두려운 상황을 상상하고, 최악의 시나리오를 적어라.' },
    { day: 34, level: 7, levelName: '심화', title: '감정을 색깔로 표현하여 그림을 그려라.' },
    { day: 35, level: 7, levelName: '심화', title: '오늘 하루, 나라는 단어를 쓰지 않고 대화해 보라.' },
    { day: 36, level: 8, levelName: '규율', title: '새벽 5시에 기상하여 아침 공기를 마셔라.' },
    { day: 37, level: 8, levelName: '규율', title: '찬물로 샤워하며 정신을 깨워라.' },
    { day: 38, level: 8, levelName: '규율', title: '하루 동안 카페인과 설탕을 완전히 끊어라.' },
    { day: 39, level: 8, levelName: '규율', title: '15분간 고강도 운동으로 땀을 흘려라.' },
    { day: 40, level: 8, levelName: '규율', title: '엘리베이터 대신 계단을 이용하라.' },
    { day: 41, level: 9, levelName: '초월', title: '1시간 동안 절대 침묵을 지켜라.' },
    { day: 42, level: 9, levelName: '초월', title: '하루 한 끼를 단식하고 배고픔을 관찰하라.' },
    { day: 43, level: 9, levelName: '초월', title: '밤하늘의 별이나 달을 10분간 바라보라.' },
    { day: 44, level: 9, levelName: '초월', title: '죽기 전에 남기고 싶은 유산이 무엇인지 적어라.' },
    { day: 45, level: 9, levelName: '초월', title: '명상을 통해 호흡에만 20분간 집중하라.' },
    { day: 46, level: 10, levelName: '완성', title: '가장 소중한 사람에게 사랑한다고 말하라.' },
    { day: 47, level: 10, levelName: '완성', title: '나를 힘들게 했던 사람을 마음속으로 용서하라.' },
    { day: 48, level: 10, levelName: '완성', title: '지금 이 순간, 당신은 행복한가? 그 이유를 적어라.' },
    { day: 49, level: 10, levelName: '완성', title: '50일간의 여정을 1장의 글이나 그림으로 요약하라.' },
    { day: 50, level: 10, levelName: '완성', title: '거울을 보고 스스로에게 경의를 표하라. 당신은 해냈다.' },
];

export type MasteryCategory = 'Sense' | 'Habit' | 'Intellect' | 'Emotion' | 'Relation' | 'Space' | 'Body' | 'Create' | 'Mind' | 'Challenge';

export interface MasteryMission { id: number; category: MasteryCategory; content: string; }

export const SOLO_MASTERY: MasteryMission[] = [
    { id: 1, category: 'Sense', content: '빗소리나 백색 소음을 5분간 눈을 감고 경청하라.' },
    { id: 2, category: 'Sense', content: '맨발로 흙이나 방바닥의 질감을 1분간 온전히 느껴라.' },
    { id: 3, category: 'Sense', content: '식사 중 첫 한 입을 30번 이상 씹으며 맛을 분석하라.' },
    { id: 4, category: 'Sense', content: '불을 끄고 샤워하며 물줄기의 감각에만 집중하라.' },
    { id: 5, category: 'Sense', content: '특정 향기를 맡으며 가장 오래된 기억을 적어라.' },
    { id: 6, category: 'Sense', content: '오늘 하늘의 색깔을 3가지 단어로 묘사하라.' },
    { id: 7, category: 'Sense', content: '눈을 감고 주변 사물 3가지를 만져보고 질감을 맞춰라.' },
    { id: 8, category: 'Sense', content: '지금 들리는 소리 중 가장 작은 소리를 찾아내라.' },
    { id: 9, category: 'Sense', content: '지금 뺨에 닿는 공기의 온도를 느끼고 표현하라.' },
    { id: 10, category: 'Sense', content: '손을 가슴에 얹고 자신의 심장 박동을 1분간 느껴라.' },
    { id: 11, category: 'Habit', content: '평소 듣지 않는 장르의 음악을 한 곡 끝까지 들어라.' },
    { id: 12, category: 'Habit', content: '양치질을 평소 쓰지 않는 손으로 수행하라.' },
    { id: 13, category: 'Habit', content: '집으로 가는 길을 평소와 다른 낯선 길로 선택하라.' },
    { id: 14, category: 'Habit', content: '기상 후 1시간 동안 스마트폰을 보지 마라.' },
    { id: 15, category: 'Habit', content: '옷장에서 가장 안 입는 옷을 입고 외출하라.' },
    { id: 16, category: 'Habit', content: '평소 먹지 않던 식재료가 든 음식을 시도하라.' },
    { id: 17, category: 'Habit', content: '평소보다 30분 일찍 일어나거나 잠들어라.' },
    { id: 18, category: 'Habit', content: '하루 동안 뉴스나 SNS 피드를 보지 마라.' },
    { id: 19, category: 'Habit', content: '유튜브나 TV 없이 음식에만 집중하며 혼밥하라.' },
    { id: 20, category: 'Habit', content: '의식적으로 척추를 펴는 자세를 10번 고쳐 앉아라.' },
    { id: 21, category: 'Intellect', content: '종이 신문이나 긴 칼럼 하나를 정독하라.' },
    { id: 22, category: 'Intellect', content: '좋아하는 책의 한 페이지나 시 한 편을 필사하라.' },
    { id: 23, category: 'Intellect', content: '서점에서 평소 가지 않는 분야 코너의 책 제목들을 훑어보라.' },
    { id: 24, category: 'Intellect', content: '우주, 자연, 역사에 관한 짧은 다큐멘터리를 시청하라.' },
    { id: 25, category: 'Intellect', content: '새로운 외국어 단어나 문장을 하나 외워서 써먹어라.' },
    { id: 26, category: 'Intellect', content: '성공이란 무엇인가? 나만의 정의를 내려라.' },
    { id: 27, category: 'Intellect', content: '존경하는 위인의 일대기에서 배울 점 하나를 적어라.' },
    { id: 28, category: 'Intellect', content: '지도 앱에서 가본 적 없는 도시를 로드뷰로 산책하라.' },
    { id: 29, category: 'Intellect', content: '왜?라는 질문을 5번 연속으로 던져 본질을 파고들어라.' },
    { id: 30, category: 'Intellect', content: '오늘 하루를 딱 한 문장으로 요약해 보라.' },
    { id: 31, category: 'Emotion', content: '슬픈 영화나 음악을 감상하며 감정을 흘려보내라.' },
    { id: 32, category: 'Emotion', content: '화나는 일들을 종이에 적고 그 종이를 찢어 버려라.' },
    { id: 33, category: 'Emotion', content: '거울을 보며 고생했다고 소리 내어 말하라.' },
    { id: 34, category: 'Emotion', content: '지금 내 기분을 날씨에 비유하여 표현하라.' },
    { id: 35, category: 'Emotion', content: '후회되는 과거의 한 순간을 떠올리고 스스로를 용서하라.' },
    { id: 36, category: 'Emotion', content: '질투하는 대상을 떠올리고 그 욕망을 분석하라.' },
    { id: 37, category: 'Emotion', content: '가장 두려운 실패 시나리오를 적고 그래도 괜찮다고 덧붙여라.' },
    { id: 38, category: 'Emotion', content: '1분간 소리 내어 웃거나 가장 웃긴 영상을 찾아보라.' },
    { id: 39, category: 'Emotion', content: '어린 시절 사진을 찾아보고 그때의 나에게 해주고 싶은 말을 적어라.' },
    { id: 40, category: 'Emotion', content: '오늘 당연하게 누렸던 것들 3가지에 감사하라.' },
    { id: 41, category: 'Relation', content: '쓰레기를 줍거나 뒷사람을 위해 문을 잡아주라.' },
    { id: 42, category: 'Relation', content: '오랫동안 연락 못한 친구에게 안부 메시지를 보내라.' },
    { id: 43, category: 'Relation', content: '누군가의 말을 5분 이상 온전히 경청하라.' },
    { id: 44, category: 'Relation', content: '오늘 만나는 사람의 장점을 구체적으로 칭찬하라.' },
    { id: 45, category: 'Relation', content: '가까운 사람에게 고맙다는 말을 육성으로 전하라.' },
    { id: 46, category: 'Relation', content: '편의점 점원이나 기사님에게 눈을 맞추고 인사하라.' },
    { id: 47, category: 'Relation', content: '힘들게 했던 사람에게 보내지 않을 용서의 편지를 써보라.' },
    { id: 48, category: 'Relation', content: '지나가는 사람들의 표정을 관찰하며 그들의 삶을 상상하라.' },
    { id: 49, category: 'Relation', content: '원치 않는 부탁이나 제안을 정중하게 거절하라.' },
    { id: 50, category: 'Relation', content: '나 자신을 위해 작은 꽃 한 송이를 사라.' },
    { id: 51, category: 'Space', content: '1년 이상 쓰지 않은 물건 3가지를 버리거나 기부하라.' },
    { id: 52, category: 'Space', content: '스마트폰의 불필요한 스크린샷이나 앱을 정리하라.' },
    { id: 53, category: 'Space', content: '지갑 속 영수증과 쓰지 않는 포인트 카드를 정리하라.' },
    { id: 54, category: 'Space', content: '책상 위를 깨끗이 닦고 불필요한 것을 치워라.' },
    { id: 55, category: 'Space', content: '모든 창문을 활짝 열고 10분간 공기를 순환시켜라.' },
    { id: 56, category: 'Space', content: '냉장고에서 유통기한 지난 음식을 과감히 버려라.' },
    { id: 57, category: 'Space', content: '일어나자마자 이불을 반듯하게 정리하라.' },
    { id: 58, category: 'Space', content: '현관의 신발을 가지런히 정리하라.' },
    { id: 59, category: 'Space', content: '가구나 소품의 위치를 바꿔 새로운 기운을 불어넣어라.' },
    { id: 60, category: 'Space', content: '형광등 대신 무드등이나 촛불로 분위기를 바꿔보라.' },
    { id: 61, category: 'Body', content: '숨이 찰 정도로 1분간 제자리 뛰기나 계단 오르기를 하라.' },
    { id: 62, category: 'Body', content: '기상 직후 전신을 쭉 펴는 스트레칭을 하라.' },
    { id: 63, category: 'Body', content: '벽에 등과 뒤통수를 대고 1분간 바른 자세를 유지하라.' },
    { id: 64, category: 'Body', content: '1시간에 한 번씩 먼 곳이나 초록색 물체를 1분간 응시하라.' },
    { id: 65, category: 'Body', content: '자신의 한계까지 플랭크 자세를 유지하며 시간을 측정하라.' },
    { id: 66, category: 'Body', content: '하루 동안 물 2리터 마시기에 도전하라.' },
    { id: 67, category: 'Body', content: '저녁 7시 이후 금식하거나 한 끼를 가볍게 비워보라.' },
    { id: 68, category: 'Body', content: '점심시간에 나가서 15분간 등에 햇볕을 쬐라.' },
    { id: 69, category: 'Body', content: '깊은 복식 호흡을 10회 반복하라.' },
    { id: 70, category: 'Body', content: '발바닥을 손이나 도구로 꾹꾹 눌러주라.' },
    { id: 71, category: 'Create', content: '흰 종이에 아무 생각 없이 낙서하라.' },
    { id: 72, category: 'Create', content: '오늘 하루를 딱 3줄로 요약해서 기록하라.' },
    { id: 73, category: 'Create', content: '오늘 마주친 가장 아름다운 순간을 사진으로 남겨라.' },
    { id: 74, category: 'Create', content: '좋아하는 노래를 가사를 음미하며 처음부터 끝까지 불러보라.' },
    { id: 75, category: 'Create', content: '레시피 없이 감으로 나만의 요리를 만들어보라.' },
    { id: 76, category: 'Create', content: '1년 뒤의 모습을 상상하며 일기를 써보라.' },
    { id: 77, category: 'Create', content: '나 자신에게 격려와 위로를 담은 편지를 써보라.' },
    { id: 78, category: 'Create', content: '오늘의 감정을 녹음기로 녹음해서 들어보라.' },
    { id: 79, category: 'Create', content: '복잡한 무늬를 색칠하며 잡념을 없애라.' },
    { id: 80, category: 'Create', content: '나의 인생 곡 5곡을 선정하여 플레이리스트를 만들어보라.' },
    { id: 81, category: 'Mind', content: '오늘이 마지막 날이라면 무엇을 할지 10분간 상상하라.' },
    { id: 82, category: 'Mind', content: '나의 묘비에 적힐 한 문장을 직접 지어보라.' },
    { id: 83, category: 'Mind', content: '가장 소중한 사람들에게 남길 짧은 유언을 작성해 보라.' },
    { id: 84, category: 'Mind', content: '사랑, 돈, 명예, 건강 중 하나만 택해야 한다면 무엇인가?' },
    { id: 85, category: 'Mind', content: '아무도 없는 방에서 30분간 아무것도 하지 않고 침묵하라.' },
    { id: 86, category: 'Mind', content: '밤하늘을 보며 우주에 비하면 내 고민이 얼마나 작은지 느껴라.' },
    { id: 87, category: 'Mind', content: '10년 전의 나를 만난다면 해주고 싶은 조언을 적어라.' },
    { id: 88, category: 'Mind', content: '나에게 행복이란 무엇인지 한 문장으로 정의하라.' },
    { id: 89, category: 'Mind', content: '죽기 전에 꼭 해보고 싶은 일 3가지를 적어라.' },
    { id: 90, category: 'Mind', content: '가장 두려워하는 것은 무엇인가? 그 뿌리를 글로 적어보라.' },
    { id: 91, category: 'Challenge', content: '내일 아침 평소보다 2시간 일찍 일어나라.' },
    { id: 92, category: 'Challenge', content: '샤워 마지막 30초를 찬물로 마무리하라.' },
    { id: 93, category: 'Challenge', content: '오늘 하루 동안 고기 없는 식단으로 생활하라.' },
    { id: 94, category: 'Challenge', content: '퇴근 후 자기 전까지 스마트폰 전원을 끄고 생활하라.' },
    { id: 95, category: 'Challenge', content: '오늘 하루 1만 보를 걸으며 잡념을 털어내라.' },
    { id: 96, category: 'Challenge', content: '내키지 않는 제안이나 부탁을 단호하게 거절해보라.' },
    { id: 97, category: 'Challenge', content: '영화관에 가서 혼자 영화를 보며 온전히 감상에 젖어라.' },
    { id: 98, category: 'Challenge', content: '관심 있는 분야의 원데이 클래스나 모임에 참여해보라.' },
    { id: 99, category: 'Challenge', content: '12시간 이상 공복을 유지하며 몸의 비움을 느껴보라.' },
];

export const CATEGORY_LABELS: Record<MasteryCategory, string> = {
    Sense: '감각', Habit: '습관', Intellect: '지성', Emotion: '감정', Relation: '관계',
    Space: '공간', Body: '신체', Create: '창조', Mind: '사유', Challenge: '도전',
};

// AsyncStorage keys
const COMPLETED_MASTERY_KEY = 'solo_mastery_completed_ids';
const LAST_CATEGORY_KEY = 'solo_mastery_last_category';
const CYCLE_COUNT_KEY = 'solo_mastery_cycle_count';

export function getRegularMission(dayCount: number): DailyMission | null {
    if (dayCount < 1 || dayCount > 50) return null;
    return SOLO_REGULAR.find(m => m.day === dayCount) || null;
}

async function getCompletedMasteryIds(): Promise<number[]> {
    try { const data = await AsyncStorage.getItem(COMPLETED_MASTERY_KEY); return data ? JSON.parse(data) : []; } catch { return []; }
}
async function saveCompletedMasteryId(id: number): Promise<void> {
    const completed = await getCompletedMasteryIds(); if (!completed.includes(id)) { completed.push(id); await AsyncStorage.setItem(COMPLETED_MASTERY_KEY, JSON.stringify(completed)); }
}
async function getLastCategory(): Promise<MasteryCategory | null> {
    try { const data = await AsyncStorage.getItem(LAST_CATEGORY_KEY); return data as MasteryCategory | null; } catch { return null; }
}
async function saveLastCategory(category: MasteryCategory): Promise<void> { await AsyncStorage.setItem(LAST_CATEGORY_KEY, category); }

const CATEGORY_ORDER: MasteryCategory[] = ['Sense', 'Habit', 'Intellect', 'Emotion', 'Relation', 'Space', 'Body', 'Create', 'Mind', 'Challenge'];
function getNextCategory(lastCategory: MasteryCategory | null): MasteryCategory {
    if (!lastCategory) return CATEGORY_ORDER[0]; return CATEGORY_ORDER[(CATEGORY_ORDER.indexOf(lastCategory) + 1) % CATEGORY_ORDER.length];
}

export async function getDailyMasteryMission(): Promise<{ mission: MasteryMission; isNewCycle: boolean; cycleCount: number; completedCount: number; totalCount: number; }> {
    let completedIds = await getCompletedMasteryIds(); let isNewCycle = false; let cycleCount = 1;
    try { const storedCycle = await AsyncStorage.getItem(CYCLE_COUNT_KEY); if (storedCycle) cycleCount = parseInt(storedCycle, 10); } catch { }
    if (completedIds.length >= SOLO_MASTERY.length) { await AsyncStorage.setItem(COMPLETED_MASTERY_KEY, JSON.stringify([])); completedIds = []; isNewCycle = true; cycleCount += 1; await AsyncStorage.setItem(CYCLE_COUNT_KEY, cycleCount.toString()); }
    const lastCategory = await getLastCategory(); const preferredCategory = getNextCategory(lastCategory);
    const availableMissions = SOLO_MASTERY.filter(m => !completedIds.includes(m.id)); let categoryMissions = availableMissions.filter(m => m.category === preferredCategory);
    if (categoryMissions.length === 0) { for (const cat of CATEGORY_ORDER) { categoryMissions = availableMissions.filter(m => m.category === cat); if (categoryMissions.length > 0) break; } }
    const selectedMission = categoryMissions[Math.floor(Math.random() * categoryMissions.length)]; await saveLastCategory(selectedMission.category);
    return { mission: selectedMission, isNewCycle, cycleCount, completedCount: completedIds.length, totalCount: SOLO_MASTERY.length };
}

export async function completeMasteryMission(missionId: number): Promise<void> { await saveCompletedMasteryId(missionId); }
export async function getMasteryProgress(): Promise<{ completedCount: number; totalCount: number; cycleCount: number; percentComplete: number; }> {
    const completedIds = await getCompletedMasteryIds(); let cycleCount = 1;
    try { const storedCycle = await AsyncStorage.getItem(CYCLE_COUNT_KEY); if (storedCycle) cycleCount = parseInt(storedCycle, 10); } catch { }
    return { completedCount: completedIds.length, totalCount: SOLO_MASTERY.length, cycleCount, percentComplete: Math.round((completedIds.length / SOLO_MASTERY.length) * 100) };
}
export async function resetMasteryProgress(): Promise<void> { await AsyncStorage.removeItem(COMPLETED_MASTERY_KEY); await AsyncStorage.removeItem(LAST_CATEGORY_KEY); await AsyncStorage.removeItem(CYCLE_COUNT_KEY); }

export async function getSoloMission(dayCount: number): Promise<{ type: 'regular' | 'mastery'; mission: DailyMission | MasteryMission; level?: number; levelName?: string; isNewCycle?: boolean; cycleCount?: number; completedCount?: number; totalCount?: number; }> {
    if (dayCount <= 50) { const regularMission = getRegularMission(dayCount); if (regularMission) { return { type: 'regular', mission: regularMission, level: regularMission.level, levelName: regularMission.levelName }; } }
    const masteryResult = await getDailyMasteryMission(); return { type: 'mastery', mission: masteryResult.mission, isNewCycle: masteryResult.isNewCycle, cycleCount: masteryResult.cycleCount, completedCount: masteryResult.completedCount, totalCount: masteryResult.totalCount };
}

export default SOLO_MASTERY;
