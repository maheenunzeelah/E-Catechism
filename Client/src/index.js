import React from 'react';
import ReactDOM from 'react-dom';
import './css/index.css';
import './css/purple-theme.css';
import App from './components/App';
import ScrollToTop from './components/scrollToTop'
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bootstrap-css-only/css/bootstrap.min.css';
import 'mdbreact/dist/css/mdb.css';
import {Provider} from 'react-redux';
import {createStore, applyMiddleware, compose} from 'redux';
import thunk from 'redux-thunk';
import reducer from './reducers';
import {BrowserRouter , Route,Switch} from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import {setCurrentTeacher,setCurrentStudent} from './actions'
import setAuthToken from './utils/setAuthToken';
  


// import Main from './Main';
// import Overview from './Overview';
// import Quizsettings from './QuizSettings';
// import TourPage from './TourPage';
// import NavbarPage from './Navbar';
// import Card from './card';
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(reducer,composeEnhancers(applyMiddleware(thunk))); 

// ============================================
// FLASK-ONLY MODE - Authentication Persistence
// ============================================
// Restore authentication state from localStorage on page reload

// Check for JWT token (mock mode for both teacher and student)
if(localStorage.jwtToken){
    try {
        const token = localStorage.jwtToken;
        setAuthToken(token);
        
        // Decode mock token (base64 encoded JSON)
        const decoded = JSON.parse(atob(token));
        console.log('[MOCK] Restored user from token:', decoded);
        
        if(decoded.role === 'teacher'){
            store.dispatch(setCurrentTeacher(decoded));
        } else if(decoded.role === 'student'){
            store.dispatch(setCurrentStudent(decoded));
        }
    } catch (error) {
        console.log('JWT token invalid, clearing...', error);
        localStorage.removeItem('jwtToken');
    }
}

// Check for teacher authentication (direct login, no voice)
if(localStorage.teacherAuth){
    try {
        const teacherData = JSON.parse(localStorage.teacherAuth);
        store.dispatch(setCurrentTeacher(teacherData));
    } catch (error) {
        console.log('Teacher auth data invalid, clearing...');
        localStorage.removeItem('teacherAuth');
    }
}

// Check for student voice authentication (Flask-only mode)
if(localStorage.voiceAuthUser){
    try {
        const studentData = JSON.parse(localStorage.voiceAuthUser);
        if(studentData.role === 'student'){
            store.dispatch(setCurrentStudent(studentData));
        }
    } catch (error) {
        console.log('Student voice auth data invalid, clearing...');
        localStorage.removeItem('voiceAuthUser');
    }
}
ReactDOM.render( 
<Provider store={store}>
<BrowserRouter>
<ScrollToTop />
<App/> 

</BrowserRouter>
</Provider>, document.getElementById('root'));


