'use client';

interface AudioConfigurationPanelProps {
  audioData: {
    timeDomain: Uint8Array;
    frequencyDomain: Uint8Array;
    sampleRate: number;
    bufferSize: number;
  };
}

export function AudioConfigurationPanel({ audioData }: AudioConfigurationPanelProps) {
  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto 3rem auto',
      background: 'rgba(0, 0, 0, 0.2)',
      padding: '2rem',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <h3 style={{
        color: '#ffffff',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        📊 Audio System Configuration
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          background: 'rgba(0, 255, 136, 0.05)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '2px solid rgba(0, 255, 136, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ color: '#00ff88', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Sample Rate
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {audioData.sampleRate.toLocaleString()} Hz
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cccccc', lineHeight: '1.3' }}>
            How many times per second we capture audio data. Higher = better quality.
          </div>
        </div>

        <div style={{
          background: 'rgba(68, 136, 255, 0.05)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '2px solid rgba(68, 136, 255, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ color: '#4488ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Buffer Size
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {audioData.bufferSize} samples
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cccccc', lineHeight: '1.3' }}>
            How many audio samples we analyze at once. Bigger = more detail, slower updates.
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 136, 68, 0.05)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '2px solid rgba(255, 136, 68, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ color: '#ff8844', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Frequency Bins
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {audioData.frequencyDomain.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cccccc', lineHeight: '1.3' }}>
            Number of frequency "buckets" we can detect. More bins = finer frequency detail.
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 68, 136, 0.05)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '2px solid rgba(255, 68, 136, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ color: '#ff4488', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Resolution
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {audioData.sampleRate && audioData.bufferSize 
              ? (audioData.sampleRate / audioData.bufferSize).toFixed(1)
              : '0'} Hz/bin
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cccccc', lineHeight: '1.3' }}>
            How precise each frequency bin is. Lower = we can distinguish closer frequencies.
          </div>
        </div>
      </div>
      
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#cccccc',
        textAlign: 'center'
      }}>
        💡 <strong>Why This Matters:</strong> These settings determine the quality and speed of our audio analysis. 
        Think of it like a microscope - higher resolution lets us see finer details, but takes more processing power.
      </div>
    </div>
  );
}