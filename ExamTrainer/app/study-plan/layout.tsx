import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Specialist 10일 커리큘럼',
  description: '프로젝트 강의 코드와 출제포인트를 연결한 하루 3시간, 10일 학습 스케줄. 과목별 강의 파일, 실습, 완료 체크와 모의고사를 제공합니다.',
};

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
