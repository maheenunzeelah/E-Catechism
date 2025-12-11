import postDataApi from '../apis/postDataApi';
import { SIGN_UP, LOG_IN, SET_CURRENT_TEACHER, SET_CURRENT_STUDENT, FETCH_TESTS, FETCH_QUESTIONS, CURRENT_TEST, FETCH_COURSES, GROUP_LIST, CURRENT_GROUP, STUDENT_TEST, QUESTION_LIST, CURRENT_GROUP_TEST, PROFILE_LOADING ,SET_SETTINGS} from './types';
import setAuthtoken from '../utils/setAuthToken';
import jwt_decode from 'jwt-decode';
import { Link, Redirect } from 'react-router-dom';
import { browserHistory } from 'react-router';
import React from 'react';
import axios from 'axios';
import {Alert,AlertTitle} from '@material-ui/lab';

// ============================================
// FLASK-ONLY MODE - NODE API DISABLED
// ============================================
// All Node.js API calls are commented out
// Using localStorage and mock data for demo purposes
// Flask API for speaker recognition remains active

export const profileLoading = (bool) => {
  return {
    type: PROFILE_LOADING,
    payload: bool
  }
}
//TEACHER PANEL ACTION CREATORS
export const teacherSignup = (formValues) => async (dispatch, getState) => {
  console.log('[MOCK] Teacher Signup:', formValues)
  dispatch(profileLoading())
  
  // Mock teacher signup - Node API disabled
  /*
  await postDataApi.post('/signup', formValues)
    .then(response => {
      localStorage.setItem('jwtToken', response.data.token);
      alert("Teacher Registered");
      window.location.reload();
    })
    .catch(err => {
      alert(err.response.data.email);
      window.location.reload();
    })
  */
  
  // Mock implementation
  setTimeout(() => {
    const mockToken = btoa(JSON.stringify({
      id: Date.now(),
      email: formValues.email,
      name: formValues.name,
      role: 'teacher',
      teacherid: Date.now()
    }));
    
    localStorage.setItem('jwtToken', mockToken);
    alert("Teacher Registered Successfully (Mock Mode)");
    window.location.reload();
  }, 500);
  //dispatch({type:SIGN_UP, payload:response.data})
}
// export const formInputs=(formValues)=>{
//     console.log(formValues)
//     return {
//         type:'FORM_INPUTS',
//         payload:formValues
//     }
// }
export const teacherLogin = (formValues) => async dispatch => {
  dispatch(profileLoading(true))

  // Mock teacher login - Node API disabled
  /*
  await postDataApi.post('/login', formValues)
    .then(response => {
      dispatch(profileLoading(false))
      console.log(response.data.token)
      localStorage.setItem('jwtToken', response.data.token);
      setAuthtoken(response.data.token)
      const decoded = jwt_decode(response.data.token);
      console.log(decoded)
      dispatch(setCurrentTeacher(decoded));
    })
    .catch(err => {
      console.log(err)
      if (err.response.data.email === undefined)
        alert(err.response.data.password)
      if (err.response.data.email !== undefined)
        alert(err.response.data.email)
      window.location.reload();
    })
  */
  
  // Mock implementation
  setTimeout(() => {
    dispatch(profileLoading(false))
    
    const mockToken = btoa(JSON.stringify({
      id: Date.now(),
      email: formValues.email,
      name: formValues.email.split('@')[0],
      role: 'teacher',
      teacherid: Date.now()
    }));
    
    localStorage.setItem('jwtToken', mockToken);
    setAuthtoken(mockToken);
    
    const decoded = JSON.parse(atob(mockToken));
    console.log('[MOCK] Teacher logged in:', decoded);
    dispatch(setCurrentTeacher(decoded));
    
    alert('Teacher Login Successful (Mock Mode)');
  }, 500);
  // dispatch({type:LOG_IN, payload:response.data})
}

