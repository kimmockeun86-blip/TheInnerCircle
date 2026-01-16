/**
 * 데일리 질문 데이터
 * 커플이 매일 나눌 수 있는 질문들
 */

export interface DailyQuestion {
    id: string;
    question: string;
    category: 'memory' | 'future' | 'emotion' | 'fun' | 'deep';
    followUp?: string; // 후속 질문
}

// 추억 관련 질문
const memoryQuestions: DailyQuestion[] = [
    { id: 'm1', question: '처음 만났을 때 나의 첫인상은 어땠어?', category: 'memory' },
    { id: 'm2', question: '우리가 함께한 가장 기억에 남는 여행은?', category: 'memory' },
    { id: 'm3', question: '내가 했던 말 중 가장 감동받았던 건?', category: 'memory' },
    { id: 'm4', question: '우리 연애 초기에 가장 설렜던 순간은?', category: 'memory' },
    { id: 'm5', question: '나와 있으면서 가장 웃겼던 에피소드는?', category: 'memory' },
    { id: 'm6', question: '우리가 처음 싸웠던 이유가 뭐였더라?', category: 'memory' },
    { id: 'm7', question: '내가 널 좋아하게 된 결정적인 순간은 언제야?', category: 'memory' },
    { id: 'm8', question: '우리가 함께 먹었던 음식 중 최고였던 건?', category: 'memory' },
    { id: 'm9', question: '나와의 첫 키스 기억나? 어땠어?', category: 'memory' },
    { id: 'm10', question: '내가 선물한 것 중 가장 마음에 들었던 건?', category: 'memory' },
    { id: 'm11', question: '우리가 함께 울었던 순간이 있었어?', category: 'memory' },
    { id: 'm12', question: '나와 처음 손잡았던 날 기억나?', category: 'memory' },
    { id: 'm13', question: '내가 아팠을 때 가장 고마웠던 순간은?', category: 'memory' },
    { id: 'm14', question: '우리가 함께한 가장 특별한 기념일은?', category: 'memory' },
    { id: 'm15', question: '나와의 추억 중 사진으로 남기지 못해 아쉬운 순간은?', category: 'memory' },
];

// 미래 관련 질문
const futureQuestions: DailyQuestion[] = [
    { id: 'f1', question: '10년 후 우리는 어떤 모습일까?', category: 'future' },
    { id: 'f2', question: '함께 꼭 가보고 싶은 나라는?', category: 'future' },
    { id: 'f3', question: '우리만의 집이 생긴다면 어떻게 꾸미고 싶어?', category: 'future' },
    { id: 'f4', question: '아이가 생긴다면 어떤 부모가 되고 싶어?', category: 'future' },
    { id: 'f5', question: '은퇴 후 함께 하고 싶은 것은?', category: 'future' },
    { id: 'f6', question: '올해 안에 꼭 함께 이루고 싶은 목표가 있어?', category: 'future' },
    { id: 'f7', question: '다음 여행은 어디로 가고 싶어?', category: 'future' },
    { id: 'f8', question: '함께 배워보고 싶은 것이 있어?', category: 'future' },
    { id: 'f9', question: '우리의 결혼식은 어떤 분위기였으면 좋겠어?', category: 'future' },
    { id: 'f10', question: '5년 후에도 지금처럼 사랑할 것 같아?', category: 'future' },
    { id: 'f11', question: '함께 도전해보고 싶은 버킷리스트가 있어?', category: 'future' },
    { id: 'f12', question: '반려동물을 키운다면 어떤 동물이 좋아?', category: 'future' },
    { id: 'f13', question: '우리가 늙어서도 함께 하고 싶은 일상은?', category: 'future' },
    { id: 'f14', question: '나와 함께 사업을 한다면 뭘 하고 싶어?', category: 'future' },
    { id: 'f15', question: '우리 관계에서 앞으로 더 발전시키고 싶은 부분은?', category: 'future' },
];

// 감정 관련 질문
const emotionQuestions: DailyQuestion[] = [
    { id: 'e1', question: '오늘 기분이 어때? 솔직하게 말해줘', category: 'emotion' },
    { id: 'e2', question: '요즘 나한테 서운한 거 있어?', category: 'emotion' },
    { id: 'e3', question: '내가 어떨 때 가장 사랑스러워?', category: 'emotion' },
    { id: 'e4', question: '나와 함께할 때 가장 안정감을 느끼는 순간은?', category: 'emotion' },
    { id: 'e5', question: '나에게 고마운 점 하나만 말해줘', category: 'emotion' },
    { id: 'e6', question: '내가 더 잘해줬으면 하는 부분이 있어?', category: 'emotion' },
    { id: 'e7', question: '요즘 가장 걱정되는 건 뭐야?', category: 'emotion' },
    { id: 'e8', question: '나와 있을 때 가장 행복한 순간은 언제야?', category: 'emotion' },
    { id: 'e9', question: '나에게 하고 싶었지만 못했던 말이 있어?', category: 'emotion' },
    { id: 'e10', question: '우리 관계에서 가장 자랑스러운 점은?', category: 'emotion' },
    { id: 'e11', question: '내가 어떨 때 가장 멋있어 보여?', category: 'emotion' },
    { id: 'e12', question: '지금 나에게 가장 필요한 건 뭐야?', category: 'emotion' },
    { id: 'e13', question: '나와 헤어질까 봐 불안한 적 있어?', category: 'emotion' },
    { id: 'e14', question: '내가 너를 얼마나 사랑하는지 알아?', category: 'emotion' },
    { id: 'e15', question: '우리 사이에 해결하고 싶은 문제가 있어?', category: 'emotion' },
];

