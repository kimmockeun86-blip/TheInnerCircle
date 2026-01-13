// Matching Service - Firebase 기반 매칭 시스템
// 매칭 우선순위: 거리 50% / 나이 20% / 키워드(Deficit) 30%

import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationService, { UserLocation } from './LocationService';
import { db } from '../config/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    Timestamp,
    orderBy,
    limit
} from 'firebase/firestore';

export interface UserProfile {
    uid: string;
    name: string;
    age: number;
    gender: string;
    deficit: string;
    job?: string;
    bio?: string;
    photo?: string;
    location?: UserLocation;
    dayCount: number;
    isMatchingActive: boolean;
}

export interface MatchCandidate extends UserProfile {
    score: number;
    distance: number;
    distanceText: string;
}

export interface Letter {
    id: string;
    fromUid: string;
    fromName: string;
    toUid: string;
    content: string;
    status: 'sent' | 'read' | 'replied' | 'matched';
    createdAt: string;
}

// 수행기록 인터페이스
export interface JournalRecord {
    id: string;
    uid: string;           // 사용자 ID
    type: 'solo' | 'couple'; // 기록 타입
    day: number;
    date: string;
    content: string;       // 저널 내용
    mission: string;       // 수행한 미션
    analysis?: string;     // AI 분석 결과
    feedback?: string;     // AI 피드백
    imageUrl?: string;     // 이미지 URL
    createdAt: string;
}

// 매칭 가중치
const MATCH_WEIGHTS = {
    DISTANCE: 0.50,  // 50%
    AGE: 0.20,       // 20%
    DEFICIT: 0.30    // 30%
};

class MatchingService {
    private static instance: MatchingService;

    private constructor() { }

    static getInstance(): MatchingService {
        if (!MatchingService.instance) {
            MatchingService.instance = new MatchingService();
        }
        return MatchingService.instance;
    }

    // 사용자 프로필 저장/업데이트
    async saveUserProfile(profile: UserProfile): Promise<boolean> {
        try {
            const userRef = doc(db, 'users', profile.uid);
            await setDoc(userRef, {
                ...profile,
                updatedAt: Timestamp.now()
            }, { merge: true });

            console.log('[MatchingService] 프로필 저장 완료:', profile.uid);
            return true;
        } catch (error) {
            console.error('Save profile error:', error);
            return false;
        }
    }

    // 매칭 후보 찾기
    async findMatchCandidates(user: UserProfile): Promise<MatchCandidate[]> {
        try {
            // 이성 필터
            const oppositeGender = user.gender === '남성' ? '여성' : '남성';

            // Firestore 쿼리
            const usersRef = collection(db, 'users');
            const q = query(
                usersRef,
                where('gender', '==', oppositeGender),
                where('isMatchingActive', '==', true)
            );

            const querySnapshot = await getDocs(q);
            const candidates: MatchCandidate[] = [];

            for (const docSnap of querySnapshot.docs) {
                const candidate = docSnap.data() as UserProfile;
                if (candidate.uid === user.uid) continue; // 자기 자신 제외

                // 점수 계산
                const scoreResult = this.calculateMatchScore(user, candidate);

                candidates.push({
                    ...candidate,
                    ...scoreResult
                });
            }

            // 점수순 정렬
            candidates.sort((a, b) => b.score - a.score);

            console.log(`[MatchingService] ${candidates.length}명의 후보 중 최상위 1명 선택`);
            return candidates.slice(0, 1); // 단 한 명만 반환 (문서 정책)
        } catch (error) {
            console.error('Find candidates error:', error);
            return [];
        }
    }

