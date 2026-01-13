# ADR 001: Anti-Gravity Architecture Refactoring

**날짜**: 2026-01-13  
**상태**: 적용됨  
**결정자**: ORBIT 개발팀

---

## 컨텍스트

ORBIT 앱의 코드베이스가 성장하면서 다음과 같은 문제가 발생했습니다:
- 컴포넌트 간 의존성이 복잡하게 얽혀 있음
- 외부 라이브러리가 비즈니스 로직에 직접 침투
- 한 기능의 버그가 다른 기능으로 전파
- 유지보수 및 테스트가 어려움

## 결정

**"Anti-Gravity Architecture"** 패턴을 적용하여 코드베이스를 재구조화합니다.

### 핵심 원칙

1. **Core Protection**: 비즈니스 로직은 외부 라이브러리/UI에 직접 의존하지 않음 (Wrapper 패턴)
2. **Feature Isolation**: 기능별 폴더 격리로 오류 전파 방지
3. **Traceability**: ADR(Architecture Decision Record)로 변경 이력 문서화

## 변경된 구조

### Before
```
src/
├── components/    (12 files - 혼재)
├── screens/       (8 files - 평면적)
├── services/      (17 files - 혼재)
├── navigation/
├── theme/
└── types/
```

### After
```
src/
├── app/                    # 앱 구동 필수
│   ├── navigation/
│   ├── providers/
│   └── config.ts
│
├── features/               # 기능별 격리
│   ├── auth/
│   ├── home/
│   ├── couple/
│   ├── journal/
│   ├── settings/
│   └── matching/
│
├── shared/                 # 공유 모듈
│   ├── ui/                 # 순수 UI
│   ├── lib/                # 외부 라이브러리 Wrapper
│   │   ├── api/
│   │   ├── storage/
│   │   ├── notifications/
│   │   ├── analytics/
│   │   └── sound/
│   ├── hooks/
│   └── utils/
│
├── theme/
└── types/
```

## 결과

### 장점
- **유지보수성**: 기능별로 격리되어 수정 범위가 명확
- **테스트 용이성**: 각 모듈을 독립적으로 테스트 가능
- **의존성 관리**: Wrapper를 통해 외부 라이브러리 교체 용이
- **온보딩**: 새 개발자가 구조를 쉽게 파악

### 단점
- **초기 작업량**: 파일 이동 및 import 경로 수정 필요
- **폴더 깊이**: 일부 경로가 길어짐 (Path Alias로 완화)

## 마이그레이션 전략

1. 새 폴더 구조에 파일 복사 (기존 파일 유지)
2. 새 구조에서 import 경로 수정
3. 앱 정상 동작 확인
4. 기존 파일 정리 (점진적)

## 참고

- 기존 `src/components/`와 `src/screens/`는 호환성을 위해 유지
- 새 코드는 `features/`와 `shared/` 구조를 따름
- 점진적 마이그레이션 권장
