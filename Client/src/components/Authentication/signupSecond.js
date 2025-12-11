import React, { Component } from 'react';
import { connect } from 'react-redux';
import { MDBContainer, MDBRow, MDBCol, MDBBtn } from 'mdbreact';
import { Card, CardContent, LinearProgress, Chip, IconButton } from '@material-ui/core';
import MicIcon from '@material-ui/icons/Mic';
import StopIcon from '@material-ui/icons/Stop';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import speakerRecognitionApi from '../../apis/speakerRecognitionApi';
import '../../css/VoiceRecording.css';

let arrVoices = [];

class SignupSecond extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isRecording: false,
      blobURL: '',
      isBlocked: false,
      count: 0,
      isProcessing: false,
      recordingComplete: false,
      samples: [],
      currentSampleIndex: -1,
      recordingTimer: 0,
      timerInterval: null,
      enrollmentSuccess: false,
      audioLevel: 0,
      audioContext: null,
      analyser: null,
      mediaStream: null
    };
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  // Convert blob to base64
  blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Convert audio blob to WAV PCM and then to base64
  convertToWavBase64 = async (audioBlob) => {
    try {
      console.log('Converting audio blob to WAV base64...');
      console.log('Input blob type:', audioBlob.type, 'size:', audioBlob.size);
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      console.log('Decoding audio data...');
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log('Audio decoded successfully');
      console.log('Sample rate:', audioBuffer.sampleRate);
      console.log('Duration:', audioBuffer.duration, 'seconds');
      
      const channelData = audioBuffer.getChannelData(0);
      
      // Convert to 16-bit PCM
      const pcmData = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      console.log('Converted to PCM, size:', pcmData.length, 'samples');
      
      // Convert to base64 in chunks to avoid stack overflow
      const uint8Array = new Uint8Array(pcmData.buffer);
      let binaryString = '';
      const chunkSize = 8192; // Process 8KB at a time
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64String = btoa(binaryString);
      console.log('Conversion complete, base64 length:', base64String.length);
      
      return base64String;
    } catch (error) {
      console.error('Error converting audio:', error);
      throw error;
    }
  }

  startRecording = (sampleIndex) => {
    if (this.state.isBlocked) {
      alert('Microphone permission denied. Please allow microphone access.');
      return;
    }

    this.audioChunks = [];

    navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      } 
    })
      .then((stream) => {
        console.log('Microphone access granted, starting recording sample', sampleIndex + 1);
        
        // Setup audio level monitoring
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        
        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;
        
        microphone.connect(analyser);
        
        this.setState({ audioContext, analyser, mediaStream: stream });
        
        // Monitor audio levels
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkAudioLevel = () => {
          if (this.state.isRecording) {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            this.setState({ audioLevel: Math.min(100, average) });
            requestAnimationFrame(checkAudioLevel);
          }
        };
        checkAudioLevel();

        // Create MediaRecorder with best available format
        let options = { mimeType: 'audio/webm;codecs=opus' };
        
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'audio/ogg;codecs=opus' };
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'audio/mp4' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
              options = {};
            }
          }
        }
        
        console.log('Using mime type:', options.mimeType || 'default');
        
        this.mediaRecorder = new MediaRecorder(stream, options);
        
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };
        
        this.mediaRecorder.onstop = () => {
          console.log('MediaRecorder stopped, processing sample', sampleIndex + 1);
          this.processRecording();
        };
        
        this.mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event.error);
          alert('Recording error: ' + event.error);
        };
        
        this.mediaRecorder.start(100);
        
        this.setState({ 
          isRecording: true, 
          currentSampleIndex: sampleIndex,
          recordingTimer: 0
        });
        
        // Start timer
        const timerInterval = setInterval(() => {
          this.setState(prevState => {
            if (prevState.recordingTimer >= 5) {
              this.stopRecording();
              return prevState;
            }
            return { recordingTimer: prevState.recordingTimer + 1 };
          });
        }, 1000);
        
        this.setState({ timerInterval });
        
        // Auto-stop after 5 seconds
        setTimeout(() => {
          if (this.state.isRecording) {
            this.stopRecording();
          }
        }, 5000);
      })
      .catch((e) => {
        console.error('Recording error:', e);
        alert('Error starting recording: ' + e.message);
      });
  };

  stopRecording = () => {
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
    }
    
    this.setState({ 
      isRecording: false,
      recordingTimer: 0,
      timerInterval: null,
      audioLevel: 0
    });
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  };
  
  processRecording = () => {
    const sampleIndex = this.state.currentSampleIndex;
    console.log('Processing recording for sample', sampleIndex + 1, 'chunks:', this.audioChunks.length);
    
    if (this.audioChunks.length === 0) {
      alert('No audio data recorded. Please try again.');
      this.cleanupRecording();
      return;
    }
    
    // Create blob from chunks
    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
    const blob = new Blob(this.audioChunks, { type: mimeType });
    
    console.log('Sample', sampleIndex + 1, 'complete. Blob size:', blob.size, 'bytes');
    console.log('Blob type:', blob.type);
    
    if (blob.size === 0) {
      alert('Recording is empty. Please check your microphone and try again.');
      this.cleanupRecording();
      return;
    }
    
    const blobURL = URL.createObjectURL(blob);
    
    arrVoices.push(blob);
    
    // Update samples array
    const newSamples = [...this.state.samples];
    newSamples[sampleIndex] = {
      blob: blob,
      blobURL: blobURL,
      recorded: true
    };
    
    this.setState({ 
      blobURL, 
      samples: newSamples,
      count: this.state.count + 1
    });
    
    console.log(`Recorded ${arrVoices.length}/${this.props.RecNo} samples`);
    
    // Test audio playback
    const testAudio = new Audio(blobURL);
    testAudio.volume = 1.0;
    testAudio.play().then(() => {
      console.log('✓ Sample', sampleIndex + 1, 'playback test successful');
      setTimeout(() => {
        testAudio.pause();
        testAudio.currentTime = 0;
      }, 500);
    }).catch(err => {
      console.warn('✗ Sample', sampleIndex + 1, 'playback test failed:', err);
    });
    
    this.cleanupRecording();
    
    // Check if all samples are collected
    if (arrVoices.length === this.props.RecNo) {
      setTimeout(() => {
        this.enrollUser();
      }, 500);
    }
  };
  
  cleanupRecording = () => {
    if (this.state.mediaStream) {
      this.state.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.state.audioContext) {
      this.state.audioContext.close();
    }
    
    this.setState({
      mediaStream: null,
      audioContext: null,
      analyser: null
    });
  };

  enrollUser = async () => {
    this.setState({ isProcessing: true });
    
    try {
      console.log('Converting audio samples to base64...');
      
      const base64Samples = await Promise.all(
        arrVoices.map(blob => this.convertToWavBase64(blob))
      );
      
      console.log('Audio samples converted, sending to Flask API...');
      
      const studentData = this.props.studentData;
      const username = studentData.email ? 
        studentData.email.split('@')[0] : 
        `student_${Date.now()}`;
      
      const response = await speakerRecognitionApi.post('/enroll', {
        username: username,
        samples: base64Samples
      });
      
      console.log('Enrollment response:', response.data);
      
      if (response.data.success) {
        this.setState({ 
          isProcessing: false, 
          recordingComplete: true,
          enrollmentSuccess: true
        });
        
        // Complete enrollment and redirect to login (skip Node.js APIs)
        setTimeout(() => {
          alert(`Voice enrollment successful for ${username}! You can now login using your voice.`);
          window.location.replace('/login');
        }, 2000);
      } else {
        throw new Error('Enrollment failed');
      }
      
    } catch (error) {
      console.error('Enrollment error:', error);
      const errorMsg = error.response?.data?.error || error.message;
      alert('Error enrolling voice: ' + errorMsg + '\n\nPlease try again.');
      
      this.setState({ isProcessing: false });
      
      // Allow user to retry
      arrVoices = [];
      this.setState({ 
        count: 0, 
        samples: [],
        currentSampleIndex: -1 
      });
    }
  };

  playRecording = (blobURL) => {
    if (!blobURL) {
      alert('No recording available to play.');
      return;
    }
    
    const audio = new Audio(blobURL);
    audio.volume = 1.0; // Full volume
    
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      alert('Unable to play audio. Please check your browser settings or try re-recording.\n\nError: ' + error.message);
    });
    
    // Log playback for debugging
    audio.addEventListener('playing', () => {
      console.log('Audio is now playing');
    });
    
    audio.addEventListener('ended', () => {
      console.log('Audio playback finished');
    });
    
    audio.addEventListener('error', (e) => {
      console.error('Audio element error:', e);
      alert('Audio playback error. The recording may be corrupted.');
    });
  };

  componentDidMount() {
    arrVoices = [];
    
    // Initialize samples array
    const samples = Array(this.props.RecNo).fill(null).map(() => ({
      blob: null,
      blobURL: '',
      recorded: false
    }));
    
    this.setState({ samples });
    
    navigator.getUserMedia = (navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia);
    
    navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    })
      .then((stream) => {
        console.log('Microphone Permission Granted');
        console.log('Audio tracks:', stream.getAudioTracks());
        
        // Test if microphone is actually working
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          console.log('Microphone settings:', audioTrack.getSettings());
          console.log('Microphone enabled:', audioTrack.enabled);
        }
        
        this.setState({ isBlocked: false });
        
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
      })
      .catch((error) => {
        console.log('Microphone Permission Denied or Error:', error);
        this.setState({ isBlocked: true });
        alert('Microphone access is required for voice enrollment.\n\nError: ' + error.message + '\n\nPlease enable microphone access in your browser settings.');
      });
  }

  componentWillUnmount() {
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.state.mediaStream) {
      this.state.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.state.audioContext) {
      this.state.audioContext.close();
    }
    arrVoices = [];
  }

  render() {
    const { isRecording, isProcessing, count, recordingComplete, samples, currentSampleIndex, recordingTimer, enrollmentSuccess } = this.state;
    const progress = Math.round((count / this.props.RecNo) * 100);
    
    return (
      <MDBContainer>
        <MDBRow>
          <MDBCol md="2"></MDBCol>
          <MDBCol md="8">
            <Card className="mt-5 mb-5 border border-dark" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent style={{ padding: '40px' }}>
                
                {/* Header */}
                <div className="text-center mb-4">
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎤</div>
                  <h3 className="font-weight-bold" style={{ color: '#6D28D9' }}>
                    Voice Enrollment
                  </h3>
                  <p className="text-muted">
                    Record 5 voice samples for speaker recognition authentication
                  </p>
                </div>

                {/* Progress Bar */}
                {!enrollmentSuccess && (
                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="font-weight-bold">Progress</span>
                      <span className="font-weight-bold" style={{ color: '#6D28D9' }}>
                        {count}/{this.props.RecNo} samples
                      </span>
                    </div>
                    <LinearProgress 
                      variant="determinate" 
                      value={progress} 
                      style={{ height: '10px', borderRadius: '5px' }}
                    />
                  </div>
                )}

                {/* Instructions */}
                {!isProcessing && !enrollmentSuccess && (
                  <div className="alert alert-info mb-4" role="alert">
                    <strong>Instructions:</strong> Click on each sample button below to record. 
                    Speak clearly for 6 seconds. You can say anything - read a sentence, count numbers, or speak naturally.
                  </div>
                )}

                {/* Recording Timer */}
                {isRecording && (
                  <div className="text-center mb-4 p-3" style={{ 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '10px',
                    border: '2px solid #6D28D9'
                  }}>
                    <div style={{ fontSize: '48px', color: '#dc3545', marginBottom: '10px' }}>
                      <MicIcon style={{ fontSize: '48px' }} className="pulse-animation" />
                    </div>
                    <h4 className="font-weight-bold" style={{ color: '#6D28D9' }}>
                      Recording... {recordingTimer}s / 5s
                    </h4>
                    <p className="text-muted mb-0">Speak clearly into your microphone</p>
                  </div>
                )}

                {/* Sample Buttons */}
                {!isProcessing && !enrollmentSuccess && (
                  <div className="row mb-4">
                    {samples.map((sample, index) => (
                      <div key={index} className="col-md-4 col-sm-6 mb-3">
                        <Card 
                          className={`sample-card ${sample.recorded ? 'recorded' : ''} ${currentSampleIndex === index ? 'recording' : ''}`}
                          style={{ 
                            border: sample.recorded ? '2px solid #28a745' : '2px solid #e0e0e0',
                            backgroundColor: currentSampleIndex === index ? '#f0e6ff' : 'white',
                            cursor: sample.recorded ? 'default' : 'pointer'
                          }}
                          onClick={() => !sample.recorded && !isRecording && this.startRecording(index)}
                        >
                          <CardContent className="text-center p-3">
                            <div style={{ fontSize: '32px', marginBottom: '10px' }}>
                              {sample.recorded ? (
                                <CheckCircleIcon style={{ fontSize: '40px', color: '#28a745' }} />
                              ) : currentSampleIndex === index ? (
                                <StopIcon style={{ fontSize: '40px', color: '#dc3545' }} />
                              ) : (
                                <MicIcon style={{ fontSize: '40px', color: '#6D28D9' }} />
                              )}
                            </div>
                            <h6 className="font-weight-bold mb-2">
                              Sample {index + 1}
                            </h6>
                            {sample.recorded ? (
                              <div>
                                <Chip 
                                  label="Recorded" 
                                  size="small" 
                                  style={{ backgroundColor: '#28a745', color: 'white', marginBottom: '8px' }}
                                />
                                <div>
                                  <IconButton 
                                    size="small" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      this.playRecording(sample.blobURL);
                                    }}
                                    style={{ color: '#6D28D9' }}
                                  >
                                    <PlayArrowIcon />
                                  </IconButton>
                                </div>
                              </div>
                            ) : currentSampleIndex === index ? (
                              <Chip 
                                label="Recording..." 
                                size="small" 
                                style={{ backgroundColor: '#dc3545', color: 'white' }}
                              />
                            ) : (
                              <Chip 
                                label="Click to Record" 
                                size="small" 
                                style={{ backgroundColor: '#6D28D9', color: 'white' }}
                              />
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}

                {/* Processing State */}
                {isProcessing && (
                  <div className="text-center p-5">
                    <div className="spinner-border text-primary mb-3" style={{ width: '4rem', height: '4rem' }} role="status">
                      <span className="sr-only">Processing...</span>
                    </div>
                    <h4 className="font-weight-bold" style={{ color: '#6D28D9' }}>
                      Processing Your Voice Samples...
                    </h4>
                    <p className="text-muted">
                      Training your unique voice model. This may take a moment.
                    </p>
                  </div>
                )}

                {/* Success State */}
                {enrollmentSuccess && (
                  <div className="text-center p-5">
                    <div style={{ fontSize: '80px', marginBottom: '20px' }}>✅</div>
                    <h3 className="font-weight-bold mb-3" style={{ color: '#28a745' }}>
                      Voice Enrollment Complete!
                    </h3>
                    <p className="text-muted mb-4">
                      Your voice profile has been successfully created. 
                      Proceeding to the next step...
                    </p>
                    <LinearProgress />
                  </div>
                )}

                {/* Help Text */}
                {!isProcessing && !enrollmentSuccess && count === 0 && (
                  <div className="text-center mt-4">
                    <p className="text-muted small">
                      💡 <strong>Tip:</strong> Record in a quiet environment for best results. 
                      Each recording will be exactly 6 seconds long.
                    </p>
                  </div>
                )}

              </CardContent>
            </Card>
          </MDBCol>
          <MDBCol md="2"></MDBCol>
        </MDBRow>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .pulse-animation {
            animation: pulse 1.5s ease-in-out infinite;
          }
        `}</style>
      </MDBContainer>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    studentData: state.student
  };
};

export default connect(mapStateToProps)(SignupSecond);
