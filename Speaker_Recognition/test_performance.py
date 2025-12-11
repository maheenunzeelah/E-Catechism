import os
import pickle
import numpy as np
from pathlib import Path
from pydub import AudioSegment
import pydub
from scipy.io.wavfile import read
from feature_extraction import extract_features
import warnings
warnings.filterwarnings("ignore")
import time
 
#path to training data
source   = "public/loginUploads/"
modelpath = "speaker_models/"
# file in which path of login audio file is saved
test_file = "loginVoices.txt"

file_paths = open(test_file,'r+')
#file in which path of audios downloded from minio is saved
match_paths=open('matchVoices.txt','r+')

#Removing empty lines
lines=(line.rstrip() for line in file_paths)
lines= (line for line in lines if line)

linesTest=(line.rstrip() for line in match_paths)
linesTest= (line for line in linesTest if line)

global gmm_files

#Based on the login audio files in minio trained model files are used
for path in linesTest:
 print(path)      
 gmm_files = [os.path.join(modelpath,fname) for fname in
              os.listdir(modelpath) if fname.endswith(path+'.gmm')]
 if gmm_files != [] :
  print(gmm_files)   
  break             

 #removing contents 
match_paths.truncate(0)

#Load the Gaussian gender Models
models    = [pickle.load(open(fname,'rb')) for fname in gmm_files]
speakers   = [fname.split("\\")[-1].split(".gmm")[0] for fname
              in gmm_files]
 
# Read the test directory and get the list of test audio files
for path2 in lines:   
 
    path2 = path2.strip()
    path2 = path2.replace('\\','/')
    print(path2)

    #if file exists convert into wave otherwise already converted
    if os.path.isfile(source+path2):
     sound = AudioSegment.from_mp3(source+path2)
     sound.export(source+path2+'.wav', format="wav")
     os.remove(source+path2)

    sr,audio = read(source+ path2+'.wav')
    vector   = extract_features(audio,sr)
 
    log_likelihood = np.zeros(len(models)) 
 
    for i in range(len(models)):
        gmm    = models[i]  #checking with each model one by one
        scores = np.array(gmm.score(vector))
        log_likelihood[i] = scores.sum()
 
    winner = np.argmax(log_likelihood)
    print("\tdetected as - ", speakers[winner])
    time.sleep(1.0)


