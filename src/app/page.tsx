import { HqHero, HqScreen, HqStones, HqSunset } from '@/components/hq-path/hq-path';

const GITHUB = 'https://github.com/alibad/breathquest';

// The three labs, in the order they were built. Screens are real captures of each page.
const LABS = [
  {
    tag: 'Lab 1 · Breath',
    title: 'Breath detection',
    text: 'Calibrate with box breathing, then play by breathing. It works in a quiet room; noise breaks it.',
    shot: '/shots/lab-breath.jpg',
    alt: 'The breath lab: a glowing box guides 4-4-4-4 box breathing for calibration',
    href: '/hypothesis-1',
  },
  {
    tag: 'Lab 2 · Claps',
    title: 'Clap patterns',
    text: 'Every clap on a live timeline, matched as a single, double or triple pattern.',
    shot: '/shots/lab-claps.jpg',
    alt: 'The clap lab: claps on a live timeline and a history of single, double and triple patterns',
    href: '/hypothesis-2',
  },
  {
    tag: 'Lab 3 · Game',
    title: 'Clap Quest',
    text: 'The runner game, with a short tutorial, a score, three lives and ten levels.',
    shot: '/shots/clap-quest-tutorial.jpg',
    alt: 'Clap Quest tutorial: clap once to jump',
    href: '/hypothesis-3',
  },
];

// The audio tools page, one card per live view. Screens are real captures with a microphone on.
const TOOLS = [
  {
    title: 'Frequency spectrum',
    text: 'FFT bars with spectral centroid, rolloff, flux, spread and skewness.',
    shot: '/shots/tool-spectrum.jpg',
    alt: 'Frequency domain analysis: a live spectrum with the spectral centroid marked',
  },
  {
    title: 'Waveform',
    text: 'The raw signal over time, with its loudness (RMS) and zero crossings.',
    shot: '/shots/tool-waveform.jpg',
    alt: 'Time domain analysis: a live waveform of the microphone',
  },
  {
    title: 'Amplitude envelope',
    text: 'The outline of loudness: moving average, peak follower or Hilbert transform.',
    shot: '/shots/tool-envelope.jpg',
    alt: 'Amplitude envelope analysis traced over the raw waveform',
  },
  {
    title: 'Frequency bands',
    text: 'Energy per frequency band, with band sets for breath, music and voice.',
    shot: '/shots/tool-bands.jpg',
    alt: 'Multi-band frequency analysis: energy bars for eight bands',
  },
];

export default function Home() {
  return (
    <main className="hqp-page bq-home">
      <HqHero
        territory="practice"
        eyebrow="Breath Quest · A side trail"
        title={<>Play with your <em>body.</em></>}
        lede="A game in your browser that listens: your claps are the controller. It began with breath, and found claps faster and more fun."
        actions={
          <>
            <a className="hqp-btn hqp-btn-solid" href="/hypothesis-3">Play Clap Quest</a>
            <a className="hqp-btn hqp-btn-ghost" href="#how">How it works</a>
          </>
        }
        art={
          <div className="bq-stage">
            <HqScreen src="/shots/clap-quest-run.png" alt="Clap Quest running in the browser: the player in mid-jump, a red barrier, a blue target and the score" />
            <div className="bq-beat" aria-hidden="true">
              <p className="hqp-eyebrow">The controller</p>
              <div style={{ ['--row' as string]: 0 }}><span className="bq-claps"><i /></span>Jump</div>
              <div style={{ ['--row' as string]: 1 }}><span className="bq-claps"><i /><i /></span>Shoot</div>
              <div style={{ ['--row' as string]: 2 }}><span className="bq-claps"><i /><i /><i /></span>Special</div>
            </div>
          </div>
        }
      >
        <p className="bq-meta">Runs in the browser · Needs a microphone · Open source</p>
      </HqHero>

      <section id="how" className="hqp-section">
        <div className="hqp-inner">
          <div className="hqp-head">
            <div>
              <p className="hqp-eyebrow">How it works</p>
              <h2 className="hqp-display">One clap, two, <em>three.</em></h2>
            </div>
            <p className="hqp-lede">The microphone listens for the rhythm of your claps. That is the whole controller.</p>
          </div>
          <HqStones
            steps={[
              { title: 'Clap once to jump', text: 'Hop over the orange spikes. The space bar jumps too.' },
              { title: 'Clap twice to shoot', text: 'Hit the red barriers and the blue targets.' },
              { title: 'Clap three times', text: 'A special move clears the whole road at once, then needs a moment to recharge.' },
            ]}
          />
        </div>
      </section>

      <section id="labs" className="hqp-section hqp-tint">
        <div className="hqp-inner">
          <div className="hqp-head">
            <div>
              <p className="hqp-eyebrow">The trail so far</p>
              <h2 className="hqp-display">It began with <em>breath.</em></h2>
            </div>
            <p className="hqp-lede">Three labs, all open to try. Breath worked after calibration, but noise got in the way. Claps were faster and more fun.</p>
          </div>
          <div className="bq-grid bq-grid-3">
            {LABS.map((lab) => (
              <a key={lab.href} className="hqp-card" href={lab.href}>
                <div className="hqp-shot"><img src={lab.shot} alt={lab.alt} loading="lazy" /></div>
                <div className="hqp-body">
                  <p className="bq-tag">{lab.tag}</p>
                  <h3>{lab.title}</h3>
                  <p>{lab.text}</p>
                  <span className="bq-go">Open the lab <span aria-hidden="true">→</span></span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="tools" className="hqp-section hqp-nightband bq-tools">
        <div className="hqp-inner">
          <div className="hqp-head">
            <div>
              <p className="hqp-eyebrow">Audio tools</p>
              <h2 className="hqp-display">See what the <em>microphone</em> hears.</h2>
            </div>
            <p className="hqp-lede">The live views used to find which sounds a game can trust. Open them, make a noise, watch it move.</p>
          </div>
          <div className="bq-grid bq-grid-2">
            {TOOLS.map((tool) => (
              <a key={tool.title} className="hqp-card" href="/audio-tools">
                <div className="hqp-shot"><img src={tool.shot} alt={tool.alt} loading="lazy" /></div>
                <div className="hqp-body">
                  <h3>{tool.title}</h3>
                  <p>{tool.text}</p>
                </div>
              </a>
            ))}
          </div>
          <div className="bq-more">
            <p>Also inside: linear predictive coding (LPC), and a recorder that saves the views you pick as a video with sound.</p>
            <a className="hqp-btn hqp-btn-light" href="/audio-tools">Open the audio tools</a>
          </div>
        </div>
      </section>

      <section className="hqp-section bq-end">
        <div className="hqp-inner">
          <p className="hqp-eyebrow">Open source · MIT</p>
          <h2 className="hqp-display">Clap along, or <em>build on it.</em></h2>
          <p className="hqp-lede">All of Breath Quest is on GitHub to read and fork: Next.js, TypeScript and the Web Audio API.</p>
          <div className="hqp-ctas">
            <a className="hqp-btn hqp-btn-ember" href="/hypothesis-3">Play Clap Quest</a>
            <a className="hqp-btn hqp-btn-ghost" href={GITHUB} target="_blank" rel="noopener noreferrer">View on GitHub</a>
          </div>
        </div>
      </section>

      <HqSunset sunX={1080} />
    </main>
  );
}
