'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioVideoRecorderProps {
  isListening: boolean;
  canvasRefs: any[];
  audioStream?: MediaStream;
  expansionStates?: { frequencyBand: boolean; lpcAnalysis: boolean }; // Track expansion states
}

interface CanvasSelection {
  index: number;
  label: string;
  color: string;
  selected: boolean;
}

export function AudioVideoRecorder({ isListening, canvasRefs, audioStream, expansionStates }: AudioVideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  // Initialize selection based on expansion states
  const getInitialSelection = () => {
    return [
      { index: 0, label: 'Time Domain Analysis', color: '#00ff88', selected: true },
      { index: 1, label: 'Amplitude Envelope Analysis', color: '#ff8844', selected: true },
      { index: 2, label: 'Frequency Domain Analysis', color: '#4488ff', selected: true },
      { index: 3, label: 'Multi-Band Frequency Analysis', color: '#8b5cf6', selected: expansionStates?.frequencyBand ?? false },
      { index: 4, label: 'LPC Analysis', color: '#ffa500', selected: expansionStates?.lpcAnalysis ?? false }
    ];
  };

  const [selectedCanvases, setSelectedCanvases] = useState<CanvasSelection[]>(getInitialSelection());
  const [showConfig, setShowConfig] = useState(false);

  // Update selection when expansion states change (only on mount or major changes)
  useEffect(() => {
    // Only update if this is the initial load - don't override user selections
    setSelectedCanvases(prev => {
      // Update only the collapsed tools to match expansion state, but preserve user overrides
      return prev.map(item => {
        if (item.label === 'Multi-Band Frequency Analysis') {
          return { ...item, selected: expansionStates?.frequencyBand ?? item.selected };
        }
        if (item.label === 'LPC Analysis') {
          return { ...item, selected: expansionStates?.lpcAnalysis ?? item.selected };
        }
        return item;
      });
    });
  }, []); // Only run on mount, don't react to expansionStates changes
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedStreamRef = useRef<MediaStream | null>(null);
  const renderingRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);

  // Smart layout calculation
  const calculateLayout = (selectedCount: number) => {
    if (selectedCount <= 3) {
      return { rows: selectedCount, cols: 1 }; // Single column
    } else if (selectedCount <= 4) {
      return { rows: 2, cols: 2 }; // 2x2 grid
    } else if (selectedCount <= 6) {
      return { rows: 2, cols: 3 }; // 2x3 grid
    } else if (selectedCount <= 9) {
      return { rows: 3, cols: 3 }; // 3x3 grid
    } else {
      return { rows: Math.ceil(selectedCount / 3), cols: 3 }; // 3 columns, dynamic rows
    }
  };

  const startRecording = useCallback(async () => {
    if (!isListening || !audioStream) {
      alert('Please start audio capture first!');
      return;
    }

    try {
      // Create a canvas to composite all visualizations
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = 1920; // Even wider for better spacing
      compositeCanvas.height = 1080; // Standard 1080p for better quality
      const ctx = compositeCanvas.getContext('2d');
      
      if (!ctx) return;

      // Get canvas stream for video recording
      const canvasStream = compositeCanvas.captureStream(30); // 30 FPS
      
      // Create a separate stream for recording (doesn't affect original visualizations)
      const recordingStream = new MediaStream([
        ...audioStream.getAudioTracks(),
        ...canvasStream.getVideoTracks()
      ]);

      recordedStreamRef.current = recordingStream;

      // Setup MediaRecorder with fallback formats
      let mediaRecorder;
      try {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
          mediaRecorder = new MediaRecorder(recordingStream, {
            mimeType: 'video/webm;codecs=vp9,opus'
          });
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mediaRecorder = new MediaRecorder(recordingStream, {
            mimeType: 'video/webm'
          });
        } else {
          mediaRecorder = new MediaRecorder(recordingStream);
        }
      } catch (err) {
        console.error('MediaRecorder creation failed:', err);
        alert('Recording not supported in this browser');
        return;
      }
      
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available, size:', event.data.size);
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, chunks:', chunks.length);
        setRecordedChunks(chunks);
        setIsRecording(false);
        renderingRef.current = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Request data every second
      setIsRecording(true);
      renderingRef.current = true;

      // Composite rendering loop
      const renderComposite = () => {
        if (!renderingRef.current) return;

        // Clear canvas
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);

        // Add title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BreathQuest Audio Analysis Recording', compositeCanvas.width / 2, 40);

        // Add timestamp
        ctx.font = '16px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.fillText(new Date().toLocaleTimeString(), compositeCanvas.width / 2, 70);

        // Get selected canvases and calculate layout
        const selectedItems = selectedCanvases.filter(item => item.selected);
        const { rows, cols } = calculateLayout(selectedItems.length);
        
        // Calculate panel dimensions based on layout
        const panelWidth = (compositeCanvas.width - 160) / cols;
        const panelHeight = (compositeCanvas.height - 200) / rows;
        
        // Render each selected canvas
        selectedItems.forEach((item, itemIndex) => {
          const canvasRef = canvasRefs[item.index];
          const canvas = canvasRef?.current;
          if (canvas) {
            // Calculate position based on smart layout
            const row = Math.floor(itemIndex / cols);
            const col = itemIndex % cols;
            
            const xOffset = 80 + col * (panelWidth + 40); // 40px gap between columns
            const yOffset = 100 + row * (panelHeight + 40); // 40px gap between rows
            
            // Use the item's label and color
            const label = item.label;
            const color = item.color;
            
            ctx.fillStyle = color;
            ctx.font = 'bold 18px Arial'; // Larger font for better readability
            ctx.textAlign = 'left';
            ctx.fillText(label, xOffset, yOffset - 15);
            
            // Draw the canvas with grid sizing - more space for content
            const canvasHeight = Math.min(panelHeight - 40, canvas.height); // More space for label
            ctx.drawImage(canvas, xOffset, yOffset, panelWidth, canvasHeight);
          }
        });

        animationFrameRef.current = requestAnimationFrame(renderComposite);
      };

      renderComposite();

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error starting recording: ' + (error as Error).message);
    }
  }, [isListening, audioStream, canvasRefs, isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop the canvas stream for recording, but keep visualizations running
      if (recordedStreamRef.current) {
        // Only stop the video tracks (canvas capture), keep audio flowing for visualizations
        recordedStreamRef.current.getVideoTracks().forEach(track => track.stop());
        recordedStreamRef.current = null;
      }
    }
  }, [isRecording]);

  const downloadRecording = useCallback(() => {
    console.log('Download requested, chunks:', recordedChunks.length);
    if (recordedChunks.length === 0) {
      alert('No recording data available. Please try recording again.');
      return;
    }

    try {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      console.log('Blob created, size:', blob.size);
      
      if (blob.size === 0) {
        alert('Recording file is empty. Please try recording again.');
        return;
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      a.href = url;
      a.download = `breathquest-analysis-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      setRecordedChunks([]); // Clear chunks after download
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download recording: ' + (error as Error).message);
    }
  }, [recordedChunks]);



    return (
    <div style={{
      marginBottom: '2rem',
      padding: '1.5rem',
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'relative'
    }}>
      


      {/* Expandable Config */}
      {showConfig && !isRecording && recordedChunks.length === 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.5rem',
          marginBottom: '1rem',
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {selectedCanvases.map((item, index) => (
            <label
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                border: `1px solid ${item.selected ? item.color : 'rgba(255, 255, 255, 0.2)'}`
              }}
            >
              <input
                type="checkbox"
                checked={item.selected}
                onChange={(e) => {
                  const newSelected = [...selectedCanvases];
                  newSelected[index].selected = e.target.checked;
                  setSelectedCanvases(newSelected);
                }}
                style={{ accentColor: item.color }}
              />
              <span style={{ 
                color: item.selected ? item.color : '#888888',
                fontSize: '0.85rem'
              }}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Recording Controls */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!isListening}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: `2px solid ${isRecording ? '#ff4444' : '#ff4444'}`,
            background: isRecording ? 'rgba(255, 68, 68, 0.2)' : 'rgba(255, 68, 68, 0.1)',
            color: !isListening ? '#666666' : '#ff4444',
            cursor: !isListening ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            opacity: !isListening ? 0.5 : 1
          }}
        >
          {isRecording ? '⏹️ Stop Recording' : '🎥 Start Recording'}
        </button>

                      {recordedChunks.length > 0 && (
          <button
            onClick={downloadRecording}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '2px solid #00ff88',
              background: 'rgba(0, 255, 136, 0.1)',
              color: '#00ff88',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            💾 Download Video
          </button>
        )}

      {/* Configure Button - Inline with controls */}
      {!isRecording && recordedChunks.length === 0 && (
        <button
          onClick={() => setShowConfig(!showConfig)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#cccccc',
            cursor: 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
                          ⚙️ Configure ({selectedCanvases.filter(item => item.selected).length}/{selectedCanvases.length})
        </button>
      )}

      {!isListening && (
        <div style={{
          padding: '0.75rem',
          color: '#cccccc',
          fontSize: '0.9rem',
          fontStyle: 'italic'
        }}>
          Start audio capture to enable recording
        </div>
        )}

        {/* Debug info */}
      <div style={{
        padding: '0.5rem',
        fontSize: '0.8rem',
        color: '#888',
        textAlign: 'center'
      }}>
          Status: {isRecording ? 'Recording...' : isListening ? 'Ready' : 'Waiting for audio'} | 
          Chunks: {recordedChunks.length}
        </div>


      </div>
    </div>
  );
}