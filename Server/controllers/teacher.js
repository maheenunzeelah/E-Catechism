const jwt = require('jsonwebtoken');
const Tests = require("../models/Tests");
const Questions = require("../models/Question");
const Groups = require("../models/Groups");
const StudentsInGroup = require("../models/Students_In_Group");
const GroupsAssignedTests=require("../models/Groups_Assigned_Test")
const Students = require("../models/Students");
const is_Empty = require('../is_Empty')
let _ = require('lodash')
const keys=require('../config/keys')

exports.postTestController = (req, res) => {
    //Token received from axios header
    var token = req.headers.authorization;

    var testName = req.body.testName;
    var data = req.body;

    try {
        var decoded = jwt.verify(token, keys.secret);
        teach = decoded.teacherid;
        //Insert teacher Id who has created test in Test table
        data.teacher = decoded.teacherid;

        //Create Test if that testName does not already exists
        Tests.find({ testName })
            .then(test => {
                var cond
                test.map(tes => {
                    cond = tes.teacher == teach
                })
                if (cond)
                    return res.status(400).json({ test: 'Test Name alreday exists' });
                else {
                    if (testName == undefined)
                        res.send("Enter Test name")
                    else {

                        const test = new Tests(data);
                        test.save()
                            .then(resolve => {
                                console.log(resolve);
                                res.send(resolve);

                            })
                            .catch((err) => {
                                res.send('Something went wrong')
                            })
                    }
                }
            })
    }
    catch (err) {
        console.log(err)
        res.status(401).send(err)
    }
}

exports.getTestController = (req, res) => {
    var token = req.headers['authorization'];
    try {
        var decoded = jwt.verify(token, keys.secret);
        const course = req.query.course;
        var query = { teacher: decoded.teacherid };
        course.length > 0 ? query = { ...query, course } : query = { ...query }
        const page = +req.params.page || 1;
        const Test_Per_Page = 5;
        let totalTests;
        Tests.find(query).countDocuments().then(numTest => {
            totalTests = numTest
            return Tests.find(query)
                .skip((page - 1) * Test_Per_Page)
                .limit(Test_Per_Page)
                .then(test => {
                    res.send({
                        test,
                        currentPage: page,
                        ques_per_page: Test_Per_Page,
                        hasNextPage: page * Test_Per_Page < totalTests,
                        nextPage: page + 1,
                        previousPage: page - 1,
                        hasPreviousPage: page > 1,
                        lastPage: Math.ceil(totalTests / Test_Per_Page)
                    })
                })


        })
    }
    catch (err) {
        res.status(401).send(err);
    }
}

exports.updateTestController = (req, res) => {
    var id = req.params.id;
    var data = req.body;
    console.log(id, data)
    var token = req.headers['authorization'];
    try {
        var decoded = jwt.verify(token, keys.secret);
        var teach = decoded.teacherid;
        var query = { testName: data.testName };
        //CHECK IF UPDATED TEST NAME ALREADY EXISTS
        Tests.find(query)
            .then(test => {
                console.log(test)
                var cond
                test.map(tes => {

                    cond = tes.teacher == teach
                    console.log(cond)
                })
                if (cond)
                    return res.status(400).json({ test: 'Test Name already exists' });
                //IF TEST NAME DOES NOT EXIST THEN CHANGE NAME    
                else {
                    Tests.updateOne({ _id: id }, data, (error, response) => {
                        if (error) {
                            console.log("Err: ", error);
                            res.send(error);
                            return;
                        }
                        console.log(response)
                        res.send("Test Updated");

                    })
                }
            }
            )
    }
    catch (err) {
        res.status(401).send(err);
    }

}

exports.deleteTestController = (req, res) => {
    var token = req.headers['authorization'];
    var id = req.params.id;
    try {
        var decoded = jwt.verify(token, keys.secret);
        console.log(decoded)
        Tests.remove({ _id: id })
            .then(resolve => {
                console.log("Delete Succesfully: ", resolve);
                res.send("Test Deleted");
            });
    }
    catch (err) {
        res.status(401).send(err);
    }
}


