import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Coding Recall',
  description: 'AI 인증시험 강의자료 기반 코드 빈칸 암기 학습 도구',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
