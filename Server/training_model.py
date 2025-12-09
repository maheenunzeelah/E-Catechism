#import SpeechRecognition as sr
import pickle
import numpy as np
import os
from pathlib import Path
from pydub import AudioSegment
import pydub
from scipy.io.wavfile import read
from sklearn.mixture import GaussianMixture as GMM
# from sklearn.mixture import GMM
from feature_extraction import extract_features
import warnings
warnings.filterwarnings("ignore")
 
#path to training data
source   = "public/uploads/"  

#path where training speakers will be saved
dest = "speaker_models/"
train_file = "signupVoices.txt"

file_paths = open(train_file,'r')
lines=(line.rstrip() for line in file_paths)
lines= (line for line in lines if line)

count = 1
# Extracting features for each speaker (5 files per speakers)
features = np.asarray(())

for path in lines:
  
   
    path = path.replace('\\','/')
   
    print(path)
    if os.path.isfile(source+path):
     sound = AudioSegment.from_mp3(source+path)
     sound.export(source+path+'.wav', format="wav")
     os.remove(source+path)
    # read the audio
    
    sr,audio = read(source+path+'.wav')

#    sr = read(source + path)
    
    # extract 40 dimensional MFCC & delta MFCC features
    vector   = extract_features(audio,sr)
 
    if features.size == 0:
        features = vector
    else:
        features = np.vstack((features, vector))
    # when features of 5 files of speaker are concatenated, then do model training
    if count == 5:
        gmm = GMM(n_components = 16, max_iter = 200, covariance_type='diag',n_init = 3)
        gmm.fit(features)
       
        # dumping the trained gaussian model
        picklefile = path.split("/")[1]+".gmm"
        print(picklefile)
        basedir = os.path.dirname(dest+picklefile)
        if not os.path.exists(basedir):
          os.makedirs(basedir)
        pickle.dump(gmm,open(dest + picklefile,"wb"))
        print('+ modeling completed for speaker:',picklefile," with data point = ",features.shape)
        features = np.asarray(())
        count = 0
    count = count + 1