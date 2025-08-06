import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audio Analysis Tools - BreathQuest',
  description: 'Scientific exploration of Web Audio API capabilities for understanding microphone input, frequency analysis, and real-time audio processing.',
};

export default function AudioToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}