    // 매칭 점수 계산
    private calculateMatchScore(
        user: UserProfile,
        candidate: UserProfile
    ): { score: number; distance: number; distanceText: string } {
        let totalScore = 0;
        let distance = 999;

        // 1. 거리 점수 (50%)
        if (user.location && candidate.location) {
            distance = LocationService.calculateDistance(
                user.location.latitude,
                user.location.longitude,
                candidate.location.latitude,
                candidate.location.longitude
            );

            let distanceScore = 0;
            if (distance < 3) distanceScore = 100;
            else if (distance < 5) distanceScore = 90;
            else if (distance < 10) distanceScore = 75;
            else if (distance < 20) distanceScore = 60;
            else if (distance < 50) distanceScore = 40;
            else if (distance < 100) distanceScore = 20;
            else distanceScore = 5;

            totalScore += distanceScore * MATCH_WEIGHTS.DISTANCE;
        }

        // 2. 나이 점수 (20%)
        const ageDiff = Math.abs(user.age - candidate.age);
        let ageScore = 0;
        if (ageDiff <= 2) ageScore = 100;
        else if (ageDiff <= 4) ageScore = 80;
        else if (ageDiff <= 6) ageScore = 60;
        else if (ageDiff <= 10) ageScore = 40;
        else ageScore = 20;

        totalScore += ageScore * MATCH_WEIGHTS.AGE;

        // 3. 키워드(Deficit) 호환성 (30%)
        let deficitScore = 0;
        if (user.deficit === candidate.deficit) {
            deficitScore = 100; // 같은 키워드 = 공감 가능
        } else {
            // 보완적 키워드 매칭 (추후 확장 가능)
            deficitScore = 50;
        }

        totalScore += deficitScore * MATCH_WEIGHTS.DEFICIT;

        return {
            score: Math.round(totalScore),
            distance,
            distanceText: LocationService.formatDistance(distance)
        };
    }

