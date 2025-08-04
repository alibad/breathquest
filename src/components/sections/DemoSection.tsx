const DemoSection = () => {
  return (
    <section id="demo" className="demo-section">
      <h2>Live Demo</h2>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
        Experience breath-controlled gaming. Allow microphone access and breathe naturally.
      </p>
      
      <div className="demo-preview">
        <div className="demo-placeholder">
          <p>🎮 Demo loads here - or open in full screen</p>
        </div>
      </div>
      
      <a 
        href="/play" 
        className="btn pulse" 
        style={{ fontSize: '1.2rem', padding: '1.2rem 3rem' }}
      >
        Launch Full Experience
      </a>
    </section>
  );
};

export default DemoSection;