function formatAMPM(date) {
    let month = (date.getMonth() + 1).toString();
    let dat = (date.getDate()).toString();
    let year = (date.getFullYear()).toString();
    let hour = (date.getHours()).toString();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = month + '/' + dat + '/' + year + '  ' + hours + ':' + minutes + ' ' + ampm;
    return strTime;
}
exports.getQuestionsByTestController = (req, res) => {
    var token = req.headers['authorization'];
    const test = req.params.test
    test.length > 0 ? match = { test } : match = {}
    try {
        var decoded = jwt.verify(token, keys.secret);
        match = { ...match, teacher: decoded.teacherid }
        console.log(match)
        Questions.find().populate({
            path: 'test',
            model: 'Tests',
            match
        }).exec(function (err, ques) {

            ques = ques.filter(function (ques) {

                return ques.test; // return only questions with test matching 'testName: "test1"' query
            })
        })
    }
    catch (err) {
        res.status(401).send(err);
    }
}
exports.getQuestionsController = (req, res) => {

    var token = req.headers['authorization'];
    const page = +req.params.page || 1;
    const Quest_Per_Page = 5;
    const course = req.query.course;
    const type = req.query.type;
    const search = req.query.search;

    let match = {};
    let query = {};

    course.length > 0 ? match = { course } : match = {};
    type.length > 0 ? query = { type } : query = {};
    const skip = (page - 1) * Quest_Per_Page;
    const limit = Quest_Per_Page;
    let totalQuestions;
    try {
        var decoded = jwt.verify(token, keys.secret);
        match = { ...match, teacher: decoded.teacherid }
        console.log(match)
        Questions.find().countDocuments().then(numQues => {
            totalQuestions = numQues;
            console.log(totalQuestions)
            return Questions.find().populate({
                path: 'test',
                model: 'Tests',
                match: match
            })
                .exec(function (err, ques) {

                    ques = ques.filter(function (ques) {

                        return ques.test; // return only questions with test matching 'testName: "test1"' query
                    }).filter(qu => {
                        return qu.question.indexOf(search) != -1
                    })


                    totalQuestions = ques.length
                    if (err) return handleError(err);
                    res.send({
                        ques: ques.slice(skip, limit + skip),
                        currentPage: page,
                        ques_per_page: Quest_Per_Page,
                        hasNextPage: page * Quest_Per_Page < totalQuestions,
                        nextPage: page + 1,
                        previousPage: page - 1,
                        hasPreviousPage: page > 1,
                        lastPage: Math.ceil(totalQuestions / Quest_Per_Page)
                    });
                })
        })


    }
    catch (err) {
        res.status(401).send(err);
    }
}

exports.postQuestionController = (req, res) => {
    var token = req.headers.authorization
    var question = req.body.question;
    var data = req.body;
    console.log(data)
    try {
        var decoded = jwt.verify(token, keys.secret);
        console.log(decoded);
        Questions.findOne({ question })
            .then(quest => {
                if (quest)
                    return res.status(400).json({ ques: 'Question already exists' });
                else {
                    if (question == undefined) {
                        res.send("Enter Question")
                    }
                    else {

                        d = formatAMPM(new Date);

                        data = { ...data, created_at: d }
                        console.log(data)
                        const question = new Questions(data);
                        question.save()
                            .then(resolve => {
                                console.log(resolve);
                                res.send('Question saved');
                            })
                            .catch((err) => {
                                res.send('Something went wrong')
                            })
                    }
                }
            })
    }
    catch (err) {
        console.log(err)
        res.status(401).send(err)
    }
}

exports.deleteQuestionController = (req, res) => {
    var token = req.headers['authorization'];
    var id = req.params.id;
    console.log(id)
    try {
        var decoded = jwt.verify(token, keys.secret);
        Questions.remove({ _id: id })
            .then(resolve => {
                console.log("Delete Succesfully: ", resolve);
                res.send("Question Deleted");
            });
    }
    catch (err) {
        res.status(401).send(err);
    }
}

exports.updateQuestionController = (req, res) => {
    var id = req.params.id;
    var data = req.body;
    console.log(id, data)
    var token = req.headers['authorization'];
    try {
        var decoded = jwt.verify(token, keys.secret);
        var test = data.test;
        var query = { question: data.question };
        //CHECK IF UPDATED TEST NAME ALREADY EXISTS
        Questions.find(query)
            .then(ques => {
                console.log(ques)
                var cond
                ques.map(qu => {

                    cond = qu.test == test
                    console.log(cond)
                })
                if (cond)
                    return res.status(400).json({ question: 'Question already exists' });
                //IF QUESTION NAME DOES NOT EXIST THEN CHANGE NAME    
                else {
                    Questions.updateOne({ _id: id }, data, (error, response) => {
                        if (error) {
                            console.log("Err: ", error);
                            res.send(error);
                            return;
                        }
                        console.log(response)
                        res.send("Question Updated");

                    })
                }
            }
            )
    }
    catch (err) {
        res.status(401).send(err);
    }

}

