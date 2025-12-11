import os
import pickle
import json
import numpy as np
import sounddevice as sd
from scipy.io.wavfile import write, read
from sklearn.mixture import GaussianMixture as GMM
from feature_extraction import extract_features
import warnings
import time
from cryptography.fernet import Fernet

warnings.filterwarnings("ignore")

class SpeakerAuthenticator:
    def __init__(self):
        self.sample_rate = 16000  # 16 kHz
        self.duration = 3  # 3 seconds per recording
        self.models_dir = "speaker_models/"
        self.audio_dir = "audio_samples/"
        self.cache_dir = "speaker_cache/"  # New cache directory
        self.key = self._load_key()
        self.cipher = Fernet(self.key)

        # Create directories if they don't exist
        os.makedirs(self.models_dir, exist_ok=True)
        os.makedirs(self.audio_dir, exist_ok=True)
        os.makedirs(os.path.join(self.audio_dir, "enrollment"), exist_ok=True)
        os.makedirs(os.path.join(self.audio_dir, "test"), exist_ok=True)
        os.makedirs(self.cache_dir, exist_ok=True)
        
        # Cache for loaded models and embeddings
        self._model_cache = {}
        self._embeddings_cache = {}
        
        # Performance metrics
        self.performance_metrics = {
            'with_cache': [],
            'without_cache': []
        }
        
    def _load_key(self):
        """Loads the AES encryption key from file"""
        with open("secret.key", "rb") as f:
            return f.read()

    def encrypt_audio(self, filepath):
        """Encrypt a WAV file"""
        with open(filepath, "rb") as f:
            data = f.read()
        encrypted = self.cipher.encrypt(data)
        
        with open(filepath + ".enc", "wb") as f:
            f.write(encrypted)
        
        os.remove(filepath)  # delete original unsafe file
        return filepath + ".enc"

    def decrypt_audio(self, encrypted_path):
        """Decrypt encrypted WAV so it can be read"""
        with open(encrypted_path, "rb") as f:
            encrypted_data = f.read()
        
        decrypted = self.cipher.decrypt(encrypted_data)

        temp_path = encrypted_path.replace(".enc", "_dec.wav")
        with open(temp_path, "wb") as f:
            f.write(decrypted)

        return temp_path
    
    def _get_embeddings_file(self, username):
        """Get path for cached embeddings"""
        return os.path.join(self.cache_dir, f"{username}_embeddings.npy")
    
    def _get_metadata_file(self, username):
        """Get path for enrollment metadata"""
        return os.path.join(self.cache_dir, f"{username}_metadata.json")
    
    def _save_embeddings(self, username, features):
        """Cache enrollment feature vectors"""
        embeddings_file = self._get_embeddings_file(username)
        np.save(embeddings_file, features)
        
        # Save metadata
        metadata = {
            "username": username,
            "num_samples": features.shape[0],
            "feature_dim": features.shape[1],
            "cached_at": str(np.datetime64('now'))
        }
        with open(self._get_metadata_file(username), 'w') as f:
            json.dump(metadata, f)
    
    def _load_embeddings(self, username):
        """Load cached embeddings for a user"""
        embeddings_file = self._get_embeddings_file(username)
        if os.path.exists(embeddings_file):
            return np.load(embeddings_file)
        return None
    
    def record_audio(self, filename):
        """Record audio from microphone"""
        print(f"\n🎤 Recording for {self.duration} seconds...")
        print("Speak now!")
        
        audio_data = sd.rec(int(self.duration * self.sample_rate), 
                           samplerate=self.sample_rate, 
                           channels=1, 
                           dtype='int16')
        sd.wait()
        
        write(filename, self.sample_rate, audio_data)
        filename = self.encrypt_audio(filename)
        print(f"✓ Recording saved to {filename}")
        return filename
    
    def enroll_user(self, username, num_samples=5):
        """Enroll a new user with cached embeddings"""
        print(f"\n{'='*60}")
        print(f"ENROLLING NEW USER: {username}")
        print(f"{'='*60}")
        print(f"You will need to record {num_samples} voice samples.")
        print("Please speak naturally for 3 seconds each time.")
        
        features = np.asarray(())
        
        for i in range(num_samples):
            input(f"\nPress Enter to record sample {i+1}/{num_samples}...")
            
            audio_file = os.path.join(self.audio_dir, "enrollment", 
                                     f"{username}_sample_{i+1}.wav")
            filename = self.record_audio(audio_file)
            print(filename)
            audio_file = self.decrypt_audio(filename)   # returns temp WAV
            sr, audio = read(audio_file)
            os.remove(audio_file)  # remove temp decrypted WAV
            vector = extract_features(audio, sr)
            
            if features.size == 0:
                features = vector
            else:
                features = np.vstack((features, vector))
        
        # Train GMM model
        print(f"\n🔧 Training GMM model for {username}...")
        gmm = GMM(n_components=16, max_iter=200, covariance_type='diag', n_init=3)
        gmm.fit(features)
        
        # Save model
        model_file = os.path.join(self.models_dir, f"{username}.gmm")
        with open(model_file, 'wb') as f:
            pickle.dump(gmm, f)
        
        # Cache embeddings for fast authentication
        self._save_embeddings(username, features)
        self._model_cache[username] = gmm
        self._embeddings_cache[username] = features
        
        print(f"✓ Model trained and saved!")
        print(f"✓ Embeddings cached for fast authentication")
        print(f"✓ User '{username}' enrolled with {features.shape[0]} feature vectors")
        return True
    
    def _load_all_models_cached(self, use_cache=True):
        """Load all models and embeddings with caching"""
        gmm_files = [f for f in os.listdir(self.models_dir) if f.endswith('.gmm')]
        
        if not gmm_files:
            return [], [], []
        
        models = []
        speakers = []
        embeddings = []
        
        for gmm_file in gmm_files:
            speaker = gmm_file.replace('.gmm', '')
            
            # Load model (with cache check)
            if speaker not in self._model_cache:
                model_path = os.path.join(self.models_dir, gmm_file)
                with open(model_path, 'rb') as f:
                    self._model_cache[speaker] = pickle.load(f)
            
            # Load cached embeddings only if use_cache is True
            if use_cache:
                if speaker not in self._embeddings_cache:
                    cached_emb = self._load_embeddings(speaker)
                    if cached_emb is not None:
                        self._embeddings_cache[speaker] = cached_emb
            else:
                # Without cache, re-extract features from audio files
                self._embeddings_cache[speaker] = None
            
            models.append(self._model_cache[speaker])
            speakers.append(speaker)
            embeddings.append(self._embeddings_cache.get(speaker))
        
        return models, speakers, embeddings
    
    def _recompute_features_without_cache(self, speaker):
        """Recompute features from audio files (simulates no cache)"""
        enrollment_dir = os.path.join(self.audio_dir, "enrollment")
        audio_files = sorted([f for f in os.listdir(enrollment_dir) 
                            if f.startswith(f"{speaker}_sample_")])
        
        features = np.asarray(())
        for audio_file in audio_files:
            audio_path = os.path.join(enrollment_dir, audio_file)
            if os.path.exists(audio_path):
                sr, audio = read(audio_path)
                vector = extract_features(audio, sr)
                
                if features.size == 0:
                    features = vector
                else:
                    features = np.vstack((features, vector))
        
        return features if features.size > 0 else None
    
    def authenticate_user(self, username=None, use_cache=True):
        """Fast authentication using cached embeddings or without cache"""
        print(f"\n{'='*60}")
        print("AUTHENTICATION")
        print(f"{'='*60}")
        
        models, speakers, embeddings = self._load_all_models_cached(use_cache=use_cache)
        
        if not models:
            print("❌ No enrolled users found!")
            return None
        
        mode_text = "✓ WITH CACHE" if use_cache else "✗ WITHOUT CACHE"
        print(f"Mode: {mode_text}")
        print(f"Enrolled users: {', '.join(speakers)}")
        
        if username:
            print(f"\nAttempting to authenticate as: {username}")
        else:
            print(f"\nAttempting to identify speaker...")
        
        input("\nPress Enter to record your voice for authentication...")
        
        # Record test audio
        test_file = os.path.join(self.audio_dir, "test", "test_sample.wav")
        filename = self.record_audio(test_file)
        audio_file = self.decrypt_audio(filename)   # returns temp WAV
        sr, audio = read(audio_file)
     
        vector = extract_features(audio, sr)
        
        # Start timing
        start_time = time.time()
        
        # Fast scoring using cached models
        log_likelihood = np.zeros(len(models))
        
        print("\n📊 Calculating scores...")
        for i, (model, speaker) in enumerate(zip(models, speakers)):
            if not use_cache:
                # Recompute features from audio files (simulates no cache)
                recomputed_features = self._recompute_features_without_cache(speaker)
            
            scores = np.array(model.score(vector))
            log_likelihood[i] = scores.sum()
            print(f"  {speaker}: {log_likelihood[i]:.2f}")
        
        # End timing
        elapsed_time = time.time() - start_time
        
        winner_idx = np.argmax(log_likelihood)
        identified_user = speakers[winner_idx]
        confidence = log_likelihood[winner_idx]
        
        sorted_scores = np.sort(log_likelihood)
        margin = sorted_scores[-1] - sorted_scores[-2] if len(sorted_scores) > 1 else confidence
        
        print(f"\n{'='*60}")
        print(f"🎯 IDENTIFIED SPEAKER: {identified_user}")
        print(f"📈 Confidence Score: {confidence:.2f}")
        print(f"📊 Margin: {margin:.2f}")
        print(f"⏱️  Processing Time: {elapsed_time:.4f} seconds")
        print(f"{'='*60}")
        
        # Store metrics
        if use_cache:
            self.performance_metrics['with_cache'].append(elapsed_time)
        else:
            self.performance_metrics['without_cache'].append(elapsed_time)
        
        if username:
            if identified_user == username:
                print(f"✅ AUTHENTICATION SUCCESSFUL!")
                return True
            else:
                print(f"❌ AUTHENTICATION FAILED!")
                return False
        else:
            print(f"✅ SPEAKER IDENTIFIED!")
            return identified_user
    
    def print_performance_report(self):
        """Print performance comparison between cached and non-cached methods"""
        print(f"\n{'='*60}")
        print("📊 PERFORMANCE COMPARISON REPORT")
        print(f"{'='*60}")
        
        with_cache = self.performance_metrics['with_cache']
        without_cache = self.performance_metrics['without_cache']
        
        if with_cache:
            avg_with = np.mean(with_cache)
            min_with = np.min(with_cache)
            max_with = np.max(with_cache)
            print(f"\n✓ WITH CACHE ({len(with_cache)} authentications):")
            print(f"  Average Time: {avg_with:.4f} seconds")
            print(f"  Min Time: {min_with:.4f} seconds")
            print(f"  Max Time: {max_with:.4f} seconds")
            print(f"  Std Dev: {np.std(with_cache):.4f} seconds")
        else:
            print("\n✓ WITH CACHE: No data collected yet")
            avg_with = None
        
        if without_cache:
            avg_without = np.mean(without_cache)
            min_without = np.min(without_cache)
            max_without = np.max(without_cache)
            print(f"\n✗ WITHOUT CACHE ({len(without_cache)} authentications):")
            print(f"  Average Time: {avg_without:.4f} seconds")
            print(f"  Min Time: {min_without:.4f} seconds")
            print(f"  Max Time: {max_without:.4f} seconds")
            print(f"  Std Dev: {np.std(without_cache):.4f} seconds")
        else:
            print("\n✗ WITHOUT CACHE: No data collected yet")
            avg_without = None
        
        if with_cache and without_cache:
            avg_with = np.mean(with_cache)
            avg_without = np.mean(without_cache)
            speedup = avg_without / avg_with
            improvement = ((avg_without - avg_with) / avg_without) * 100
            
            print(f"\n{'='*60}")
            print(f"🚀 SPEEDUP: {speedup:.2f}x faster with cache")
            print(f"📈 IMPROVEMENT: {improvement:.1f}% faster with cache")
            print(f"⏳ Time Saved per Auth: {(avg_without - avg_with):.4f} seconds")
            print(f"{'='*60}\n")
        else:
            print("\n⚠️  Need data from both modes for comparison!")
    
    def list_users(self):
        """List all enrolled users"""
        gmm_files = [f.replace('.gmm', '') for f in os.listdir(self.models_dir) 
                     if f.endswith('.gmm')]
        
        if gmm_files:
            print(f"\n📋 Enrolled Users ({len(gmm_files)}):")
            for i, user in enumerate(gmm_files, 1):
                cache_status = "✓ cached" if os.path.exists(self._get_embeddings_file(user)) else "✗ not cached"
                print(f"  {i}. {user} ({cache_status})")
        else:
            print("\n📋 No enrolled users found.")
        
        return gmm_files
    
    def delete_user(self, username):
        """Delete a user and their cache"""
        model_file = os.path.join(self.models_dir, f"{username}.gmm")
        if os.path.exists(model_file):
            os.remove(model_file)
            
            # Remove cached files
            if os.path.exists(self._get_embeddings_file(username)):
                os.remove(self._get_embeddings_file(username))
            if os.path.exists(self._get_metadata_file(username)):
                os.remove(self._get_metadata_file(username))
            
            # Clear from memory cache
            self._model_cache.pop(username, None)
            self._embeddings_cache.pop(username, None)
            
            print(f"✓ User '{username}' and cache deleted!")
            return True
        else:
            print(f"❌ User '{username}' not found!")
            return False


