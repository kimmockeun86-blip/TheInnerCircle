const axios = require('axios');

const SERVER_URL = 'http://localhost:3000/api/users/register';

const males = [
    { name: '김철수', age: '28', job: '개발자', deficit: '소통', image: '/uploads/profiles/male_1.png' },
    { name: '이영호', age: '32', job: '디자이너', deficit: '자존감', image: '/uploads/profiles/male_2.png' },
    { name: '박민수', age: '29', job: '작가', deficit: '용기', image: '/uploads/profiles/male_3.png' },
    { name: '정우성', age: '35', job: '배우', deficit: '평범함', image: '/uploads/profiles/male_4.png' },
    // Fallback to Unsplash for remaining due to API quota
    { name: '강동원', age: '33', job: '모델', deficit: '진정성', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=60' },
    { name: '최현우', age: '27', job: '건축가', deficit: '휴식', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60' },
    { name: '박서준', age: '31', job: '셰프', deficit: '안정', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60' },
    { name: '이민호', age: '34', job: 'CEO', deficit: '신뢰', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&auto=format&fit=crop&q=60' },
    { name: '김도윤', age: '26', job: '사진작가', deficit: '표현', image: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=500&auto=format&fit=crop&q=60' },
    { name: '장기용', age: '30', job: '의사', deficit: '여유', image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=500&auto=format&fit=crop&q=60' }
];

const females = [
    { name: '김영희', age: '27', job: '마케터', deficit: '휴식', image: '/uploads/profiles/female_1.png' },
    { name: '박지민', age: '30', job: '교사', deficit: '열정', image: '/uploads/profiles/female_2.png' },
    { name: '최수진', age: '29', job: '간호사', deficit: '여유', image: '/uploads/profiles/female_3.png' },
    // Fallback to Unsplash for remaining due to API quota
    { name: '이효리', age: '34', job: '가수', deficit: '소박함', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=60' },
    { name: '송혜교', age: '32', job: '배우', deficit: '사랑', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60' },
    { name: '김태희', age: '31', job: '약사', deficit: '자유', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&auto=format&fit=crop&q=60' },
    { name: '전지현', age: '33', job: '변호사', deficit: '균형', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60' },
    { name: '한지민', age: '28', job: '플로리스트', deficit: '자신감', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=60' },
    { name: '손예진', age: '35', job: '작가', deficit: '이해', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=60' },
    { name: '박보영', age: '26', job: '디자이너', deficit: '성장', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=60' }
];

async function seedData() {
    console.log('Starting Data Seeding...');

    const allUsers = [...males, ...females];

    for (const user of allUsers) {
        try {
            const userData = {
                name: user.name,
                gender: males.includes(user) ? '남성' : '여성',
                age: user.age,
                job: user.job,
                deficit: user.deficit,
                profileImage: user.image
            };

            const response = await axios.post(SERVER_URL, userData);
            console.log(`Registered: ${user.name} (${response.data.success ? 'Success' : 'Failed'})`);
        } catch (error) {
            console.error(`Failed to register ${user.name}:`, error.message);
        }
    }

    console.log('Seeding Completed!');
}

seedData();