//GROUP CONTROLLERS

exports.createGroupController = (req, res) => {
    //Token received from axios header
    var token = req.headers.authorization;

    var groupName = req.body.groupName;
    var data = req.body;

    try {
        var decoded = jwt.verify(token, keys.secret);
        teach = decoded.teacherid;
        //Insert teacher Id who has created test in Test table
        data.teacher = decoded.teacherid;

        //Create Test if that testName does not already exists
        Groups.find({ groupName })
            .then(group => {
                var cond
                group.map(grp => {
                    cond = grp.teacher == teach
                })
                if (cond)
                    return res.status(400).json({ group: 'Group Name alreday exists' });
                else {
                    if (groupName == undefined)
                        res.send("Enter Group name")
                    else {

                        const group = new Groups(data);
                        group.save()
                            .then(resolve => {
                                console.log(resolve);
                                res.send(resolve);

                            })
                            .catch((err) => {
                                res.send('Something went wrong')
                            })
                    }
                }
            })
    }
    catch (err) {
        console.log(err)
        res.status(401).send(err)
    }
}

//Fetching Student list based on their department
exports.getStudentsByDepartController = (req, res) => {
    const token = req.headers.authorization
    const batch = req.params.batch
    try {
        const decoded = jwt.verify(token, keys.secret);
        console.log(batch)
        const department = decoded.depart
        const dep = !is_Empty(department)
        dep ? (
            Students.find({ department, batch }).sort('rollNo')
                .then(student => {
                    student.map(stud => {

                        console.log(stud)
                    })
                    return res.send(student)

                })
                .catch(err => { console.log(err) })
        ) : res.send('No students found')
    }
    catch (err) {
        console.log(err)
        return res.status(401).send(err)
    }
}

//Fetching Groups List
exports.getGroupListController = (req, res) => {
    let token = req.headers['authorization']
    try {
        let decoded = jwt.verify(token,keys.secret)
        let query = { teacher: decoded.teacherid }
        const page = +req.params.page || 1;
        const Group_Per_Page = 5;
        let totalGroups;
        Groups.find(query).countDocuments().then(numGroup => {
            totalGroups = numGroup
            return Groups.find(query)
                .skip((page - 1) * Group_Per_Page)
                .limit(Group_Per_Page)
                .then(group => {
                    res.send({
                        group,
                        currentPage: page,
                        group_per_page: Group_Per_Page,
                        hasNextPage: page * Group_Per_Page < totalGroups,
                        nextPage: page + 1,
                        previousPage: page - 1,
                        hasPreviousPage: page > 1,
                        lastPage: Math.ceil(totalGroups / Group_Per_Page)
                    })
                })


        })
    }
    catch (err) {
        res.status(401).send(err);
    }
}

exports.addStudentsController = (req, res) => {
    const token = req.headers['authorization'];
    const arr = req.body

    console.log(arr)
    try {
        const decoded = jwt.verify(token, keys.secret)
        arr.map(obj => {
            StudentsInGroup.find({ studentId: obj.studentId, groupId: obj.groupId })
                .then(result => {
                    console.log(result.length === 0)
                    if (result.length === 0) {
                        const studentInGroup = new StudentsInGroup(obj);
                        studentInGroup.save()
                            .then((docs) => {
                                console.log('notfound->' + docs)
                            })
                    }
                    else {
                        console.log('found->' + result)
                    }
                }
                )
        })
        return res.send()



    }
    catch (err) {

    }
}

exports.assignTestController = (req, res) => {
    const token = req.headers['authorization'];
    const arr = req.body

    console.log(arr)
    try {
        const decoded = jwt.verify(token, keys.secret)
        arr.map(obj => {
            GroupsAssignedTests.find({ testId: obj.testId, groupId: obj.groupId })
                .then(result => {
                    console.log(result.length === 0)
                    if (result.length === 0) {
                        const groupAssignTest = new GroupsAssignedTests(obj);
                        groupAssignTest.save()
                            .then((docs) => {
                                console.log('notfound->' + docs)
                            })
                    }
                    else {
                        console.log('found->' + result)
                    }
                }
                )
        })
        return res.send()



    }
    catch (err) {

    }
}

