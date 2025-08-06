export const whyCards = [
  {
    emoji: '🎮',
    title: 'Rich Control Vocabulary',
    description: 'What if different breathing techniques could become unique game abilities? Imagine deep inhales charging attacks, breath holds activating shields, or traditional breathing patterns unlocking special moves. The depth of human breathing could create surprisingly rich gameplay.'
  },
  {
    emoji: '🧘',
    title: 'Learning Through Play',
    description: 'Could games naturally teach breathing techniques that actually improve wellness? Instead of forcing meditation practice, players might discover pranayama, martial arts breathing, and stress-relief techniques through engaging gameplay.'
  },
  {
    emoji: '🚀',
    title: 'Natural Interface Design',
    description: 'What if we could solve the "neutral state" problem in breath interfaces by using normal breathing as the baseline? Different breathing intensities and techniques might create a surprisingly intuitive control system.'
  }
];

export const timelineItems = [
  {
    title: 'Game Concept',
    description: 'Breath-controlled gaming idea sparked by geometry dash mechanics.',
    status: 'done' as const,
    date: 'Aug 3, 2025'
  },
  {
    title: 'Landing Experience',
    description: 'Interactive demo page with breathing animations and game preview.',
    status: 'in-progress' as const,
    date: 'Aug 3, 2025'
  },
  {
    title: 'Playable Prototype',
    description: 'First level: jump and duck obstacles using breath detection.',
    status: 'planned' as const,
    date: 'Aug 4-5, 2025'
  },
  {
    title: 'User Testing Round 1',
    description: 'Test core breath detection accuracy and basic gameplay with early users.',
    status: 'planned' as const,
    date: 'Aug 6, 2025'
  },
  {
    title: 'Core Mechanics Refinement',
    description: 'Improve breath sensitivity, add power-ups and shields based on feedback.',
    status: 'planned' as const,
    date: 'Aug 7-8, 2025'
  },
  {
    title: 'Multiple Levels',
    description: 'Create 5-10 levels with increasing difficulty and new breathing challenges. Can launch with 3+ levels if needed.',
    status: 'planned' as const,
    date: 'Aug 9-11, 2025'
  },
  {
    title: 'Sensor Integration (Optional)',
    description: 'Add heart rate monitor support for adaptive difficulty and stress detection. Depends on core gameplay validation.',
    status: 'planned' as const,
    date: 'Aug 12-13, 2025'
  },
  {
    title: 'Beta Testing',
    description: 'Closed beta with 50-100 users to validate gameplay and health benefits.',
    status: 'planned' as const,
    date: 'Aug 14-16, 2025'
  },
  {
    title: 'Multiplayer MVP (Optional)',
    description: 'Basic synchronized breathing challenges for 2-4 players. Priority depends on single-player engagement metrics.',
    status: 'planned' as const,
    date: 'Aug 17-19, 2025'
  },
  {
    title: 'Public Launch',
    description: 'Release web version with leaderboards and social sharing features.',
    status: 'planned' as const,
    date: 'Aug 20-25, 2025'
  }
];

export const techCards = [
  {
    emoji: '🎤',
    title: 'Audio Detection',
    description: 'Web Audio API analyzes microphone input to detect breathing patterns in real-time. FFT analysis distinguishes inhale, exhale, holds, and breathing intensity without additional hardware.'
  },
  {
    emoji: '🎮',
    title: 'Game Engine Integration',
    description: 'Breath data controls game mechanics through smooth input mapping. Breathing becomes a natural game controller with customizable sensitivity and response curves.'
  },
  {
    emoji: '🎯',
    title: 'Advanced Audio Processing',
    description: 'Sophisticated breath pattern recognition using multi-feature fusion, personal calibration, and adaptive algorithms for precise gaming control without additional hardware.'
  },
  {
    emoji: '🌐',
    title: 'Multiplayer Architecture',
    description: 'Real-time breath synchronization between players using WebRTC. Enables cooperative breathing challenges and competitive breath-based gameplay.'
  }
];

export const hypotheses = [
  'Consumer microphones can reliably detect breathing patterns with sufficient accuracy for real-time gaming',
  'Breath-controlled gameplay is genuinely fun and engaging, not just a wellness novelty',
  'Heart rate and respiratory sensors provide complementary data that enables adaptive gameplay mechanics beyond microphone detection',
  'Breath games create measurable health improvements that persist beyond gaming sessions',
  'Players learn complex breathing techniques faster through progressive game mechanics than traditional instruction',
  'Multiplayer breath gaming creates stronger social bonding than traditional multiplayer mechanics',
  'Breath games provide accessible gaming experiences for players with mobility or motor control challenges',
  'Integration of breath mechanics enhances rather than disrupts existing popular game genres'
];

export const nextStepsCards = [
  {
    emoji: '🔮',
    title: 'Vision',
    description: 'Breath Quest is just the beginning. Imagine AI assistants that know when you\'re stressed. VR experiences controlled by heartbeat. AR glasses that respond to eye moisture. The future of interfaces is biological.'
  },
  {
    emoji: '🚀',
    title: 'Scaling',
    description: 'Current tech: Browser-based, no install required. Next: Native apps with Apple HealthKit / Google Fit. Future: Custom hardware for sub-millisecond response.'
  },
  {
    emoji: '🤝',
    title: 'Collaboration',
    description: 'Open to partnerships with wellness companies, game studios, and research labs. This isn\'t meant to be built alone—it\'s meant to inspire a movement toward more human-centric AI interfaces.'
  }
];