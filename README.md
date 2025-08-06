# 🫁 Breath Quest

**Play games with your breath** | [**🎮 Live Demo**](https://www.breather.quest/) | [**🧪 Audio Tools**](https://www.breather.quest/audio-tools)

> Master ancient breathing techniques to control your character. From breath of fire attacks to Om-powered ultimates - your lungs are the controller.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-Enabled-green)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ **What Is This?**

Breath Quest transforms your **microphone into a breath sensor** for gaming. No additional hardware needed - just your voice, your breath, and a browser.

### 🎮 **Core Features**
- **🫁 Real-time Breath Detection** - Inhale, exhale, and breath holds control game mechanics
- **📊 Advanced Audio Analysis** - 5+ analysis tools for understanding breath patterns
- **🎯 Personal Calibration** - Box breathing exercises to optimize detection for your unique breathing
- **🎥 Research Tools** - Record and analyze audio for breath detection research
- **🌐 No Installation** - Runs entirely in your browser

---

## 🚀 **Quick Start**

### **Play the Game**
```bash
# Clone the repository
git clone https://github.com/your-username/breathquest.git
cd breathquest

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### **Try the Live Demo**
Visit [**breather.quest**](https://www.breather.quest/) to experience breath-controlled gaming instantly.

---

## 🔬 **Research & Validation**

This project validates **6 core hypotheses** about breath-controlled interfaces:

### ✅ **Hypothesis 1: Microphone Breath Detection** 
> *Consumer microphones can reliably detect breathing patterns with sufficient accuracy for real-time gaming*

**Status:** **🎯 VALIDATED** - All 3 phases complete:
- **Phase 1:** Basic RMS breath detection
- **Phase 2:** Research-enhanced algorithms (multi-feature fusion)  
- **Phase 3:** Personal calibration system with breathing profiles

[🧪 **Try Interactive Demo**](https://www.breather.quest/hypothesis-1)

### ⏳ **Hypothesis 2:** Breath Gaming Fun Factor
> *Breath-controlled gameplay is genuinely fun and engaging, not just a wellness novelty*

### ❌ **Hypothesis 3:** Sensor Hardware (Cancelled)
> *Heart rate and respiratory sensors provide complementary data*

**Status:** **🚫 CANCELLED** - Cost/complexity too high vs. microphone-only approach

### ⏳ **Hypothesis 4-6:** Health, Learning, Social Benefits
> *Measuring health improvements, learning acceleration, and social bonding through breath gaming*

---

## 🛠️ **Technical Architecture**

### **🎤 Audio Processing Pipeline**
```
Microphone Input → Web Audio API → Multi-Feature Analysis → Game Controls
                                      ↓
                   Features: RMS, Spectral Centroid, Zero Crossing Rate, 
                           Frequency Bands, Amplitude Envelope, LPC
```

### **🧠 Breath Detection Algorithm**
- **Multi-Feature Fusion:** Combines 6+ audio features for robust detection
- **Personal Calibration:** Adapts to individual breathing patterns
- **Noise Filtering:** Distinguishes breath from environmental sounds
- **Real-time Processing:** <10ms latency for gaming responsiveness

### **📊 Audio Analysis Tools**
- **⏱️ Time Domain Analysis** (with Zero Crossing Rate mode)
- **🎵 Frequency Domain Analysis** (with Spectral Centroid)
- **📈 Amplitude Envelope Analysis** (Hilbert Transform, Peak Follower)
- **📊 Multi-Band Frequency Analysis** (8-band energy distribution)
- **🎥 Video Recording** (Capture analysis sessions for research)

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

## 📁 **Project Structure**

```
breathquest/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Landing page
│   │   ├── hypothesis-1/      # Breath detection demo
│   │   └── audio-tools/       # Analysis tools
│   ├── components/
│   │   ├── audio-tools/       # Audio analysis components
│   │   ├── hypothesis1/       # Game & calibration components
│   │   └── sections/          # Landing page sections
│   └── hooks/                 # Custom React hooks
├── docs/
│   ├── hypothesis/            # Research documentation
│   ├── research/              # Academic papers
│   └── data/                  # Breathing protocols (JSON)
└── public/                    # Static assets
```

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

We welcome contributions! Here's how to get involved:

### **🔬 Research Contributions**
- Test breath detection accuracy across different devices
- Validate gaming engagement hypotheses  
- Contribute breathing pattern datasets
- Improve audio processing algorithms

### **💻 Development Contributions**
- Add new audio analysis tools
- Improve UI/UX design
- Optimize performance
- Add accessibility features

### **📖 Documentation**
- Write tutorials for researchers
- Create developer guides
- Document breathing protocols
- Share use case studies

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

## 🔮 **What's Next?**

### **Immediate Roadmap**
- [ ] Complete Hypothesis 2 validation (gaming engagement)
- [ ] Add multiplayer breath synchronization
- [ ] Integrate with Apple HealthKit / Google Fit
- [ ] Mobile app development

### **Future Vision**
- [ ] VR breath-controlled experiences
- [ ] AI assistants that respond to stress levels
- [ ] Custom hardware for sub-millisecond response
- [ ] Research partnerships with wellness companies

---

## 📞 **Connect**

**Built with passion for the future of human-AI interaction**

- **🌐 Website:** [breather.quest](https://www.breather.quest/)
- **💼 LinkedIn:** [Connect with the creator](https://linkedin.com/in/your-profile)
- **🐙 GitHub:** [@your-username](https://github.com/your-username)
- **📧 Email:** your-email@domain.com

---

⭐ **Star this repo** if you believe in biological computing interfaces!

*Breath Quest - Where breathing becomes computing* 🫁✨