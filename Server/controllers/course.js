const jwt = require('jsonwebtoken');

// Models
const Tests = require('../models/Tests');
const Questions = require('../models/Question');

// Config
const keys = require('../config/keys');

/**
 * Get Course List and Question Types
 * GET /api/login/teacher/test/course
 */
exports.getCourseList = async (req, res) => {
    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'No authorization token provided'
            });
        }

        const decoded = jwt.verify(token, keys.secret);

        // Get distinct courses for this teacher
        const courses = await Tests.find({ teacher: decoded.teacherid })
            .distinct('course');

        // Get distinct question types
        const questionTypes = await Questions.find()
            .distinct('type');

        res.json({
            success: true,
            course: courses || [],
            quesType: questionTypes || []
        });

    } catch (error) {
        console.error('Get Course List Error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid or expired token'
            });
        }

        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while fetching course list'
        });
    }
};

/**
 * Get All Available Courses (Public)
 * GET /api/courses
 */
exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Tests.find()
            .distinct('course');

        res.json({
            success: true,
            courses: courses || []
        });

    } catch (error) {
        console.error('Get All Courses Error:', error);
        
        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while fetching courses'
        });
    }
};

module.exports = exports;
