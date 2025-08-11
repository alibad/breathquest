# 🫁 Breath Quest

**Audio-controlled gaming experiment** | [**🎮 Live Demo**](https://www.breather.quest/) | [**🧪 Audio Tools**](https://www.breather.quest/audio-tools) | [**📦 GitHub**](https://github.com/alibad/breathquest)

> From breath detection to clap control - exploring the future of biological computing interfaces. Your microphone becomes the controller.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-Enabled-green)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ **What Is This?**

Breath Quest started as a breath-controlled gaming experiment and evolved into a comprehensive audio interface research platform. The project validates audio-controlled gaming interfaces through three working prototypes, from breath detection to clap-controlled gaming.

### 🎮 **Current Features**
- **👏 Clap-Controlled Gaming** - Single clap to jump, double clap to shoot, triple clap for special powers
- **🫁 Advanced Breath Detection** - Multi-feature fusion algorithms for precise breathing pattern recognition
- **📊 Real-time Audio Analysis** - 7+ visualization tools for understanding audio signatures
- **🎯 Personal Calibration** - Adaptive systems that learn your unique patterns
- **🎥 Research Tools** - Record and analyze sessions for interface validation
- **🌐 Browser-Based** - No installation required, works on any device with a microphone

### 🚀 **The Journey: From Breath to Claps**
**Original Hypothesis:** Breath-controlled gaming could create engaging, wellness-focused experiences.
**Discovery:** While breath detection was technically achievable, clap detection proved far more responsive and satisfying for gaming.
**Result:** A hybrid platform that demonstrates both approaches, with clap gaming as the primary experience.

---

## 🚀 **Quick Start**

### **Play the Game**
```bash
# Clone the repository
git clone https://github.com/alibad/breathquest.git
cd breathquest

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### **Try the Live Demo**
Visit [**breather.quest**](https://www.breather.quest/) to experience audio-controlled gaming instantly.

---

## 🔬 **Research & Validation**

This project validates **3 core hypotheses** about audio-controlled interfaces:

### ✅ **Hypothesis 1: Microphone Breath Detection** 
> *Consumer microphones can reliably detect breathing patterns with sufficient accuracy for real-time gaming*

**Status:** **🎯 VALIDATED** - All 3 phases complete:
- **Phase 1:** Basic RMS breath detection
- **Phase 2:** Research-enhanced algorithms (multi-feature fusion)  
- **Phase 3:** Personal calibration system with breathing profiles

[🧪 **Try Interactive Demo**](https://www.breather.quest/hypothesis-1)

### ✅ **Hypothesis 2: Clap Pattern Gaming**  
> *Audio-controlled gameplay (clap detection) is significantly more engaging than breath control for gaming*

**Status:** **🎯 VALIDATED** - Clap detection provides:
- Instant responsiveness (<16ms latency)
- Natural gaming gestures (clap patterns map to game actions)
- Zero calibration required
- Universal device compatibility

[🧪 **Try Interactive Demo**](https://www.breather.quest/hypothesis-2)

### ✅ **Hypothesis 3: Fun Sound Game**
> *A polished clap-controlled runner game with onboarding, scoring, lives, and game polish can be engaging*

**Status:** **🎯 VALIDATED** - ClapQuest features:
- Complete game loop with onboarding tutorial
- Scoring system with multipliers and high scores
- Lives system and game over mechanics  
- Visual polish with particles and animations

[🧪 **Try Interactive Demo**](https://www.breather.quest/hypothesis-3)

---

## 🛠️ **Technical Architecture**

### **🎤 Audio Processing Pipeline**
```
Microphone Input → Web Audio API → Feature Analysis → Pattern Recognition → Game Controls
                                      ↓                    ↓
                   Breath Features: RMS, Spectral        Clap Detection: Amplitude Spikes,
                   Centroid, Zero Crossing Rate,         Zero Crossings, Pattern Matching
                   Frequency Bands, Envelope, LPC
```

### **🧠 Dual Detection System**
**Breath Detection:**
- Multi-feature fusion combining 6+ audio characteristics
- Personal calibration for individual breathing patterns  
- Noise filtering and confidence scoring
- <100ms latency with high accuracy

**Clap Detection:**
- High-amplitude spike detection with zero-crossing analysis
- Pattern matching for single/double/triple clap sequences
- Refractory period to prevent false triggers
- <16ms latency with instant feedback

### **📊 Audio Analysis Tools**
- **⏱️ Time Domain Analysis** - Raw waveform visualization with zero crossing detection
- **🎵 Frequency Domain Analysis** - FFT with spectral centroid calculation
- **📈 Amplitude Envelope Analysis** - Hilbert transform and peak follower algorithms
- **📊 Multi-Band Frequency Analysis** - 8-band energy distribution monitoring
- **👏 Clap Detection Visualizer** - Real-time clap pattern recognition display
- **🫁 Breath Detection Meter** - Multi-feature breath analysis with confidence scoring
- **🎥 Video Recording** - Capture analysis sessions for research and validation

---

## 🎯 **Key Technologies**

| Technology | Purpose | Implementation |
|------------|---------|----------------|
| **Next.js 15** | Framework | App Router, Server Components |
| **Web Audio API** | Audio Processing | Real-time microphone analysis |
| **TypeScript** | Type Safety | Full type coverage |
| **Canvas API** | Visualizations | Real-time audio waveforms |
| **Local Storage** | Calibration Data | Personal breathing profiles |

---

## 🧪 **Research Applications**

### **Academic Use Cases**
- **HCI Research:** Novel interface design patterns
- **Audio Processing:** Breath detection algorithm validation  
- **Health Tech:** Non-invasive breathing monitoring
- **Game Design:** Biometric input methods

### **Industry Applications**
- **Wellness Apps:** Breathing exercise gamification
- **Accessibility:** Voice-free computer control
- **VR/AR:** Natural breathing as input modality
- **IoT Health:** Ambient breathing monitoring

---

## 🤝 **Contributing**

We welcome contributions!

```bash
# Development workflow
1. Fork the repository
2. Create feature branch: git checkout -b feature/amazing-feature
3. Commit changes: git commit -m 'Add amazing feature'
4. Push to branch: git push origin feature/amazing-feature
5. Open a Pull Request
```

---

## 📚 **Documentation**

| Resource | Description | Link |
|----------|-------------|------|
| **Live Demo** | Interactive breath gaming | [breather.quest](https://www.breather.quest/) |
| **Audio Tools** | Real-time analysis suite | [breather.quest/audio-tools](https://www.breather.quest/audio-tools) |
| **Hypothesis 1** | Technical validation | [breather.quest/hypothesis-1](https://www.breather.quest/hypothesis-1) |
| **Research Docs** | Academic findings | [`docs/hypothesis/`](./docs/hypothesis/) |

---

## 🌟 **Why This Matters**

> *"If we're building AGI that understands humans deeply, shouldn't our interfaces reflect human biology? Breathing is universal, involuntary yet controllable, calming yet energizing. It's the perfect bridge between mind and machine."*

### **Vision: Biological Computing Interfaces**
- **Stress-aware AI** that adapts to your breathing
- **Health-improving interfaces** that make you calmer by using them
- **Natural control systems** based on involuntary biological signals
- **Embodied AI interaction** that feels human, not mechanical

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 **Connect**

**Built with passion for the future of human-AI interaction**

- **🌐 Website:** [breather.quest](https://www.breather.quest/)
- **💼 LinkedIn:** [Connect with the creator](https://www.linkedin.com/in/alibad/)
- **🐙 GitHub:** [@alibad](https://github.com/alibad)

---

⭐ **Star this repo** if you believe in biological computing interfaces!
