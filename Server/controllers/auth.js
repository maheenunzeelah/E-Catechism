const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const minio = require('minio');

// Models
const Teacher = require('../models/Teachers');
const Student = require('../models/Students');

// Config
const keys = require('../config/keys');

// MinIO Client Configuration
const minioClient = new minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'MaheenUnzeelah',
    secretKey: process.env.MINIO_SECRET_KEY || 'Cryptography'
});

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = '7d') => {
    return jwt.sign(payload, keys.secret, { expiresIn });
};

/**
 * Teacher Login Controller
 * POST /api/login
 */
exports.teacherLoginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Email and password are required'
            });
        }

        // Find teacher
        const teacher = await Teacher.findOne({ email });
        
        if (!teacher) {
            return res.status(404).json({
                error: 'Authentication Failed',
                message: 'Teacher not found with this email'
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, teacher.password);
        
        if (!isMatch) {
            return res.status(401).json({
                error: 'Authentication Failed',
                message: 'Incorrect password'
            });
        }

        // Generate token
        const token = generateToken({
            teacherid: teacher._id,
            depart: teacher.department,
            role: 'teacher'
        });

        res.json({
            success: true,
            token,
            user: {
                id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                department: teacher.department
            }
        });

    } catch (error) {
        console.error('Teacher Login Error:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred during login'
        });
    }
};

/**
 * Teacher Signup Controller
 * POST /api/signup
 */
exports.teacherSignupController = async (req, res) => {
    try {
        const { email, password, name, department } = req.body;

        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Email, password, and name are required'
            });
        }

        // Check if teacher already exists
        const existingTeacher = await Teacher.findOne({ email });
        
        if (existingTeacher) {
            return res.status(400).json({
                error: 'Registration Failed',
                message: 'Email already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new teacher
        const teacher = new Teacher({
            ...req.body,
            password: hashedPassword
        });

        await teacher.save();

        // Generate token
        const token = generateToken({
            teacherid: teacher._id,
            depart: teacher.department,
            role: 'teacher'
        });

        res.status(201).json({
            success: true,
            token,
            user: {
                id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                department: teacher.department
            }
        });

    } catch (error) {
        console.error('Teacher Signup Error:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.message
            });
        }
        
        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred during registration'
        });
    }
};

/**
 * Student Signup Controller
 * POST /api/signup/student
 */
exports.studentSignupController = async (req, res) => {
    try {
        const { email, password, name, rollNo, batch, department } = req.body;

        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Email, password, and name are required'
            });
        }

        // Check if student already exists
        const existingStudent = await Student.findOne({ email });
        
        if (existingStudent) {
            return res.status(400).json({
                error: 'Registration Failed',
                message: 'Email already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new student
        const student = new Student({
            ...req.body,
            password: hashedPassword
        });

        await student.save();

        // Generate token
        const token = generateToken({
            studentid: student._id,
            role: 'student'
        });

        res.status(201).json({
            success: true,
            token,
            id: student._id,
            user: {
                id: student._id,
                name: student.name,
                email: student.email,
                rollNo: student.rollNo,
                batch: student.batch,
                department: student.department
            }
        });

    } catch (error) {
        console.error('Student Signup Error:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.message
            });
        }
        
        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred during registration'
        });
    }
};

/**
 * Save Voice Controller - For voice authentication during signup
 * POST /api/signup/studentVoice
 */
