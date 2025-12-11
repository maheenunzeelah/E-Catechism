import React, { Component } from 'react';
import { connect } from 'react-redux';
import { MDBContainer, MDBRow, MDBCol, MDBBtn } from 'mdbreact';
import { Card, CardContent, LinearProgress, Button } from '@material-ui/core';
import MicIcon from '@material-ui/icons/Mic';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import speakerRecognitionApi from '../../apis/speakerRecognitionApi';
import { setCurrentStudent } from '../../actions';

class LoginVoiceAuth extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isRecording: false,
      isProcessing: false,
      recordingComplete: false,
      authSuccess: false,
      audioURL: null,
      recordingTimer: 0,
      isPlaying: false,
      playbackTime: 0,
      audioLevel: 0,
      peakLevel: 0
    };
    this.audioContext = null;
    this.scriptProcessor = null;
    this.audioChunks = [];
    this.timerInterval = null;
    this.stream = null;
    this.sampleRate = 44100;
    this.gainNode = null;
  }

  encodeWAV = (samples) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    // WAV header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, this.sampleRate, true);
    view.setUint32(28, this.sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    
    // Write PCM samples
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(44 + i * 2, samples[i], true);
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  convertToBase64PCM = (samples) => {
    const uint8Array = new Uint8Array(samples.buffer);
    let binaryString = '';
    const chunkSize = 8192;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binaryString);
  }

  startRecording = async () => {
    try {
      this.audioChunks = [];
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,  // Turn off processing to get raw audio
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: this.sampleRate
        } 
      });
      
      console.log('Starting WAV recording with Web Audio API...');
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.sampleRate
      });
      
      const source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Add gain node to boost volume by 3x
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 3.0;
      
      this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.state.isRecording) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const samples = new Int16Array(inputData.length);
        
        // Calculate audio level for monitoring
        let sum = 0;
        let peak = 0;
        
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          
          const abs = Math.abs(inputData[i]);
          sum += abs;
          if (abs > peak) peak = abs;
        }
        
        const avgLevel = (sum / inputData.length) * 100;
        const peakLevel = peak * 100;
        
        this.setState({ audioLevel: avgLevel, peakLevel: peakLevel });
        
        this.audioChunks.push(samples);
        
        if (this.audioChunks.length % 10 === 0) {
          console.log('Recording... Chunks:', this.audioChunks.length, 'Avg level:', avgLevel.toFixed(2), 'Peak:', peakLevel.toFixed(2));
        }
      };
      
      source.connect(this.gainNode);
      this.gainNode.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);
      
      this.setState({ isRecording: true, recordingTimer: 0, audioLevel: 0, peakLevel: 0 });
      console.log('Recording started with 3x gain boost');
      
      // Timer and auto-stop after 5 seconds
      this.timerInterval = setInterval(() => {
        this.setState(prev => {
          const newTimer = prev.recordingTimer + 1;
          if (newTimer >= 5) {
            this.stopRecording();
          }
          return { recordingTimer: newTimer };
        });
      }, 1000);
      
    } catch (error) {
      console.error('Microphone error:', error);
      alert('Error accessing microphone: ' + error.message);
    }
  };

  stopRecording = () => {
    console.log('Stopping recording...');
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    this.setState({ isRecording: false });
    
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    // Combine all chunks
    let totalLength = 0;
    for (let i = 0; i < this.audioChunks.length; i++) {
      totalLength += this.audioChunks[i].length;
    }
    
    const allSamples = new Int16Array(totalLength);
    let offset = 0;
    for (let i = 0; i < this.audioChunks.length; i++) {
      allSamples.set(this.audioChunks[i], offset);
      offset += this.audioChunks[i].length;
    }
    
    console.log('Total samples recorded:', allSamples.length);
    
    if (allSamples.length === 0) {
      alert('No audio recorded. Please try again.');
      return;
    }
    
    // Store samples for authentication
    this.recordedSamples = allSamples;
    
    // Create WAV blob for playback
    const wavBlob = this.encodeWAV(allSamples);
    const url = URL.createObjectURL(wavBlob);
    
    console.log('WAV created:', wavBlob.size, 'bytes');
    console.log('Audio URL:', url);
    
    this.setState({ 
      audioURL: url,
      recordingComplete: true,
      recordingTimer: 0
    });
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  };

  authenticateVoice = async () => {
    if (!this.recordedSamples) {
      alert('Please record your voice first');
      return;
    }

    this.setState({ isProcessing: true });
    
    try {
      console.log('Converting to base64 for authentication...');
      const base64Audio = this.convertToBase64PCM(this.recordedSamples);
      
      const username = this.props.studentData.email?.split('@')[0];

      if (!username) {
        throw new Error('Username not found. Please enter email first.');
      }
      
      const response = await speakerRecognitionApi.post('/authenticate', {
        username: username,
        sample: base64Audio
      });
      
      if (response.data.success && response.data.is_authentic) {
        const authPayload = {
          studentid: response.data.identified_user,
          email: this.props.studentData.email,
          role: 'student',
          voiceAuth: true,
          confidence: response.data.confidence.toFixed(2),
          isAuthenticatedStudent: true
        };
        
        localStorage.setItem('voiceAuthUser', JSON.stringify(authPayload));
        localStorage.setItem('isAuthenticatedStudent', 'true');
        
        this.props.setCurrentStudent(authPayload);
        
        this.setState({ isProcessing: false, authSuccess: true });
        
        setTimeout(() => {
          alert(`Voice authentication successful!\nConfidence: ${response.data.confidence.toFixed(2)}`);
          window.location.replace('/student');
        }, 1500);
      } else {
        this.setState({ isProcessing: false });
        alert('Voice authentication failed. Please try again.');
      }
      
    } catch (error) {
      alert('Error authenticating voice: ' + (error.response?.data?.error || error.message));
      this.setState({ isProcessing: false });
    }
  };

  testSystemAudio = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 440;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
    
    alert('Listen for a beep sound now!');
  };

  componentWillUnmount() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  render() {
    const { isRecording, isProcessing, recordingComplete, recordingTimer, authSuccess, isPlaying, playbackTime } = this.state;
    
    return (
      <MDBContainer>
        <MDBRow>
          <MDBCol md="2"></MDBCol>
          <MDBCol md="8">
            <Card className="mt-5 mb-5">
              <CardContent style={{ padding: '40px' }}>
                
                <div className="text-center mb-4">
                  <h3>Voice Authentication</h3>
                  <p className="text-muted">Speak for 5 seconds to verify your identity</p>
                </div>

                {isRecording && (
                  <div className="text-center mb-4">
                    <MicIcon style={{ fontSize: '48px', color: '#dc3545' }} />
                    <h4>Recording... {recordingTimer}s / 5s</h4>
                    <p className="text-muted">Recording as WAV format (3x volume boost)</p>
                    
                    {/* Audio Level Meter */}
                    <div className="mt-3" style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                      <p className="mb-2" style={{ fontWeight: 'bold' }}>Audio Input Level:</p>
                      <div style={{ 
                        width: '100%', 
                        height: '30px', 
                        backgroundColor: '#e0e0e0', 
                        borderRadius: '5px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{ 
                          width: `${Math.min(100, this.state.audioLevel * 10)}%`, 
                          height: '100%', 
                          backgroundColor: this.state.audioLevel > 1 ? '#28a745' : '#dc3545',
                          transition: 'width 0.1s ease-in-out'
                        }}></div>
                      </div>
                      <p className="mt-2 mb-0" style={{ fontSize: '14px' }}>
                        Avg: {this.state.audioLevel.toFixed(2)}% | Peak: {this.state.peakLevel.toFixed(2)}%
                      </p>
                      {this.state.audioLevel < 0.5 && (
                        <p className="mt-2 mb-0" style={{ color: '#dc3545', fontWeight: 'bold' }}>
                          ⚠️ Very low input! Speak LOUDER or check microphone volume in Windows settings
                        </p>
                      )}
                      {this.state.audioLevel >= 0.5 && (
                        <p className="mt-2 mb-0" style={{ color: '#28a745', fontWeight: 'bold' }}>
                          ✓ Good audio level detected!
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!isProcessing && !authSuccess && (
                  <div className="text-center mb-4">
                    {!recordingComplete ? (
                      <MDBBtn
                        color="primary"
                        onClick={this.startRecording}
                        disabled={isRecording}
                      >
                        <MicIcon style={{ marginRight: '10px' }} />
                        {isRecording ? 'Recording...' : 'Start Recording'}
                      </MDBBtn>
                    ) : (
                      <div>
                        <CheckCircleIcon style={{ fontSize: '60px', color: '#28a745' }} />
                        <h5 className="mt-2">Recording Complete!</h5>
                        
                        {this.state.audioURL && (
                          <div className="mb-3">
                            <p className="text-muted">Preview your recording (WAV format):</p>
                            
                            {isPlaying && (
                              <div style={{ 
                                padding: '15px', 
                                backgroundColor: '#d4edda', 
                                border: '2px solid #28a745',
                                borderRadius: '10px',
                                marginBottom: '10px'
                              }}>
                                <h5 style={{ color: '#155724', margin: 0 }}>
                                  🔊 Playing: {playbackTime.toFixed(1)}s
                                </h5>
                              </div>
                            )}
                            
                            <audio 
                              src={this.state.audioURL}
                              controls 
                              style={{ width: '100%', marginTop: '10px', marginBottom: '10px' }}
                              onPlay={() => {
                                console.log('WAV audio started playing');
                                this.setState({ isPlaying: true });
                              }}
                              onPause={() => {
                                this.setState({ isPlaying: false });
                              }}
                              onEnded={() => {
                                this.setState({ isPlaying: false, playbackTime: 0 });
                              }}
                              onTimeUpdate={(e) => {
                                this.setState({ playbackTime: e.target.currentTime });
                              }}
                              onError={(e) => {
                                console.error('Audio error:', e.target.error);
                                alert('Audio playback error!');
                              }}
                            />
                            
                            <div style={{ 
                              padding: '10px', 
                              backgroundColor: '#fff3cd', 
                              borderRadius: '5px',
                              marginTop: '10px',
                              fontSize: '14px'
                            }}>
                              <p className="mb-1">⚠️ Still can't hear? Try:</p>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={this.testSystemAudio}
                                style={{ 
                                  backgroundColor: '#ffc107',
                                  color: '#000',
                                  marginTop: '5px'
                                }}
                              >
                                Test Beep Sound
                              </Button>
                            </div>
                          </div>
                        )}

                        <Button
                          variant="contained"
                          color="primary"
                          onClick={this.authenticateVoice}
                          style={{ margin: '10px' }}
                        >
                          Authenticate Voice
                        </Button>

                        <Button
                          variant="outlined"
                          onClick={() => {
                            this.setState({ recordingComplete: false, audioURL: null });
                            this.recordedSamples = null;
                          }}
                          style={{ margin: '10px' }}
                        >
                          Re-record
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {isProcessing && (
                  <div className="text-center p-5">
                    <div className="spinner-border mb-3" role="status"></div>
                    <h4>Authenticating Your Voice...</h4>
                  </div>
                )}

                {authSuccess && (
                  <div className="text-center p-5">
                    <h3 style={{ color: '#28a745' }}>Authentication Successful!</h3>
                    <p className="text-muted">Logging you in...</p>
                    <LinearProgress />
                  </div>
                )}

                {!isProcessing && !authSuccess && (
                  <div className="text-center mt-4">
                    <Button onClick={this.props.previousPage}>
                      ← Back to Login
                    </Button>
                  </div>
                )}

              </CardContent>
            </Card>
          </MDBCol>
          <MDBCol md="2"></MDBCol>
        </MDBRow>
      </MDBContainer>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    studentData: state.student
  };
};

export default connect(mapStateToProps, { setCurrentStudent })(LoginVoiceAuth);