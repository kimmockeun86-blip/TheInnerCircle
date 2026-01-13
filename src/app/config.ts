/**
 * App Configuration
 * API 설정 및 환경 변수
 * 
 * 2026-01-13: Anti-Gravity Architecture
 * 
 * 기존 config.ts를 re-export
 */

export * from '../config';

// 기존 config 모듈 re-export
import { API_URL } from '../config';
export { API_URL };