    // 편지 전송
    async sendLetter(letter: Omit<Letter, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> {
        try {
            // 중복 체크
            const existingLetterQuery = query(
                collection(db, 'letters'),
                where('fromUid', '==', letter.fromUid),
                where('toUid', '==', letter.toUid)
            );
            const existing = await getDocs(existingLetterQuery);

            if (!existing.empty) {
                return { success: false, message: '이미 편지를 보낸 상대입니다.' };
            }

            const letterId = `letter_${Date.now()}`;
            const letterRef = doc(db, 'letters', letterId);

            await setDoc(letterRef, {
                ...letter,
                id: letterId,
                createdAt: new Date().toISOString()
            });

            console.log('[MatchingService] 편지 전송:', letterId);
            return { success: true, message: '편지가 전송되었습니다!' };
        } catch (error) {
            console.error('Send letter error:', error);
            return { success: false, message: '편지 전송에 실패했습니다.' };
        }
    }

    // 받은 편지 조회
    async getReceivedLetters(uid: string): Promise<Letter[]> {
        try {
            const lettersQuery = query(
                collection(db, 'letters'),
                where('toUid', '==', uid),
                orderBy('createdAt', 'desc'),
                limit(20)
            );

            const querySnapshot = await getDocs(lettersQuery);
            const letters: Letter[] = [];

            querySnapshot.forEach(doc => {
                letters.push(doc.data() as Letter);
            });

            return letters;
        } catch (error) {
            console.error('Get letters error:', error);
            return [];
        }
    }

    // 매칭 수락
    async acceptMatch(
        userUid: string,
        partnerUid: string
    ): Promise<{ success: boolean; matchId?: string }> {
        try {
            const matchId = `match_${Date.now()}`;
            const matchRef = doc(db, 'matches', matchId);

            await setDoc(matchRef, {
                id: matchId,
                users: [userUid, partnerUid],
                matchedAt: Timestamp.now(),
                status: 'active',
                coupleData: {
                    dayCount: 1,
                    photo: null
                }
            });

            // 두 사용자의 매칭 상태 업데이트
            await updateDoc(doc(db, 'users', userUid), { isMatchingActive: false });
            await updateDoc(doc(db, 'users', partnerUid), { isMatchingActive: false });

            console.log('[MatchingService] 매칭 성공:', matchId);
            return { success: true, matchId };
        } catch (error) {
            console.error('Accept match error:', error);
            return { success: false };
        }
    }

    // 수행기록 저장 (Firebase Firestore)
    async saveJournalRecord(record: JournalRecord): Promise<boolean> {
        try {
            const journalRef = doc(db, 'journals', record.id);
            await setDoc(journalRef, {
                ...record,
                savedAt: Timestamp.now()
            });

            console.log('[MatchingService] 수행기록 저장 완료:', record.id);
            return true;
        } catch (error) {
            console.error('[MatchingService] 수행기록 저장 실패:', error);
            return false;
        }
    }

    // 수행기록 조회 (특정 사용자)
    async getJournalRecords(uid: string): Promise<JournalRecord[]> {
        try {
            const journalsQuery = query(
                collection(db, 'journals'),
                where('uid', '==', uid),
                orderBy('createdAt', 'desc'),
                limit(50)
            );

            const querySnapshot = await getDocs(journalsQuery);
            const journals: JournalRecord[] = [];

            querySnapshot.forEach(docSnap => {
                journals.push(docSnap.data() as JournalRecord);
            });

            return journals;
        } catch (error) {
            console.error('[MatchingService] 수행기록 조회 실패:', error);
            return [];
        }
    }

    // 만남 결정 저장
    async saveMeetingDecision(
        matchId: string,
        userUid: string,
        decision: 'continue' | 'stop'
    ): Promise<boolean> {
        try {
            const decisionRef = doc(db, 'meetingDecisions', `${matchId}_${userUid}`);
            await setDoc(decisionRef, {
                matchId,
                userUid,
                decision,
                decidedAt: Timestamp.now()
            });

            console.log('[MatchingService] 만남 결정 저장:', { matchId, userUid, decision });
            return true;
        } catch (error) {
            console.error('[MatchingService] 만남 결정 저장 실패:', error);
            return false;
        }
    }

    // 상대방 만남 결정 조회
    async getPartnerMeetingDecision(
        matchId: string,
        partnerUid: string
    ): Promise<'continue' | 'stop' | null> {
        try {
            const decisionRef = doc(db, 'meetingDecisions', `${matchId}_${partnerUid}`);
            const decisionDoc = await getDoc(decisionRef);

            if (decisionDoc.exists()) {
                return decisionDoc.data().decision as 'continue' | 'stop';
            }
            return null;
        } catch (error) {
            console.error('[MatchingService] 상대방 결정 조회 실패:', error);
            return null;
        }
    }

    // 매칭 ID 생성 (두 사용자 UID 조합)
    generateMatchId(uid1: string, uid2: string): string {
        // 정렬해서 항상 같은 ID 생성
        const sorted = [uid1, uid2].sort();
        return `match_${sorted[0]}_${sorted[1]}`;
    }

    // ============================================
    // 양방향 협의 기능 (2026-01-13 추가)
    // ============================================

    // 날짜 제안
    async proposeDate(
        matchId: string,
        fromUid: string,
        proposedDate: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            const proposalRef = doc(db, 'meetingProposals', `${matchId}_date`);
            await setDoc(proposalRef, {
                matchId,
                type: 'date',
                proposedBy: fromUid,
                value: proposedDate,
                status: 'pending',
                createdAt: Timestamp.now()
            });
            console.log('[MatchingService] 날짜 제안:', proposedDate);
            return { success: true, message: '날짜가 제안되었습니다.' };
        } catch (error) {
            console.error('[MatchingService] 날짜 제안 실패:', error);
            return { success: false, message: '날짜 제안에 실패했습니다.' };
        }
    }

