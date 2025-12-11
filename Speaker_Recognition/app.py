# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pickle
import numpy as np
from scipy.io.wavfile import write, read
from sklearn.mixture import GaussianMixture as GMM
from feature_extraction import extract_features
import base64
import io

app = Flask(__name__)
CORS(app)

class SpeakerAuthenticator:
    def __init__(self):
        self.sample_rate = 16000
        self.models_dir = "speaker_models/"
        self.audio_dir = "audio_samples/"
        
        os.makedirs(self.models_dir, exist_ok=True)
        os.makedirs(self.audio_dir, exist_ok=True)
        os.makedirs(os.path.join(self.audio_dir, "enrollment"), exist_ok=True)
        os.makedirs(os.path.join(self.audio_dir, "test"), exist_ok=True)

auth = SpeakerAuthenticator()

@app.route('/api/enroll', methods=['POST'])
def enroll_user():
    """Enroll user with multiple audio samples"""
    try:
        
        data = request.json
        print("\n🎤 Enrolling new user...",data)
        username = data.get('username')
        audio_samples = data.get('samples')  # List of base64 audio data
        
        if not username or not audio_samples:
            return jsonify({'error': 'Missing username or samples'}), 400
        
        if len(audio_samples) < 5:
            return jsonify({'error': 'Need at least 5 samples'}), 400
        
        features = np.asarray(())
        
        # Process each audio sample
        for idx, audio_data in enumerate(audio_samples):
            try:
                # Decode base64 audio
                audio_bytes = base64.b64decode(audio_data)
                audio_array = np.frombuffer(audio_bytes, dtype=np.int16)
                
                # Save audio file
                audio_file = os.path.join(
                    auth.audio_dir, 
                    "enrollment", 
                    f"{username}_sample_{idx+1}.wav"
                )
                write(audio_file, auth.sample_rate, audio_array)
                
                # Extract features
                vector = extract_features(audio_array, auth.sample_rate)
                
                if features.size == 0:
                    features = vector
                else:
                    features = np.vstack((features, vector))
                    
            except Exception as e:
                return jsonify({'error': f'Error processing sample {idx+1}: {str(e)}'}), 400
        
        # Train GMM model
        try:
            gmm = GMM(
                n_components=16, 
                max_iter=200, 
                covariance_type='diag',
                n_init=3
            )
            gmm.fit(features)
            
            # Save model
            model_file = os.path.join(auth.models_dir, f"{username}.gmm")
            with open(model_file, 'wb') as f:
                pickle.dump(gmm, f)
            
            return jsonify({
                'success': True,
                'message': f'User {username} enrolled successfully',
                'username': username,
                'samples_processed': len(audio_samples)
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Error training model: {str(e)}'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/authenticate', methods=['POST'])
def authenticate():
    """Authenticate user with test sample"""
    try:
        data = request.json
        username = data.get('username')
        audio_data = data.get('sample')
        
        if not username or not audio_data:
            return jsonify({'error': 'Missing username or audio sample'}), 400
        
        # Decode base64 audio
        audio_bytes = base64.b64decode(audio_data)
        audio_array = np.frombuffer(audio_bytes, dtype=np.int16)
        
        # Save test audio
        test_file = os.path.join(auth.audio_dir, "test", "test_sample.wav")
        write(test_file, auth.sample_rate, audio_array)
        
        # Extract features
        vector = extract_features(audio_array, auth.sample_rate)
        
        # Load all models
        gmm_files = [
            os.path.join(auth.models_dir, f) 
            for f in os.listdir(auth.models_dir) 
            if f.endswith('.gmm')
        ]
        
        if not gmm_files:
            return jsonify({'error': 'No enrolled users found'}), 400
        
        models = []
        speakers = []
        for fname in gmm_files:
            with open(fname, 'rb') as f:
                models.append(pickle.load(f))
            speakers.append(os.path.basename(fname).replace('.gmm', ''))
        
        # Calculate log-likelihood scores
        log_likelihood = np.zeros(len(models))
        for i, model in enumerate(models):
            scores = np.array(model.score(vector))
            log_likelihood[i] = scores.sum()
        
        # Find best match
        best_idx = np.argmax(log_likelihood)
        identified_user = speakers[best_idx]
        confidence = log_likelihood[best_idx]
        
        # Check if matches claimed identity
        is_authentic = (identified_user == username)
        
        return jsonify({
            'success': True,
            'claimed_user': username,
            'identified_user': identified_user,
            'is_authentic': is_authentic,
            'confidence': float(confidence),
            'scores': {speakers[i]: float(log_likelihood[i]) for i in range(len(speakers))}
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/identify', methods=['POST'])
def identify():
    """Identify unknown speaker"""
    try:
        data = request.json
        audio_data = data.get('sample')
        
        if not audio_data:
            return jsonify({'error': 'Missing audio sample'}), 400
        
        # Decode base64 audio
        audio_bytes = base64.b64decode(audio_data)
        audio_array = np.frombuffer(audio_bytes, dtype=np.int16)
        
        # Extract features
        vector = extract_features(audio_array, auth.sample_rate)
        
        # Load all models
        gmm_files = [
            os.path.join(auth.models_dir, f) 
            for f in os.listdir(auth.models_dir) 
            if f.endswith('.gmm')
        ]
        
        if not gmm_files:
            return jsonify({'error': 'No enrolled users found'}), 400
        
        models = []
        speakers = []
        for fname in gmm_files:
            with open(fname, 'rb') as f:
                models.append(pickle.load(f))
            speakers.append(os.path.basename(fname).replace('.gmm', ''))
        
        # Calculate scores
        log_likelihood = np.zeros(len(models))
        for i, model in enumerate(models):
            scores = np.array(model.score(vector))
            log_likelihood[i] = scores.sum()
        
        best_idx = np.argmax(log_likelihood)
        identified_user = speakers[best_idx]
        
        return jsonify({
            'success': True,
            'identified_user': identified_user,
            'scores': {speakers[i]: float(log_likelihood[i]) for i in range(len(speakers))}
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users', methods=['GET'])
def list_users():
    """List all enrolled users"""
    try:
        gmm_files = [
            f.replace('.gmm', '') 
            for f in os.listdir(auth.models_dir) 
            if f.endswith('.gmm')
        ]
        return jsonify({'users': gmm_files}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete-user/<username>', methods=['DELETE'])
def delete_user(username):
    """Delete user model"""
    try:
        model_file = os.path.join(auth.models_dir, f"{username}.gmm")
        if os.path.exists(model_file):
            os.remove(model_file)
            return jsonify({'success': True, 'message': f'User {username} deleted'}), 200
        else:
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)