exports.saveVoiceController = async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'No voice files uploaded'
            });
        }

        const bucketName = files[0].originalname;
        
        // Append file paths to signup voices text file
        files.forEach(file => {
            const filePath = path.join(file.originalname, file.filename) + '\n';
            fs.appendFileSync('signupVoices.txt', filePath, { flag: 'a+' });
        });

        // Check if bucket exists
        const bucketExists = await minioClient.bucketExists(bucketName);

        if (!bucketExists) {
            // Create bucket
            await minioClient.makeBucket(bucketName);
            console.log('Bucket created successfully:', bucketName);

            // Upload files to MinIO
            for (const file of files) {
                await minioClient.fPutObject(bucketName, file.filename, file.path);
            }
            console.log('Files uploaded successfully');

            // Train voice model
            const python = spawn('python', ['training_model.py']);
            
            python.stdout.on('data', (data) => {
                console.log('Python output:', data.toString());
            });

            python.stderr.on('data', (data) => {
                console.error('Python error:', data.toString());
            });

            python.on('close', (code) => {
                console.log(`Training process exited with code ${code}`);
                
                // Clear signup voices file
                fs.truncate('signupVoices.txt', 0, (err) => {
                    if (err) console.error('Error clearing signupVoices.txt:', err);
                    else console.log('Signup voices file cleared');
                });
            });
        } else {
            console.log('Bucket already exists:', bucketName);
        }

        res.json({
            success: true,
            message: 'Voice samples saved successfully'
        });

    } catch (error) {
        console.error('Save Voice Error:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred while saving voice samples'
        });
    }
};

/**
 * Student Login Controller
 * POST /api/login/student
 */
exports.studentLoginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Email and password are required'
            });
        }

        // Find student
        const student = await Student.findOne({ email });
        
        if (!student) {
            return res.status(404).json({
                error: 'Authentication Failed',
                message: 'Student not found with this email'
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, student.password);
        
        if (!isMatch) {
            return res.status(401).json({
                error: 'Authentication Failed',
                message: 'Incorrect password'
            });
        }

        // Generate token
        const token = generateToken({
            studentid: student._id,
            role: 'student'
        });

        res.json({
            success: true,
            token,
            id: student._id,
            user: {
                id: student._id,
                name: student.name,
                email: student.email,
                rollNo: student.rollNo,
                batch: student.batch,
                department: student.department
            }
        });

    } catch (error) {
        console.error('Student Login Error:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred during login'
        });
    }
};

/**
 * Student Voice Authentication Controller
 * POST /api/login/studentVoiceAuth
 */
exports.studentLoginVoiceController = async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'No voice files uploaded'
            });
        }

        const bucketName = files[0].originalname;
        const downPath = path.join(path.dirname(process.mainModule.filename), 'public', 'downloads');

        // Append file paths to login voices text file
        files.forEach(file => {
            const filePath = path.join(file.originalname, file.filename) + '\n';
            fs.appendFileSync('loginVoices.txt', filePath, { flag: 'a+' });
        });

        // Download files from MinIO for verification
        for (const file of files) {
            const stream = minioClient.extensions.listObjectsV2WithMetadata(bucketName, '', true, '');
            
            stream.on('data', (obj) => {
                const downloadPath = path.join(downPath, bucketName, obj.name);
                
                // Ensure directory exists
                fs.mkdirSync(path.dirname(downloadPath), { recursive: true });
                
                minioClient.fGetObject(bucketName, obj.name, downloadPath, (err) => {
                    if (err) {
                        console.error('Error downloading file:', err);
                        return;
                    }
                    
                    console.log('File downloaded successfully:', obj.name);
                    fs.appendFileSync('matchVoices.txt', obj.name + '\n', { flag: 'a+' });
                });
            });

            stream.on('error', (err) => {
                console.error('Stream error:', err);
            });
        }

        // TODO: Implement voice matching with Python script
        // Uncomment when ready to use
        /*
        const python = spawn('python', ['test_performance.py']);
        
        python.stdout.on('data', (data) => {
            console.log('Voice match result:', data.toString());
        });

        python.on('close', (code) => {
            fs.truncate('loginVoices.txt', 0, () => {});
        });
        */

        res.json({
            success: true,
            message: 'Voice authentication processed'
        });

    } catch (error) {
        console.error('Voice Login Error:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'An error occurred during voice authentication'
        });
    }
};