    // 장소 제안
    async proposePlace(
        matchId: string,
        fromUid: string,
        proposedPlace: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            const proposalRef = doc(db, 'meetingProposals', `${matchId}_place`);
            await setDoc(proposalRef, {
                matchId,
                type: 'place',
                proposedBy: fromUid,
                value: proposedPlace,
                status: 'pending',
                createdAt: Timestamp.now()
            });
            console.log('[MatchingService] 장소 제안:', proposedPlace);
            return { success: true, message: '장소가 제안되었습니다.' };
        } catch (error) {
            console.error('[MatchingService] 장소 제안 실패:', error);
            return { success: false, message: '장소 제안에 실패했습니다.' };
        }
    }

    // 제안 수락
    async acceptProposal(
        matchId: string,
        type: 'date' | 'place'
    ): Promise<{ success: boolean }> {
        try {
            const proposalRef = doc(db, 'meetingProposals', `${matchId}_${type}`);
            await updateDoc(proposalRef, {
                status: 'accepted',
                acceptedAt: Timestamp.now()
            });
            console.log(`[MatchingService] ${type} 제안 수락됨`);
            return { success: true };
        } catch (error) {
            console.error(`[MatchingService] ${type} 제안 수락 실패:`, error);
            return { success: false };
        }
    }

    // 제안 거절 + 역제안
    async rejectWithCounterOffer(
        matchId: string,
        type: 'date' | 'place',
        fromUid: string,
        counterOffer: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            const proposalRef = doc(db, 'meetingProposals', `${matchId}_${type}`);
            await setDoc(proposalRef, {
                matchId,
                type,
                proposedBy: fromUid,
                value: counterOffer,
                status: 'pending',
                isCounterOffer: true,
                createdAt: Timestamp.now()
            });
            console.log(`[MatchingService] ${type} 역제안:`, counterOffer);
            return { success: true, message: '역제안이 전송되었습니다.' };
        } catch (error) {
            console.error(`[MatchingService] ${type} 역제안 실패:`, error);
            return { success: false, message: '역제안에 실패했습니다.' };
        }
    }

    // 제안 상태 조회
    async getProposalStatus(
        matchId: string,
        type: 'date' | 'place'
    ): Promise<{ status: string; value: string; proposedBy: string } | null> {
        try {
            const proposalRef = doc(db, 'meetingProposals', `${matchId}_${type}`);
            const proposalDoc = await getDoc(proposalRef);
            if (proposalDoc.exists()) {
                const data = proposalDoc.data();
                return {
                    status: data.status,
                    value: data.value,
                    proposedBy: data.proposedBy
                };
            }
            return null;
        } catch (error) {
            console.error(`[MatchingService] ${type} 제안 조회 실패:`, error);
            return null;
        }
    }

    // 만남 확정 (날짜 + 장소 모두 수락됨)
    async confirmMeeting(
        matchId: string,
        date: string,
        place: string
    ): Promise<{ success: boolean }> {
        try {
            const meetingRef = doc(db, 'confirmedMeetings', matchId);
            await setDoc(meetingRef, {
                matchId,
                date,
                place,
                status: 'confirmed',
                confirmedAt: Timestamp.now()
            });
            console.log('[MatchingService] 만남 확정!', { date, place });
            return { success: true };
        } catch (error) {
            console.error('[MatchingService] 만남 확정 실패:', error);
            return { success: false };
        }
    }

    // 시뮬레이션: 상대방 응답 생성 (80% 수락, 20% 역제안)
    simulatePartnerResponse(type: 'date' | 'place'): { accepted: boolean; counterOffer?: string } {
        const acceptRate = 0.8;
        const accepted = Math.random() < acceptRate;

        if (accepted) {
            return { accepted: true };
        }

        // 역제안 생성
        const dateCounters = ['다음 주 토요일은 어떨까요?', '일요일 오후는요?', '평일 저녁도 괜찮아요'];
        const placeCounters = ['홍대 카페는 어떨까요?', '강남 쪽은요?', '신촌쪽이 더 편해요'];

        const counters = type === 'date' ? dateCounters : placeCounters;
        const counterOffer = counters[Math.floor(Math.random() * counters.length)];

        return { accepted: false, counterOffer };
    }
}

export default MatchingService.getInstance();