export const createTest = (testName) => async dispatch => {
  console.log('[MOCK] Create Test:', testName)
  
  // Mock create test - Node API disabled
  /*
  await postDataApi.post('/login/teacher', testName)
    .then(response => {
      if (response.data === "Enter Test name")
        alert(response.data)
      else {
        alert("Test Created")
        dispatch({ type: CURRENT_TEST, payload: response.data._id })
      }
    })
    .catch(err => {
      if (err.response.data.test !== undefined)
        alert(err.response.data.test);
    })
  */
  
  // Mock implementation
  setTimeout(() => {
    if (!testName.test || testName.test.trim() === '') {
      // alert("Enter Test name");
    } else {
      const mockTestId = 'test_' + Date.now();
      
      // Store in localStorage
      const tests = JSON.parse(localStorage.getItem('mockTests') || '[]');
      tests.push({
        _id: mockTestId,
        name: testName.test,
        course: testName.course,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('mockTests', JSON.stringify(tests));
      
      alert("Test Created (Mock Mode)");
      dispatch({ type: CURRENT_TEST, payload: mockTestId });
    }
  }, 300);

}
export const setCurrentTeacher = decoded => {
  return {
    type: SET_CURRENT_TEACHER,
    payload: decoded
  }
}

export const quesType = (quesType) => {
  return {
    type: 'SET_QUEST_TYPE',
    payload: quesType
  }
}

export const addQues = (formValues) => async (dispatch, getState) => {
  const val = getState().ques;
  const currTest = getState().currentTest;
  const newformValues = { ...formValues, type: val, test: currTest }
  
  // Mock add question - Node API disabled
  /*
  await postDataApi.post('login/teacher/addQues', newformValues)
    .then(response => {
      alert(response.data);
      window.location.replace('/dashboard/addQues');
    })
    .catch(err => {
      if (err.response.data.ques !== undefined)
        alert(err.response.data.ques);
    })
  */
  
  // Mock implementation
  setTimeout(() => {
    const questions = JSON.parse(localStorage.getItem('mockQuestions') || '[]');
    questions.push({
      ...newformValues,
      _id: 'ques_' + Date.now(),
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('mockQuestions', JSON.stringify(questions));
    
    alert('Question Added Successfully (Mock Mode)');
    window.location.replace('/dashboard/addQues');
  }, 300);
}
// delete question action creators
export const deleteQuestion = (id) => async dispatch => {
  console.log('[MOCK] Delete Question:', id)
  
  // Mock delete question - Node API disabled
  /*
  await postDataApi.delete(`login/teacher/delQues/${id}`)
    .then(response => {
      alert(response.data)
      window.location.replace("/dashboard/QuestionBank")
    })
  */
  
  // Mock implementation
  setTimeout(() => {
    const questions = JSON.parse(localStorage.getItem('mockQuestions') || '[]');
    const filtered = questions.filter(q => q._id !== id);
    localStorage.setItem('mockQuestions', JSON.stringify(filtered));
    
    alert('Question Deleted Successfully (Mock Mode)');
    window.location.replace("/dashboard/QuestionBank");
  }, 300);

}
export const editQues = (data) => async (dispatch, getState) => {
  console.log('[MOCK] Edit Question:', data);
  const currTest = getState().currentTest;
  data = { ...data, test: currTest }
  
  // Mock edit question - Node API disabled
  /*
  await postDataApi.put(`login/teacher/updateQues/${data.id}`, data)
    .then(response => {
      alert(response.data)
      window.location.replace("/dashboard/QuestionBank")
    })
    .catch(err => {
      if (err.response.data.question !== undefined)
        alert(err.response.data.question);
    })
  */
  
  // Mock implementation
  setTimeout(() => {
    const questions = JSON.parse(localStorage.getItem('mockQuestions') || '[]');
    const index = questions.findIndex(q => q._id === data.id);
    if (index !== -1) {
      questions[index] = { ...questions[index], ...data };
      localStorage.setItem('mockQuestions', JSON.stringify(questions));
    }
    
    alert('Question Updated Successfully (Mock Mode)');
    window.location.replace("/dashboard/QuestionBank");
  }, 300);
}

export const fetchCourseList = () => async dispatch => {
  // Mock fetch courses - Node API disabled
  /*
  const response = await postDataApi.get('login/teacher/test/course');
  console.log(response.data)
  dispatch({ type: FETCH_COURSES, payload: response.data })
  */
  
  // Mock implementation
  const mockCourses = [
    { _id: '1', name: 'Mathematics' },
    { _id: '2', name: 'Science' },
    { _id: '3', name: 'English' },
    { _id: '4', name: 'History' }
  ];
  console.log('[MOCK] Fetch Courses:', mockCourses);
  dispatch({ type: FETCH_COURSES, payload: mockCourses });
}

export const fetchTests = (page, course = '') => async dispatch => {
  console.log('[MOCK] Fetch Tests - Page:', page, 'Course:', course)
  dispatch(profileLoading(true))
  
  // Mock fetch tests - Node API disabled
  /*
  await postDataApi.get(`login/teacher/tests/${page}?course=${course}`).then(response => {
    dispatch({ type: FETCH_TESTS, payload: response.data })
    dispatch(profileLoading(false))
  })
  */
  
  // Mock implementation
  setTimeout(() => {
    const allTests = JSON.parse(localStorage.getItem('mockTests') || '[]');
    const filtered = course ? allTests.filter(t => t.course === course) : allTests;
    
    const mockResponse = {
      tests: filtered,
      totalPages: Math.ceil(filtered.length / 10),
      currentPage: page
    };
    
    dispatch({ type: FETCH_TESTS, payload: mockResponse });
    dispatch(profileLoading(false));
  }, 300);

  // console.log(response.data)


}

export const fetchQues = (page, filterQues = { course: '', type: '', search: '' }) => async dispatch => {
  console.log('[MOCK] Fetch Questions:', filterQues)
  
  // Mock fetch questions - Node API disabled
  /*
  const response = await postDataApi.get(`login/teacher/readQues/${page}?course=${filterQues.course}&&type=${filterQues.type}&&search=${filterQues.search}`);
  console.log(response.data)
  dispatch({ type: FETCH_QUESTIONS, payload: response.data })
  */
  
  // Mock implementation
  const allQuestions = JSON.parse(localStorage.getItem('mockQuestions') || '[]');
  let filtered = allQuestions;
  
  if (filterQues.course) {
    filtered = filtered.filter(q => q.course === filterQues.course);
  }
  if (filterQues.type) {
    filtered = filtered.filter(q => q.type === filterQues.type);
  }
  if (filterQues.search) {
    filtered = filtered.filter(q => 
      q.question?.toLowerCase().includes(filterQues.search.toLowerCase())
    );
  }
  
  const mockResponse = {
    questions: filtered,
    totalPages: Math.ceil(filtered.length / 10),
    currentPage: page
  };
  
  console.log('[MOCK] Questions:', mockResponse);
  dispatch({ type: FETCH_QUESTIONS, payload: mockResponse });
}

export const editTest = (id) => {
  return { type: CURRENT_TEST, payload: id }
}

export const updateTest = (data) => async dispatch => {
  console.log('[MOCK] Update Test:', data);
  
  // Mock update test - Node API disabled
  /*
  await postDataApi.put(`login/teacher/updateTest/${data.id}`, data)
    .then(response => {
      alert(response.data)
    })
    .catch(err => {
      if (err.response.data.test !== undefined)
        alert(err.response.data.test);
    })
  */
  
  // Mock implementation
  setTimeout(() => {
    const tests = JSON.parse(localStorage.getItem('mockTests') || '[]');
    const index = tests.findIndex(t => t._id === data.id);
    if (index !== -1) {
      tests[index] = { ...tests[index], ...data };
      localStorage.setItem('mockTests', JSON.stringify(tests));
    }
    alert('Test Updated Successfully (Mock Mode)');
  }, 300);
}

export const deleteTest = (id) => async dispatch => {
  // Mock delete test - Node API disabled
  /*
  await postDataApi.delete(`login/teacher/deleteTest/${id}`)
    .then(response => {
      alert(response.data)
      window.location.replace('/dashboard')
    })
  */
  
  // Mock implementation
  setTimeout(() => {
    const tests = JSON.parse(localStorage.getItem('mockTests') || '[]');
    const filtered = tests.filter(t => t._id !== id);
    localStorage.setItem('mockTests', JSON.stringify(filtered));
    
    alert('Test Deleted Successfully (Mock Mode)');
    window.location.replace('/dashboard');
  }, 300);

}
// Groups
export const createGroup = (groupName) => async dispatch => {
  // Mock create group - Node API disabled
  /*
  await postDataApi.post('login/teacher/createGroup', groupName)
    .then(response => {
      if (response.data === "Enter Group name")
        alert(response.data)
      else {
        alert("Group created");
        dispatch({ type: CURRENT_GROUP, payload: response.data._id })
        window.location.replace('/dashboard/group')
      }
    })
    .catch(err => {
      if (err.response.data.group !== undefined)
        alert(err.response.data.group);
    })
  */
  
  // Mock implementation
  setTimeout(() => {
    if (!groupName.group || groupName.group.trim() === '') {
      // alert("Enter Group name");
    } else {
      const mockGroupId = 'group_' + Date.now();
      const groups = JSON.parse(localStorage.getItem('mockGroups') || '[]');
      groups.push({
        _id: mockGroupId,
        name: groupName.group,
        students: [],
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('mockGroups', JSON.stringify(groups));
      
      alert("Group created (Mock Mode)");
      dispatch({ type: CURRENT_GROUP, payload: mockGroupId });
      window.location.replace('/dashboard/group');
    }
  }, 300);
}
//fetch Groups list
export const groupList = (page) => async dispatch => {
  // Mock fetch groups - Node API disabled
  /*
  const response = await postDataApi.get(`login/teacher/groupList/${page}`)
  console.log(response.data)
  dispatch({ type: GROUP_LIST, payload: response.data })
  */
  
  // Mock implementation
  const groups = JSON.parse(localStorage.getItem('mockGroups') || '[]');
  const mockResponse = {
    groups: groups,
    totalPages: Math.ceil(groups.length / 10),
    currentPage: page
  };
  console.log('[MOCK] Groups:', mockResponse);
  dispatch({ type: GROUP_LIST, payload: mockResponse });
}
//update group
export const updateGroup = (data) => async dispatch => {
  console.log('[MOCK] Update Group:', data);
  
  // Mock update group - Node API disabled
  /*
  await postDataApi.put(`login/teacher/updateGroup/${data.id}`, data)
    .then(response => {
      alert(response.data)
    })
    .catch(err => {
      if (err.response.data.group !== undefined)
        alert(err.response.data.group);
    })
  */
  
  // Mock implementation
  setTimeout(() => {
    const groups = JSON.parse(localStorage.getItem('mockGroups') || '[]');
    const index = groups.findIndex(g => g._id === data.id);
    if (index !== -1) {
      groups[index] = { ...groups[index], ...data };
      localStorage.setItem('mockGroups', JSON.stringify(groups));
    }
    alert('Group Updated Successfully (Mock Mode)');
  }, 300);
}

//delete group
export const deleteGroup = (id) => async dispatch => {
  // Mock delete group - Node API disabled
  /*
  await postDataApi.delete(`login/teacher/delGroup/${id}`)
    .then(response => {
      alert(response.data)
      window.location.replace('/dashboard')
    })
  */
  
  // Mock implementation
  setTimeout(() => {
    const groups = JSON.parse(localStorage.getItem('mockGroups') || '[]');
    const filtered = groups.filter(g => g._id !== id);
    localStorage.setItem('mockGroups', JSON.stringify(filtered));
    
    alert('Group Deleted Successfully (Mock Mode)');
    window.location.replace('/dashboard');
  }, 300);

}
//fetch student list
export const fetchStudents = (value) => async dispatch => {
  dispatch(profileLoading(true))
  console.log('[MOCK] Fetch Students - Batch:', value.batch)
  
  // Mock fetch students - Node API disabled
  /*
  await postDataApi.get(`login/teacher/fetchStudents/${value.batch}`).then(response => {
    dispatch({ type: 'FETCH_STUDENTS', payload: response.data })
    dispatch(profileLoading(false))
  })
  */
  
  // Mock implementation
  setTimeout(() => {
    const mockStudents = JSON.parse(localStorage.getItem('mockStudents') || '[]');
    const filtered = value.batch ? 
      mockStudents.filter(s => s.batch === value.batch) : 
      mockStudents;
    
    dispatch({ type: 'FETCH_STUDENTS', payload: filtered });
    dispatch(profileLoading(false));
  }, 300);


}
//Current Group
export const editGroup = (id) => {
  console.log(id)
  return { type: CURRENT_GROUP, payload: id }
}
//add Students to group
export const AddStudents = (value) => async (dispatch, getState) => {
  console.log('[MOCK] Add Students:', value)
  
  // Mock add students - Node API disabled
  /*
  await postDataApi.post(`login/teacher/addStudents/`, value)
    .then(response => {
      console.log(response.data)
    })
  */
  
  // Mock implementation
  setTimeout(() => {
    const groups = JSON.parse(localStorage.getItem('mockGroups') || '[]');
    const group = groups.find(g => g._id === value.groupId);
    if (group) {
      group.students = value.students || [];
      localStorage.setItem('mockGroups', JSON.stringify(groups));
    }
    console.log('[MOCK] Students added to group');
  }, 300);
}
//assign test
export const AssignTestApi = (value) => async (dispatch, getState) => {
  console.log('[MOCK] Assign Test:', value)
  
  // Mock assign test - Node API disabled
  /*
  await postDataApi.post(`login/teacher/assignTests/`, value)
    .then(response => {
      console.log(response.data)
      if (!response.data.resu){
        dispatch({ type: CURRENT_GROUP_TEST, payload: response.data.id })
      }
      else {
        console.log(response.data.id)
        alert('Already Assigned')
        dispatch({ type: CURRENT_GROUP_TEST, payload: response.data.id })
      }
    })
    .catch(err => {
      console.log(err)
    })
  */
  
  // Mock implementation
  setTimeout(() => {
    const assignments = JSON.parse(localStorage.getItem('mockAssignments') || '[]');
    const existing = assignments.find(a => 
      a.groupId === value.groupId && a.testId === value.testId
    );
    
    if (existing) {
      alert('Already Assigned');
      dispatch({ type: CURRENT_GROUP_TEST, payload: existing._id });
    } else {
      const newAssignment = {
        _id: 'assignment_' + Date.now(),
        groupId: value.groupId,
        testId: value.testId,
        createdAt: new Date().toISOString()
      };
      assignments.push(newAssignment);
      localStorage.setItem('mockAssignments', JSON.stringify(assignments));
      dispatch({ type: CURRENT_GROUP_TEST, payload: newAssignment._id });
    }
  }, 300);
}
//Save Settings
export const saveSettings = (data) => async (dispatch,getState) => {
  data={...data, groupAssignedTestId:getState().currentGroupTest}
  dispatch({ type: SET_SETTINGS, payload: data })
  
  // Mock save settings - Node API disabled
  /*
  await postDataApi.post('login/teacher/saveSettings', data)
    .then(response => {
      alert(response.data.message)
    })
  */
  
  // Mock implementation
  setTimeout(() => {
    const settings = JSON.parse(localStorage.getItem('mockSettings') || '{}');
    settings[data.groupAssignedTestId] = data;
    localStorage.setItem('mockSettings', JSON.stringify(settings));
    alert('Settings Saved Successfully (Mock Mode)');
  }, 300);
}

//get Settings
export const getSettings = (id) => async dispatch => {
  console.log('[MOCK] Get Settings:', id);
  
  // Mock get settings - Node API disabled
  /*
  await postDataApi.get(`login/teacher/getSettings/${id}`)
    .then(response => {
      dispatch({type:SET_SETTINGS,payload:response.data})
    })
  */
  
  // Mock implementation
  const settings = JSON.parse(localStorage.getItem('mockSettings') || '{}');
  const settingData = settings[id] || {};
  dispatch({type:SET_SETTINGS,payload:settingData});

}

//STUDENT PANEL ACTION CREATORS
export const setCurrentStudent = decoded => {
  return {
    type: SET_CURRENT_STUDENT,
    payload: decoded
  }
}

export const studentSignup = (speakerUsername) => async (dispatch, getState) => {

  var studentData = getState().student;
  
  console.log('Student Data from Redux:', studentData);
  console.log('Speaker Username:', speakerUsername);

  // Add speaker recognition username to student data
  const studentDataWithSpeaker = {
    ...studentData,
    speakerUsername: speakerUsername || null
  };
  
  console.log('[MOCK] Student Signup:', studentDataWithSpeaker);

  // Mock student signup - Node API disabled
  // NOTE: Flask voice enrollment is still active via signupSecond.js
  /*
  await postDataApi.post('signup/student', studentDataWithSpeaker)
    .then(response => {
      console.log('Signup response:', response.data)
      alert('Registration successful! You can now login with your voice.');
      localStorage.removeItem('jwtToken')
      dispatch(setCurrentStudent({}))
      window.location.replace('/login');
    })
    .catch(err => {
      console.error('Signup error:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.email || 
                          err.response?.data?.message || 
                          err.response?.data?.error ||
                          'Registration failed. Please try again.';
      alert(errorMessage);
    })
  */
  
  // Mock implementation - store student data locally
  setTimeout(() => {
    const students = JSON.parse(localStorage.getItem('mockStudents') || '[]');
    
    // Check if student already exists
    const exists = students.find(s => s.email === studentData.email);
    if (exists) {
      alert('Student with this email already exists!');
      return;
    }
    
    const newStudent = {
      _id: 'student_' + Date.now(),
      ...studentDataWithSpeaker,
      studentid: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    students.push(newStudent);
    localStorage.setItem('mockStudents', JSON.stringify(students));
    
    console.log('[MOCK] Student registered:', newStudent);
    alert('Registration successful! You can now login with your voice. (Mock Mode)');
    localStorage.removeItem('jwtToken');
    dispatch(setCurrentStudent({}));
    window.location.replace('/login');
  }, 500);

}
export const studentFace = () => async dispatch => {
  // Mock student face - Node API disabled
  /*
  await postDataApi.post('/signup/studentFace')
    .then(response => {
      if (response.data.face == "done") {
        dispatch({
          type: 'FACE_DONE',
          payload: true
        })
      }
    })
  */
  
  // Mock implementation
  setTimeout(() => {
    dispatch({
      type: 'FACE_DONE',
      payload: true
    });
  }, 300);

}

export const studentAuth = (formValues) => {
  console.log(formValues)
  return ({
    type: "STUDENT_DATA",
    payload: formValues
  })

}

export const studentLogin = () => async (dispatch, getState) => {
  var studentData = getState().student;
  
  console.log('[MOCK] Student Login:', studentData);
  
  // Mock student login - Node API disabled
  // NOTE: Flask voice authentication is still active via loginVoiceAuth.js
  /*
  await postDataApi.post('/login/student', studentData)
    .then(response => {
      const token = response.data.token;
      localStorage.setItem('jwtToken', token);
      setAuthtoken(token);
      const decoded = jwt_decode(token);
      console.log(decoded);
      dispatch(setCurrentStudent(decoded));
      alert('Login successful! Welcome back.');
    })
    .catch(err => {
      if (err.response?.data?.email === undefined)
        alert(err.response?.data?.password || 'Login failed')
      if (err.response?.data?.email !== undefined)
        alert(err.response.data.email)
      window.location.reload();
    })
  */
  
  // Mock implementation - find student in localStorage
  setTimeout(() => {
    const students = JSON.parse(localStorage.getItem('mockStudents') || '[]');
    const student = students.find(s => s.email === studentData.email);
    
    if (!student) {
      alert('Student not found. Please register first.');
      window.location.reload();
      return;
    }
    
    const mockToken = btoa(JSON.stringify({
      id: student._id,
      email: student.email,
      name: student.name,
      role: 'student',
      studentid: student.studentid,
      batch: student.batch
    }));
    
    localStorage.setItem('jwtToken', mockToken);
    setAuthtoken(mockToken);
    
    const decoded = JSON.parse(atob(mockToken));
    console.log('[MOCK] Student logged in:', decoded);
    dispatch(setCurrentStudent(decoded));
    
    alert('Login successful! Welcome back. (Mock Mode)');
  }, 500);

}
export const faceLogin = () => async dispatch => {
  // Mock face login - Node API disabled
  /*
  await postDataApi.post('/login/studentFace')
    .then(response => {
      console.log("doneee")
      if (response.data.face == "done") {
        dispatch({
          type: 'FACE_DONE',
          payload: true
        })
      }
    })
  */
  
  // Mock implementation
  setTimeout(() => {
    console.log("[MOCK] Face login done");
    dispatch({
      type: 'FACE_DONE',
      payload: true
    });
  }, 300);

}
//groups of Student
export const groupTest = () => async (dispatch, getState) => {
  const id = getState().auth.user.studentid
  console.log('[MOCK] Get student groups:', id);
  
  // Mock get student groups - Node API disabled
  /*
  const response = await postDataApi.get(`/student/groupTest/${id}`)
  dispatch({ type: GROUP_LIST, payload: response.data })
  */
  
  // Mock implementation
  const groups = JSON.parse(localStorage.getItem('mockGroups') || '[]');
  const mockResponse = { groups: groups };
  dispatch({ type: GROUP_LIST, payload: mockResponse });
}

//tests of Student
export const studentTest = () => async (dispatch, getState) => {
  const id = getState().auth.user.studentid
  console.log('[MOCK] Get student tests:', id);
  
  // Mock get student tests - Node API disabled
  /*
  const response = await postDataApi.get(`/student/groupTest/${id}`)
  dispatch({ type: GROUP_LIST, payload: response.data })
  */
  
  // Mock implementation
  const groups = JSON.parse(localStorage.getItem('mockGroups') || '[]');
  const mockResponse = { groups: groups };
  dispatch({ type: GROUP_LIST, payload: mockResponse });
}
//questions for student's test
export const quesList = (id) => async dispatch => {
  console.log('[MOCK] Get questions for test:', id);
  
  // Mock get questions - Node API disabled
  /*
  await postDataApi.get(`/student/test/${id}`)
    .then(response => {
      console.log(response.data)
      dispatch({ type: QUESTION_LIST, payload: response.data })
    }
    )
  */
  
  // Mock implementation
  const allQuestions = JSON.parse(localStorage.getItem('mockQuestions') || '[]');
  const testQuestions = allQuestions.filter(q => q.test === id);
  console.log('[MOCK] Questions:', testQuestions);
  dispatch({ type: QUESTION_LIST, payload: testQuestions });
}

//Result of students
export const result = (answers, test, score, perct) => async dispatch => {
  const data = {answers, test, score, perct }
  console.log('[MOCK] Save result:', data)
  
  // Mock save result - Node API disabled
  /*
  await postDataApi.post('/student/result', data)
    .then(response => {
      alert('saved')
    })
    .catch(err => {
      console.log(err)
    })
  */
  
  // Mock implementation
  setTimeout(() => {
    const results = JSON.parse(localStorage.getItem('mockResults') || '[]');
    results.push({
      ...data,
      _id: 'result_' + Date.now(),
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('mockResults', JSON.stringify(results));
    alert('Result Saved Successfully (Mock Mode)');
  }, 300);
}

// logout
export const logout = () => dispatch => {
  localStorage.removeItem('jwtToken')
  setAuthtoken(false)
  dispatch(setCurrentTeacher({}))
  dispatch(setCurrentStudent({}))
}