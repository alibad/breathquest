import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hypothesis #1: Microphone Breath Detection | BreathQuest',
  description: 'Test whether consumer microphones can reliably detect breathing patterns for real-time gaming. Interactive demo with breath calibration and gaming modes.',
};

export default function Hypothesis1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}