def main():
    """Main menu for the speaker authentication system"""
    auth = SpeakerAuthenticator()
    
    print("\n" + "="*60)
    print("🎙️  SPEAKER RECOGNITION AUTHENTICATION SYSTEM")
    print("="*60)
    
    while True:
        print("\n" + "-"*60)
        print("MENU:")
        print("1. Enroll New User")
        print("2. Authenticate User (Verify Identity)")
        print("3. Identify Speaker (Unknown)")
        print("4. List Enrolled Users")
        print("5. Delete User")
        print("6. Performance Comparison Report")
        print("7. Exit")
        print("-"*60)
        
        choice = input("\nEnter your choice (1-7): ").strip()
        
        if choice == '1':
            username = input("\nEnter username to enroll: ").strip()
            if not username:
                print("❌ Username cannot be empty!")
                continue
            
            if os.path.exists(os.path.join(auth.models_dir, f"{username}.gmm")):
                overwrite = input(f"⚠️  User '{username}' already exists. Overwrite? (yes/no): ").strip().lower()
                if overwrite != 'yes':
                    continue
            
            num_samples = input("Number of samples (default 5): ").strip()
            num_samples = int(num_samples) if num_samples.isdigit() else 5
            
            auth.enroll_user(username, num_samples)
        
        elif choice == '2':
            users = auth.list_users()
            if not users:
                continue
            
            username = input("\nEnter username to authenticate: ").strip()
            if username not in users:
                print(f"❌ User '{username}' not enrolled!")
                continue
            
            cache_choice = input("Use cache? (yes/no, default yes): ").strip().lower()
            use_cache = cache_choice != 'no'
            auth.authenticate_user(username, use_cache=use_cache)
        
        elif choice == '3':
            users = auth.list_users()
            if not users:
                continue
            
            cache_choice = input("Use cache? (yes/no, default yes): ").strip().lower()
            use_cache = cache_choice != 'no'
            auth.authenticate_user(use_cache=use_cache)
        
        elif choice == '4':
            auth.list_users()
        
        elif choice == '5':
            users = auth.list_users()
            if not users:
                continue
            
            username = input("\nEnter username to delete: ").strip()
            auth.delete_user(username)
        
        elif choice == '6':
            auth.print_performance_report()
        
        elif choice == '7':
            print("\n👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice! Please try again.")


if __name__ == "__main__":
    main()