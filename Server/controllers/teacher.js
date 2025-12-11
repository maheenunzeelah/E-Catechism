const jwt = require('jsonwebtoken');
const _ = require('lodash');

// Models
const Tests = require('../models/Tests');
const Questions = require('../models/Question');
const Groups = require('../models/Groups');
const StudentsInGroup = require('../models/Students_In_Group');
const GroupsAssignedTests = require('../models/Groups_Assigned_Test');
const Students = require('../models/Students');

// Utils
const isEmpty = require('../is_Empty');
const keys = require('../config/keys');

/**
 * Format date to readable string
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
const formatAMPM = (date) => {
    const month = (date.getMonth() + 1).toString();
    const dat = date.getDate().toString();
    const year = date.getFullYear().toString();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    return `${month}/${dat}/${year}  ${hours}:${minutes} ${ampm}`;
};

/**
 * Create Test Controller
 * POST /api/login/teacher/
 */
exports.postTestController = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const { testName } = req.body;

        if (!testName) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Test name is required'
            });
        }

        const decoded = jwt.verify(token, keys.secret);
        const teacherId = decoded.teacherid;

        // Check if test name already exists for this teacher
        const existingTest = await Tests.findOne({ testName, teacher: teacherId });

        if (existingTest) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Test name already exists'
            });
        }

        // Create new test
        const test = new Tests({
            ...req.body,
            teacher: teacherId
        });

        const savedTest = await test.save();

        res.status(201).json({
            success: true,
            message: 'Test created successfully',
            test: savedTest
        });

    } catch (error) {
        console.error('Create Test Error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid or expired token'
            });
        }

        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while creating the test'
        });
    }
};

/**
 * Get Tests Controller with Pagination
 * GET /api/login/teacher/tests/:page
 */
exports.getTestController = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const decoded = jwt.verify(token, keys.secret);
        
        const course = req.query.course || '';
        const page = parseInt(req.params.page) || 1;
        const testsPerPage = 5;

        // Build query
        let query = { teacher: decoded.teacherid };
        if (course.length > 0) {
            query.course = course;
        }

        // Get total count
        const totalTests = await Tests.countDocuments(query);

        // Get paginated tests
        const tests = await Tests.find(query)
            .skip((page - 1) * testsPerPage)
            .limit(testsPerPage)
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            test: tests,
            pagination: {
                currentPage: page,
                testsPerPage: testsPerPage,
                totalTests: totalTests,
                hasNextPage: page * testsPerPage < totalTests,
                nextPage: page + 1,
                previousPage: page - 1,
                hasPreviousPage: page > 1,
                lastPage: Math.ceil(totalTests / testsPerPage)
            }
        });

    } catch (error) {
        console.error('Get Tests Error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid or expired token'
            });
        }

        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while fetching tests'
        });
    }
};

/**
 * Update Test Controller
 * PUT /api/login/teacher/updateTest/:id
 */
exports.updateTestController = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const testId = req.params.id;
        const { testName } = req.body;

        const decoded = jwt.verify(token, keys.secret);
        const teacherId = decoded.teacherid;

        // Check if new test name already exists for this teacher
        if (testName) {
            const existingTest = await Tests.findOne({
                testName,
                teacher: teacherId,
                _id: { $ne: testId }
            });

            if (existingTest) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Test name already exists'
                });
            }
        }

        // Update test
        const result = await Tests.updateOne(
            { _id: testId, teacher: teacherId },
            req.body
        );

        if (result.nModified === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Test not found or no changes made'
            });
        }

        res.json({
            success: true,
            message: 'Test updated successfully'
        });

    } catch (error) {
        console.error('Update Test Error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid or expired token'
            });
        }

        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while updating the test'
        });
    }
};

/**
 * Delete Test Controller
 * DELETE /api/login/teacher/deleteTest/:id
 */
exports.deleteTestController = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const testId = req.params.id;

        const decoded = jwt.verify(token, keys.secret);
        const teacherId = decoded.teacherid;

        const result = await Tests.deleteOne({ _id: testId, teacher: teacherId });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Test not found'
            });
        }

        res.json({
            success: true,
            message: 'Test deleted successfully'
        });

    } catch (error) {
        console.error('Delete Test Error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid or expired token'
            });
        }

        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while deleting the test'
        });
    }
};

