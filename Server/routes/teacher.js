

const express = require("express");
const router = express.Router();
const teacher = require('../controllers/teacher')
const course = require('../controllers/course')



//TEST CREATEION API 
router.post('/', teacher.postTestController)

//GET API FOR SENDING TEST DATA TO CLIENT
router.get('/tests/:page', teacher.getTestController)

//UPDATE TEST CREATED
router.put('/updateTest/:id', teacher.updateTestController)

//DELETING TEST
router.delete('/deleteTest/:id', teacher.deleteTestController)

//COURSES VALUE
router.get('/test/course', course.getCourseList)

// FOR QUESTIONS

//GET API FOR SENDING QUESTIONS DATA TO CLIENT
router.get('/readQues/:page', teacher.getQuestionsController)

// ADDING QUESTIONS IN CREATED TEST API
router.post('/addQues', teacher.postQuestionController)

//UPDATE QUESTION CREATED
router.put('/updateQues/:id', teacher.updateQuestionController)

// DELETING QUESTIONS FROM CREATED TEST API
router.delete('/delQues/:id', teacher.deleteQuestionController)

//FOR GROUPS

//POST API FOR CREATING GROUPS
router.post('/createGroup',teacher.createGroupController)

//FETCHING STUDENTS
router.get('/fetchStudents/:batch',teacher.getStudentsByDepartController)

//GROUP LISTS
router.get('/groupList/:page',teacher.getGroupListController)

//ADD STUDENTS IN GROUP
router.post('/addStudents',teacher.addStudentsController)

//ASSIGN TEST
router.post('/assignTests',teacher.assignTestController)

module.exports = router;