// 재미있는 질문
const funQuestions: DailyQuestion[] = [
    { id: 'fun1', question: '나를 동물에 비유한다면 뭘까?', category: 'fun' },
    { id: 'fun2', question: '우리 둘 중 누가 먼저 좀비가 될 것 같아?', category: 'fun' },
    { id: 'fun3', question: '내가 연예인이라면 어떤 타입일 것 같아?', category: 'fun' },
    { id: 'fun4', question: '지금 당장 100만원이 생기면 뭐 할래?', category: 'fun' },
    { id: 'fun5', question: '나의 가장 웃긴 습관은 뭐야?', category: 'fun' },
    { id: 'fun6', question: '우리가 영화 속 커플이라면 어떤 영화일까?', category: 'fun' },
    { id: 'fun7', question: '나를 음식에 비유한다면?', category: 'fun' },
    { id: 'fun8', question: '내가 슈퍼파워를 가진다면 뭐였으면 좋겠어?', category: 'fun' },
    { id: 'fun9', question: '우리 커플송이 있다면 뭐였으면 좋겠어?', category: 'fun' },
    { id: 'fun10', question: '나한테 가장 자주 쓰는 이모티콘은 뭐야?', category: 'fun' },
    { id: 'fun11', question: '내가 로또에 당첨되면 가장 먼저 뭘 사줄 것 같아?', category: 'fun' },
    { id: 'fun12', question: '우리 둘의 유튜브 채널을 만든다면 컨셉은?', category: 'fun' },
    { id: 'fun13', question: '나를 색깔로 표현한다면?', category: 'fun' },
    { id: 'fun14', question: '우리가 함께 나올 법한 예능 프로그램은?', category: 'fun' },
    { id: 'fun15', question: '내가 거짓말할 때 어떻게 알아?', category: 'fun' },
];

// 깊은 대화 질문
const deepQuestions: DailyQuestion[] = [
    { id: 'd1', question: '네가 생각하는 진정한 사랑이란 뭐야?', category: 'deep' },
    { id: 'd2', question: '인생에서 가장 후회되는 일이 있어?', category: 'deep' },
    { id: 'd3', question: '내가 없었다면 네 인생은 어떻게 달랐을까?', category: 'deep' },
    { id: 'd4', question: '네가 가장 두려워하는 것은 뭐야?', category: 'deep' },
    { id: 'd5', question: '행복이란 뭐라고 생각해?', category: 'deep' },
    { id: 'd6', question: '죽기 전에 꼭 이루고 싶은 꿈이 있어?', category: 'deep' },
    { id: 'd7', question: '네 인생의 터닝포인트는 언제였어?', category: 'deep' },
    { id: 'd8', question: '가장 존경하는 사람은 누구야?', category: 'deep' },
    { id: 'd9', question: '네가 가장 자랑스러워하는 성취는?', category: 'deep' },
    { id: 'd10', question: '우리 관계가 네 인생에 어떤 의미야?', category: 'deep' },
    { id: 'd11', question: '혼자만의 시간이 필요할 때는 언제야?', category: 'deep' },
    { id: 'd12', question: '아픈 기억을 치유하는 네만의 방법이 있어?', category: 'deep' },
    { id: 'd13', question: '네가 생각하는 완벽한 하루는 어떤 모습이야?', category: 'deep' },
    { id: 'd14', question: '과거로 돌아갈 수 있다면 언제로 가고 싶어?', category: 'deep' },
    { id: 'd15', question: '삶에서 가장 중요하게 생각하는 가치는 뭐야?', category: 'deep' },
];

// 모든 질문 합치기
export const ALL_QUESTIONS: DailyQuestion[] = [
    ...memoryQuestions,
    ...futureQuestions,
    ...emotionQuestions,
    ...funQuestions,
    ...deepQuestions,
];

// 카테고리별 이름
export const CATEGORY_NAMES: Record<DailyQuestion['category'], { name: string; emoji: string }> = {
    memory: { name: '추억', emoji: '📸' },
    future: { name: '미래', emoji: '🔮' },
    emotion: { name: '감정', emoji: '💕' },
    fun: { name: '재미', emoji: '🎉' },
    deep: { name: '깊은 대화', emoji: '🌙' },
};

// 오늘의 질문 가져오기 (날짜 기반)
export function getTodaysQuestion(): DailyQuestion {
    const today = new Date();
    const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    const index = dayOfYear % ALL_QUESTIONS.length;
    return ALL_QUESTIONS[index];
}

// 랜덤 질문 가져오기
export function getRandomQuestion(category?: DailyQuestion['category']): DailyQuestion {
    const pool = category
        ? ALL_QUESTIONS.filter(q => q.category === category)
        : ALL_QUESTIONS;

    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
}

// 카테고리별 질문 가져오기
export function getQuestionsByCategory(category: DailyQuestion['category']): DailyQuestion[] {
    return ALL_QUESTIONS.filter(q => q.category === category);
}

export default ALL_QUESTIONS;