/**
 * Get Questions Controller with Pagination and Filters
 * GET /api/login/teacher/readQues/:page
 */
exports.getQuestionsController = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const decoded = jwt.verify(token, keys.secret);
        
        const page = parseInt(req.params.page) || 1;
        const questionsPerPage = 5;
        const course = req.query.course || '';
        const type = req.query.type || '';
        const search = req.query.search || '';

        // Build match criteria for test population
        let match = { teacher: decoded.teacherid };
        if (course.length > 0) {
            match.course = course;
        }

        const skip = (page - 1) * questionsPerPage;
        const limit = questionsPerPage;

        // Get questions with populated test
        let questions = await Questions.find()
            .populate({
                path: 'test',
                model: 'Tests',
                match: match
            })
            .exec();

        // Filter questions where test exists (matches criteria)
        questions = questions.filter(q => q.test);

        // Apply search filter
        if (search) {
            questions = questions.filter(q => 
                q.question.toLowerCase().includes(search.toLowerCase())
            );
        }

        const totalQuestions = questions.length;
        const paginatedQuestions = questions.slice(skip, skip + limit);

        res.json({
            success: true,
            ques: paginatedQuestions,
            pagination: {
                currentPage: page,
                questionsPerPage: questionsPerPage,
                totalQuestions: totalQuestions,
                hasNextPage: page * questionsPerPage < totalQuestions,
                nextPage: page + 1,
                previousPage: page - 1,
                hasPreviousPage: page > 1,
                lastPage: Math.ceil(totalQuestions / questionsPerPage)
            }
        });

    } catch (error) {
        console.error('Get Questions Error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid or expired token'
            });
        }

        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while fetching questions'
        });
    }
};

/**
 * Add Question Controller
 * POST /api/login/teacher/addQues
 */
exports.postQuestionController = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Question is required'
            });
        }

        const decoded = jwt.verify(token, keys.secret);

        // Check if question already exists
        const existingQuestion = await Questions.findOne({ question });

        if (existingQuestion) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Question already exists'
            });
        }

        // Create new question
        const newQuestion = new Questions({
            ...req.body,
            created_at: formatAMPM(new Date())
        });

        await newQuestion.save();

        res.status(201).json({
            success: true,
            message: 'Question saved successfully',
            question: newQuestion
        });

    } catch (error) {
        console.error('Add Question Error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid or expired token'
            });
        }

        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while saving the question'
        });
    }
};

/**
 * Update Question Controller
 * PUT /api/login/teacher/updateQues/:id
 */
exports.updateQuestionController = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const questionId = req.params.id;
        const { question, test } = req.body;

        const decoded = jwt.verify(token, keys.secret);

        // Check if updated question already exists
        if (question) {
            const existingQuestion = await Questions.findOne({
                question,
                test,
                _id: { $ne: questionId }
            });

            if (existingQuestion) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Question already exists'
                });
            }
        }

        // Update question
        const result = await Questions.updateOne({ _id: questionId }, req.body);

        if (result.nModified === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Question not found or no changes made'
            });
        }

        res.json({
            success: true,
            message: 'Question updated successfully'
        });

    } catch (error) {
        console.error('Update Question Error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid or expired token'
            });
        }

        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while updating the question'
        });
    }
};

/**
 * Delete Question Controller
 * DELETE /api/login/teacher/delQues/:id
 */
exports.deleteQuestionController = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const questionId = req.params.id;

        const decoded = jwt.verify(token, keys.secret);

        const result = await Questions.deleteOne({ _id: questionId });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Question not found'
            });
        }

        res.json({
            success: true,
            message: 'Question deleted successfully'
        });

    } catch (error) {
        console.error('Delete Question Error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid or expired token'
            });
        }

        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while deleting the question'
        });
    }
};

/**
 * Create Group Controller
 * POST /api/login/teacher/createGroup
 */
