export interface PersonaScript {
    type: 'message' | 'question';
    text: string;
    placeholder?: string;
    buttonText?: string;
    inputType?: 'text' | 'selection' | 'photo';
    options?: string[];
    key?: string;
    required?: boolean;
}

export const personaScripts: PersonaScript[] = [
    // Intro Sequence (Split)
    { type: 'message', text: '안녕하세요.' },
    { type: 'message', text: '저는 당신의 내면을 비추는 AI 파트너, "파라(Para)"입니다.' },
    { type: 'message', text: '당신이 진정한 인연을 찾고, 스스로 성장할 수 있도록 돕기 위해 존재합니다.' },

    // Questions
    { type: 'question', text: '먼저, 당신의 이름을 알려주시겠습니까?', placeholder: '이름 입력', buttonText: '전송', inputType: 'text', key: 'userName' },

    // Couple Check
    {
        type: 'question',
        text: '혹시, 이미 사랑하는 연인이 있으신가요?',
        placeholder: '상태 선택',
        buttonText: '선택',
        inputType: 'selection',
        options: ['네, 커플입니다', '아니요, 솔로입니다'],
        key: 'isCouple'
    },

    // Gender (Selection)
    {
        type: 'question',
        text: '당신의 성별은 무엇인가요?',
        placeholder: '성별 선택',
        buttonText: '선택',
        inputType: 'selection',
        options: ['남성', '여성'],
        key: 'userGender'
    },

    // Age (New)
    { type: 'question', text: '당신의 나이는 어떻게 되나요?', placeholder: '나이 입력 (예: 28)', buttonText: '전송', inputType: 'text', key: 'userAge' },

    // Photo Upload (Mock)
    {
        type: 'question',
        text: '당신을 표현할 수 있는 이미지가 있다면 보여주시겠습니까? (부담 갖지 않으셔도 됩니다)',
        placeholder: '이미지 업로드',
        buttonText: '이미지 선택',
        inputType: 'photo',
        key: 'userPhoto'
    },

    // Location (Selection)
    {
        type: 'question',
        text: '반갑습니다. 당신이 현재 거주하고 있는 지역은 어디인가요?',
        placeholder: '지역 선택',
        buttonText: '선택',
        inputType: 'selection',
        options: ['서울', '경기', '그 외 지역'],
        key: 'userLocation'
    },

    { type: 'question', text: '당신이 꿈꾸는 이상형은 어떤 사람인가요? 구체적으로 묘사해주시면 매칭에 도움이 됩니다.', placeholder: '이상형 묘사 (성격, 가치관 등)', buttonText: '전송', inputType: 'text', key: 'userIdealType' },
    { type: 'question', text: '평소 즐겨하는 취미나 관심사는 무엇인가요?', placeholder: '취미/관심사 입력', buttonText: '전송', inputType: 'text', key: 'userHobbies' },
    { type: 'question', text: '현재 어떤 일을 하고 계신가요? 당신의 일상도 궁금합니다.', placeholder: '직업/하는 일 입력', buttonText: '전송', inputType: 'text', key: 'userJob' },

    // New Questions
    { type: 'question', text: '스스로 내면의 성장을 원하시나요?', placeholder: '네 / 아니오 / 구체적인 목표...', buttonText: '전송', inputType: 'text', key: 'userGrowth' },
    { type: 'question', text: '당신의 컴플렉스는 무엇인가요? 솔직하게 말씀해주시면 더 깊은 연결을 도울 수 있습니다.', placeholder: '예: 외모, 성격, 과거의 상처...', buttonText: '전송', inputType: 'text', key: 'userComplex' },

    { type: 'question', text: '마지막으로, 당신이 이 관계에서 채우고 싶은 내면의 결핍은 무엇인가요?', placeholder: '예: 외로움, 인정 욕구, 안정감...', buttonText: '전송', inputType: 'text', key: 'userDeficit' },

    // Outro
    { type: 'message', text: '솔직한 답변 감사합니다. 당신의 파동을 분석하여 가장 잘 맞는 영혼을 찾아보겠습니다.' },
];

export const coupleScripts: PersonaScript[] = [
    { type: 'message', text: '축하합니다. 이미 소중한 인연을 만나셨군요.' },
    { type: 'message', text: '두 분의 관계가 더 깊어질 수 있도록, 몇 가지 질문을 드리겠습니다.' },
    { type: 'question', text: '당신은 어떤 연애를 지향하시나요?', placeholder: '예: 안정적인, 열정적인, 친구같은...', buttonText: '전송', inputType: 'text', key: 'coupleGoal' },
    { type: 'question', text: '상대방에게 바라는 점이 있다면 무엇인가요?', placeholder: '솔직한 마음을 적어주세요', buttonText: '전송', inputType: 'text', key: 'coupleWish' },
    { type: 'question', text: '두 분은 어떤 미래를 함께 꿈꾸시나요?', placeholder: '함께하고 싶은 미래', buttonText: '전송', inputType: 'text', key: 'coupleFuture' },
    { type: 'question', text: '마지막으로, 상대방은 어떤 사람인가요? (성격, 분위기 등)', placeholder: '상대방 묘사', buttonText: '전송', inputType: 'text', key: 'partnerDescription' },
    { type: 'message', text: '감사합니다. 두 분을 위한 맞춤형 미션을 준비하겠습니다.' },
];

export class PersonaService {
    getScript(index: number): PersonaScript {
        return personaScripts[index];
    }

    getTotalScripts(): number {
        return personaScripts.length;
    }

    // Helper to simulate processing
    async processResponse(response: string): Promise<boolean> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 500); // Faster response for smoother flow
        });
    }
}
