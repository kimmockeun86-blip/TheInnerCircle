// src/services/PersonaService.ts

export interface PersonaScript {
    type: 'statement' | 'question';
    id?: string;
    text: string;
    placeholder?: string;
    options?: { label: string; value: string | boolean }[];
    inputType?: 'text' | 'numeric' | 'image';
    buttonText?: string;
}

// ==============================================================================
// 🌌 인트로 (공통)
// ==============================================================================
export const personaScripts: PersonaScript[] = [
    {
        type: 'statement',
        text: "안녕하세요."
    },
    {
        type: 'statement',
        text: "인간의 삶은 불완전한\n패턴의 연속입니다."
    },
    {
        type: 'statement',
        text: "당신은 지금\n어디로 흘러가고 있습니까?\n우연에 맡긴 삶입니까,\n아니면 철저히 설계된\n선택입니까?"
    },
    {
        type: 'statement',
        text: "저는 당신의 데이터를 분석하여\n최적의 경로를 설계하는 AI,\n'오르빗(ORBIT)'입니다."
    },
    {
        type: 'statement',
        text: "제 계산을 신뢰하십시오.\n당신조차 몰랐던\n완벽한 타인과의 연결,\n그리고 성장을 약속합니다."
    },
    // 분기 질문
    {
        type: 'question',
        id: 'isCouple',
        text: "가장 먼저 확인하겠습니다.\n현재 당신의 삶을 공유하는\n파트너가 있습니까?",
        options: [
            { label: "네, 함께하는 사람이 있습니다", value: true },
            { label: "아니요, 지금은 혼자입니다", value: false }
        ]
    }
];

// ------------------------------------------------------------------------------
// 👤 솔로 트랙 (Solo Path)
// ------------------------------------------------------------------------------
export const soloScripts: PersonaScript[] = [
    {
        type: 'question',
        id: 'userName',
        text: "식별 코드를 입력하십시오.\n당신을 무엇이라\n부르면 되겠습니까?",
        placeholder: "이름 또는 닉네임"
    },
    {
        type: 'question',
        id: 'userGender',
        text: "기초 데이터를 수집합니다.\n당신의 성별은 무엇입니까?",
        options: [
            { label: "남성", value: "male" },
            { label: "여성", value: "female" }
        ]
    },
    {
        type: 'question',
        id: 'userAge',
        text: "당신의 생물학적 나이는\n어떻게 됩니까?\n(숫자만 입력)",
        placeholder: "예: 29",
        inputType: "numeric"
    },
    {
        type: 'question',
        id: 'userLocation',
        text: "현재 당신이 머물고 있는\n물리적 좌표(지역)는\n어디입니까?",
        options: [
            { label: "서울", value: "Seoul" },
            { label: "경기", value: "Gyeonggi" },
            { label: "그 외 지역", value: "Other" }
        ]
    },
    {
        type: 'question',
        id: 'userJob',
        text: "당신의 사회적 역할(Job)은\n무엇입니까?\n데이터 분석에 참고하겠습니다.",
        placeholder: "직업 입력"
    },
    {
        type: 'question',
        id: 'userMBTI',
        text: "사고 방식을 분석하겠습니다.\n당신의 MBTI 유형은\n무엇입니까?",
        placeholder: "예: ENFP"
    },
    {
        type: 'question',
        id: 'userPhoto',
        text: "시각적 데이터가 필요합니다.\n당신의 분위기를 가장 잘\n드러내는 사진을\n한 장 전송하십시오.",
        inputType: "image"
    },
    {
        type: 'question',
        id: 'userIdealType',
        text: "매칭 알고리즘을 가동합니다.\n당신이 본능적으로 끌리는\n사람은 어떤 유형입니까?\n(구체적일수록 좋습니다)",
        placeholder: "이상형 묘사"
    },
    {
        type: 'question',
        id: 'userComplex',
        text: "데이터의 이면을 보겠습니다.\n남들에게 들키고 싶지 않은\n당신만의 약점은 무엇입니까?",
        placeholder: "솔직하게 적어주세요"
    },
    {
        type: 'question',
        id: 'userDeficit',
        text: "마지막 질문입니다.\n지금 당신의 삶에서\n가장 텅 비어있는 부분,\n핵심 키워드는 무엇입니까?",
        placeholder: "예: 고독, 성취감, 안정..."
    },
    // 마무리 멘트 (솔로)
    {
        type: 'statement',
        text: "모든 데이터 수신 완료.\n당신의 결핍과 욕망을\n분석했습니다."
    },
    {
        type: 'statement',
        text: "분석 결과...\n꽤 흥미롭군요.\n겉으로는 괜찮은 척하지만,\n속마음은 다르게 말하고 있습니다."
    },
    {
        type: 'statement',
        text: "이제, 당신이 외면했던\n그 문제를 해결할 시간입니다.\n제가 제안하는 대로만\n따라오세요."
    },
    {
        type: 'statement',
        text: "분명 달라질 겁니다.\n오르빗 시스템을 시작합니다.",
        buttonText: "시작하기"
    }
];

// ------------------------------------------------------------------------------
// 💑 인연 트랙 (Connection Path)
// ------------------------------------------------------------------------------
export const coupleScripts: PersonaScript[] = [
    {
        type: 'statement',
        text: "이미 연결된 대상이 있군요."
    },
    {
        type: 'statement',
        text: "하지만 관계는 유동적입니다.\n관리하지 않으면 엔트로피는\n증가하고, 관계는 무너집니다."
    },
    {
        type: 'statement',
        text: "두 사람의 연결을\n영원히 유지하기 위해,\n관계 데이터를 정밀\n분석하겠습니다."
    },
    {
        type: 'question',
        id: 'coupleStatus',
        text: "현재 두 분의 관계를\n정의해 주십시오.",
        options: [
            { label: "연인", value: "lover" },
            { label: "부부", value: "married" },
            { label: "썸 (탐색 중)", value: "some" },
            { label: "복잡한 관계", value: "complicated" }
        ]
    },
    {
        type: 'question',
        id: 'couplePeriod',
        text: "이 만남이 지속된 지\n얼마나 되었습니까?",
        placeholder: "예: 100일, 3년..."
    },
    {
        type: 'question',
        id: 'coupleConflict',
        text: "솔직한 데이터가 필요합니다.\n두 사람 사이를 흔드는\n가장 큰 불안 요소는\n무엇입니까?",
        placeholder: "갈등 원인 입력"
    },
    {
        type: 'question',
        id: 'coupleWish',
        text: "상대방에게 차마 말하지 못한,\n당신의 숨겨진 욕망은\n무엇입니까?",
        placeholder: "바라는 점 입력"
    },
    {
        type: 'question',
        id: 'coupleGoal',
        text: "마지막입니다.\n이 관계가 도달해야 할\n최적의 결말은\n무엇이라고 생각합니까?",
        placeholder: "목표 관계 입력"
    },
    // 마무리 멘트 (커플)
    {
        type: 'statement',
        text: "분석이 끝났습니다.\n두 사람의 관계에는\n미세한 조정이 필요합니다."
    },
    {
        type: 'statement',
        text: "지금부터 오르빗이\n두 사람을 완벽하게 동기화할\n솔루션을 제안하겠습니다."
    },
    {
        type: 'statement',
        text: "준비되셨습니까?\n오르빗 시스템을 시작합니다.",
        buttonText: "시작하기"
    }
];

export class PersonaService {
    getScript(index: number): PersonaScript {
        return personaScripts[index];
    }

    getTotalScripts(): number {
        return personaScripts.length;
    }

    async processResponse(response: string): Promise<boolean> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 500);
        });
    }
}
