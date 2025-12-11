import axios from 'axios';

const speakerRecognitionApi = axios.create({
  baseURL: 'http://localhost:5000/api'
});

export default speakerRecognitionApi;

