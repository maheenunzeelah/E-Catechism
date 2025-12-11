const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

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
 * Get Student's Assigned Tests by Groups
 * GET /api/student/groupTest/:id
 */
exports.studentTestController = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const studentId = req.params.id;

        const decoded = jwt.verify(token, keys.secret);

        // Get all groups the student belongs to
        const groupIds = await StudentsInGroup.find({ studentId })
            .distinct('groupId');

        if (!groupIds || groupIds.length === 0) {
            return res.json({
                success: true,
                message: 'No groups found for this student',
                tests: []
            });
        }

        // Get all tests assigned to these groups
        const assignedTests = await GroupsAssignedTests.find({
            groupId: { $in: groupIds }
        })
        .select('-_id')
        .populate('testId', 'testName course duration totalMarks')
        .populate('groupId', 'groupName')
        .exec();

        // Group tests by group
        const groupedTests = [];
        
        assignedTests.forEach(assignment => {
            if (!assignment.testId || !assignment.groupId) return;

            // Find if group already exists in result
            const existingGroupIndex = groupedTests.findIndex(
                item => item.groupId.groupName === assignment.groupId.groupName
            );

            if (existingGroupIndex !== -1) {
                // Add test to existing group
                groupedTests[existingGroupIndex].testId.push(assignment.testId);
            } else {
                // Create new group entry
                groupedTests.push({
                    groupId: assignment.groupId,
                    testId: [assignment.testId]
                });
            }
        });

        res.json({
            success: true,
            tests: groupedTests,
            totalGroups: groupedTests.length
        });

    } catch (error) {
        console.error('Get Student Tests Error:', error);
        
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
 * Fetch Questions for a Specific Test
 * GET /api/student/test/:testId
 */
exports.fetchQuestionsController = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const testId = req.params.testId;

        if (!testId) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Test ID is required'
            });
        }

        const decoded = jwt.verify(token, keys.secret);

        // Verify test exists
        const test = await Tests.findById(testId);
        
        if (!test) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Test not found'
            });
        }

        // Get all questions for this test
        const questions = await Questions.find({ test: testId })
            .select('-__v')
            .sort({ createdAt: 1 });

        res.json({
            success: true,
            test: {
                id: test._id,
                testName: test.testName,
                course: test.course,
                duration: test.duration,
                totalMarks: test.totalMarks
            },
            questions: questions,
            totalQuestions: questions.length
        });

    } catch (error) {
        console.error('Fetch Questions Error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid or expired token'
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid test ID format'
            });
        }

        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while fetching questions'
        });
    }
};

/**
 * Get Student Profile
 * GET /api/student/profile/:id
 */
exports.getStudentProfile = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const studentId = req.params.id;

        const decoded = jwt.verify(token, keys.secret);

        // Verify the student is requesting their own profile
        if (decoded.studentid !== studentId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only access your own profile'
            });
        }

        const student = await Students.findById(studentId)
            .select('-password -__v');

        if (!student) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Student not found'
            });
        }

        res.json({
            success: true,
            student: student
        });

    } catch (error) {
        console.error('Get Student Profile Error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid or expired token'
            });
        }

        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while fetching profile'
        });
    }
};

/**
 * Get Student's Groups
 * GET /api/student/groups/:id
 */
exports.getStudentGroups = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const studentId = req.params.id;

        const decoded = jwt.verify(token, keys.secret);

        const groups = await StudentsInGroup.find({ studentId })
            .populate('groupId', 'groupName department batch')
            .select('-_id -studentId');

        res.json({
            success: true,
            groups: groups.map(g => g.groupId),
            totalGroups: groups.length
        });

    } catch (error) {
        console.error('Get Student Groups Error:', error);
        
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

module.exports = exports;
