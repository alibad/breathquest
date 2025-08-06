'use client';

import { useState, useRef, useCallback } from 'react';

interface AudioVideoRecorderProps {
  isListening: boolean;
  canvasRefs: any[];
  audioStream?: MediaStream;
}

export function AudioVideoRecorder({ isListening, canvasRefs, audioStream }: AudioVideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedStreamRef = useRef<MediaStream | null>(null);
  const renderingRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    if (!isListening || !audioStream) {
      alert('Please start audio capture first!');
      return;
    }

    try {
      // Create a canvas to composite all visualizations
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = 1200;
      compositeCanvas.height = 1100; // Increased height for 3 panels
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

        // Render each canvas
        canvasRefs.forEach((canvasRef, index) => {
          const canvas = canvasRef.current;
          if (canvas) {
            const yOffset = 100 + (index * 320); // Increased spacing for 3 panels
            
            // Add section label with proper colors and names
            let label = '';
            let color = '';
            
            switch (index) {
              case 0:
                label = 'Time Domain Analysis';
                color = '#00ff88';
                break;
              case 1:
                label = 'Amplitude Envelope Analysis';
                color = '#ff8844';
                break;
              case 2:
                label = 'Frequency Domain Analysis';
                color = '#4488ff';
                break;
              default:
                label = `Analysis ${index + 1}`;
                color = '#ffffff';
            }
            
            ctx.fillStyle = color;
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(label, 50, yOffset - 10);
            
            // Draw the canvas with appropriate sizing
            const canvasHeight = Math.min(260, canvas.height); // Limit height
            ctx.drawImage(canvas, 50, yOffset, compositeCanvas.width - 100, canvasHeight);
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
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      marginBottom: '2rem',
      padding: '1rem',
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <button
        onClick={startRecording}
        disabled={!isListening || isRecording}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          border: '2px solid #ff4444',
          background: isRecording ? 'rgba(255, 68, 68, 0.3)' : 'rgba(255, 68, 68, 0.1)',
          color: isRecording ? '#ff4444' : (!isListening ? '#666666' : '#ff4444'),
          cursor: (!isListening || isRecording) ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          fontWeight: 'bold',
          opacity: (!isListening || isRecording) ? 0.5 : 1
        }}
      >
        {isRecording ? '🔴 Recording...' : '🎥 Start Recording'}
      </button>

      <button
        onClick={stopRecording}
        disabled={!isRecording}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          border: '2px solid #666666',
          background: 'rgba(102, 102, 102, 0.1)',
          color: isRecording ? '#ffffff' : '#666666',
          cursor: isRecording ? 'pointer' : 'not-allowed',
          fontSize: '1rem',
          fontWeight: 'bold',
          opacity: isRecording ? 1 : 0.5
        }}
      >
        ⏹️ Stop Recording
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
  );
}