exports.createGroupController = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const { groupName } = req.body;

        if (!groupName) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Group name is required'
            });
        }

        const decoded = jwt.verify(token, keys.secret);
        const teacherId = decoded.teacherid;

        // Check if group name already exists for this teacher
        const existingGroup = await Groups.findOne({ groupName, teacher: teacherId });

        if (existingGroup) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Group name already exists'
            });
        }

        // Create new group
        const group = new Groups({
            ...req.body,
            teacher: teacherId
        });

        const savedGroup = await group.save();

        res.status(201).json({
            success: true,
            message: 'Group created successfully',
            group: savedGroup
        });

    } catch (error) {
        console.error('Create Group Error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid or expired token'
            });
        }

        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while creating the group'
        });
    }
};

/**
 * Get Students by Department and Batch
 * GET /api/login/teacher/fetchStudents/:batch
 */
exports.getStudentsByDepartController = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const batch = req.params.batch;

        const decoded = jwt.verify(token, keys.secret);
        const department = decoded.depart;

        if (isEmpty(department)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Department not found in token'
            });
        }

        const students = await Students.find({ department, batch })
            .sort('rollNo')
            .select('-password');

        res.json({
            success: true,
            students: students
        });

    } catch (error) {
        console.error('Get Students Error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid or expired token'
            });
        }

        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while fetching students'
        });
    }
};

/**
 * Get Group List with Pagination
 * GET /api/login/teacher/groupList/:page
 */
exports.getGroupListController = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const decoded = jwt.verify(token, keys.secret);
        
        const page = parseInt(req.params.page) || 1;
        const groupsPerPage = 5;

        const query = { teacher: decoded.teacherid };

        // Get total count
        const totalGroups = await Groups.countDocuments(query);

        // Get paginated groups
        const groups = await Groups.find(query)
            .skip((page - 1) * groupsPerPage)
            .limit(groupsPerPage)
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            group: groups,
            pagination: {
                currentPage: page,
                groupsPerPage: groupsPerPage,
                totalGroups: totalGroups,
                hasNextPage: page * groupsPerPage < totalGroups,
                nextPage: page + 1,
                previousPage: page - 1,
                hasPreviousPage: page > 1,
                lastPage: Math.ceil(totalGroups / groupsPerPage)
            }
        });

    } catch (error) {
        console.error('Get Groups Error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid or expired token'
            });
        }

        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while fetching groups'
        });
    }
};

/**
 * Add Students to Group
 * POST /api/login/teacher/addStudents
 */
exports.addStudentsController = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const studentsArray = req.body;

        if (!Array.isArray(studentsArray) || studentsArray.length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Students array is required'
            });
        }

        const decoded = jwt.verify(token, keys.secret);

        // Add students to group (avoid duplicates)
        const operations = studentsArray.map(async (obj) => {
            const existing = await StudentsInGroup.findOne({
                studentId: obj.studentId,
                groupId: obj.groupId
            });

            if (!existing) {
                const studentInGroup = new StudentsInGroup(obj);
                return studentInGroup.save();
            }
            return null;
        });

        await Promise.all(operations);

        res.json({
            success: true,
            message: 'Students added to group successfully'
        });

    } catch (error) {
        console.error('Add Students Error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid or expired token'
            });
        }

        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while adding students to group'
        });
    }
};

/**
 * Assign Test to Groups
 * POST /api/login/teacher/assignTests
 */
exports.assignTestController = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const assignmentsArray = req.body;

        if (!Array.isArray(assignmentsArray) || assignmentsArray.length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Assignments array is required'
            });
        }

        const decoded = jwt.verify(token, keys.secret);

        // Assign tests to groups (avoid duplicates)
        const operations = assignmentsArray.map(async (obj) => {
            const existing = await GroupsAssignedTests.findOne({
                testId: obj.testId,
                groupId: obj.groupId
            });

            if (!existing) {
                const groupAssignTest = new GroupsAssignedTests(obj);
                return groupAssignTest.save();
            }
            return null;
        });

        await Promise.all(operations);

        res.json({
            success: true,
            message: 'Tests assigned to groups successfully'
        });

    } catch (error) {
        console.error('Assign Test Error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid or expired token'
            });
        }

        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while assigning tests'
        });
    }
};
