


// const ffmpeg = require('fluent-ffmpeg');
const jwt = require('jsonwebtoken');
const Teacher = require("../models/Teachers");
const Student = require("../models/Students");
const bcrypt = require('bcryptjs');
var amqp = require('amqplib/callback_api');
const minio = require('minio');
const fs = require('fs');
const path = require('path');
const keys=require('../config/keys')
const { spawn } = require('child_process');

var minioClient = new minio.Client({
    endPoint: '127.0.0.1',
    port: 9000,
    useSSL: false,
    accessKey: 'MaheenUnzeelah',
    secretKey: 'Cryptography',

});

exports.teacherLoginController = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    console.log(req.body)
    console.log(email)
    Teacher.findOne({ email }).then(teacher => {
        console.log(teacher)
        if (!teacher) {
            return res.status(404).json({ email: 'Teacher not found' });
        }
        bcrypt.compare(password, teacher.password)
            .then(isMatch => {
                if (isMatch) {
                    var token = jwt.sign({ teacherid: teacher._id ,depart:teacher.department}, keys.secret);
                    console.log(token);
                    res.json({token});
                }
                else {

                    return res.status(404).json({ password: 'Password Incorrect' });
                }
            })
    })
}

exports.teacherSignupController = (req, res) => {

    var data = req.body;
    Teacher.findOne({ email: data.email })
        .then(teacher => {
            if (teacher) {
                return res.status(400).json({ email: 'Email alreday exists' });
            }
            else {
                const teacher = new Teacher(data);
                console.log(teacher._id)
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(teacher.password, salt, (err, hash) => {
                        if (err) throw err;
                        teacher.password = hash;
                        teacher.save()
                            .then(teacher => {
                                var token = jwt.sign({ teacherid: teacher._id,depart:teacher.department }, keys.secret);
                                console.log(token);
                                return res.json({token});
                            })
                    })
                })
            }

        })

        .catch((err) => {

            console.log("Error: ", err);

            res.status(500);

            res.send("Something went wrong");

        });

}






exports.studentSignupController = (req, res, next) => {

    studentData = req.body
    console.log(studentData)
    Student.findOne({ email: studentData.email })
        .then(student => {
            if (student) {
                return res.status(400).json({ email: 'Email alreday exists' });
            }
            else {
                const student = new Student(studentData);
                console.log(student)
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(student.password, salt, (err, hash) => {
                        if (err) throw err;
                        student.password = hash;
                        student.save()
                            .then(student => {
                                var token = jwt.sign({ studentid: student._id }, keys.secret);
                                console.log(token);
                                return res.json({ token, id: student._id });
                            })

                    })
                })
            }

        })

        .catch((err) => {

            console.log("Error: ", err);

            res.status(500).send("Something went wrong");

        });

}



exports.saveVoiceController = (req, res) => {

    let dataToSend
    let files = req.files
    console.log(files)

    let bucketName = files[0].originalname
    files.map(file => {
        fs.appendFile('signupVoices.txt', path.join(file.originalname, file.filename) + '\n', { 'flags': 'a+' }, (err) => {
            console.log(err)
        })
    })

    console.log(bucketName)
    // const fileStream = fs.createReadStream(path)


    minioClient.bucketExists(bucketName, (err, exists) => {
        if (err) {
            return console.log("erere", err)
        }
        if (!exists) {
            //Make a bucket called europetrip.
            new Promise((resolve, reject) => {
                minioClient.makeBucket(bucketName, function (err) {
                    if (err) reject(console.log(err))
                    console.log('Bucket created successfully ')
                    resolve();
                })
            }).then(function () {
                files.map(file => {
                    minioClient.fPutObject(bucketName, file.filename, file.path, function (err, etag) {
                        if (err) return console.log(err)

                    });
                    console.log('Files uploaded successfully.')
                })
                const python = spawn('python', ['training_model.py']);
                python.stdout.on('data', function (data) {
                    console.log('Pipe data from python script ...');
                    dataToSend = data.toString();
                });
                python.on('close', (code) => {
                    console.log(`child process close all stdio with code ${code}`);
                    // send data to browser
                    console.log(dataToSend)
                    fs.truncate("signupVoices.txt",0,function(){console.log('Signup deleted')})
                });

            })
        }
        if (exists)
            console.log("Already exists")


    }
    )




    res.send('Student Registered')




    //     amqp.connect('amqp://localhost', function(error0, connection) {
    //         console.log("runningg")
    //     if (error0) {
    //         throw error0;
    //     }
    //     connection.createChannel(function(error1, channel) {
    //         if (error1) {
    //             throw error1;
    //         }

    //         var queue = 'hello';


    //         channel.assertQueue(queue, {

    //             durable: false
    //         });
    //         channel.sendToQueue(queue, Buffer.from(JSON.stringify(file)));

    //         console.log(" [x] Sent %s", file);
    //     });
    //     setTimeout(function() {
    //         connection.close();


    //     }, 500);

    // });
}

exports.studentLoginController = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    console.log(email)
    Student.findOne({ email }).then(stud => {

        if (!stud) {
            return res.status(404).json({ email: 'Student not found' });
        }
        bcrypt.compare(password, stud.password)
            .then(isMatch => {
                if (isMatch) {
                    var token = jwt.sign({ studentid: stud._id },keys.secret);
                    console.log(token);
                    return res.json({ id: stud._id ,token});
                }
                else {

                    return res.status(404).json({ password: 'Password Incorrect' });
                }
            })
    })
}

exports.studentLoginVoiceController = (req, res) => {
    
    let files = req.files
    files.map(file => {
        fs.appendFile('loginVoices.txt', path.join(file.originalname, file.filename) + '\n', { 'flags': 'a+' }, (err) => {
            // console.log(err)
        })
    })
    const downPath = path.join(path.dirname(process.mainModule.filename), 'public', 'downloads')

    let bucketName = files[0].originalname
    console.log(bucketName)
    // const fileStream = fs.createReadStream(path)
    files.map(file => {
        var stream = minioClient.extensions.listObjectsV2WithMetadata(bucketName, '', true, '')
        stream.on('data', function (obj) {
            minioClient.fGetObject(bucketName, obj.name, path.join(downPath, bucketName, obj.name), function (err) {
                if (err) {
                    return console.log(err)
                }
                console.log('success')
                fs.appendFile('matchVoices.txt', path.join(obj.name) + '\n', { 'flags': 'a+' }, (err) => {
                    console.log(err)
                })
            })
        })
        stream.on('error', function (err) { console.log(err) })
    })
    // var dataToSend
    // const python = spawn('python', ['test_performance.py']);
    // python.stdout.on('data', function (data) {
    //     console.log('Pipe data from python script ...');
    //      dataToSend = data.toString();
    // });
    // python.on('close', (code) => {
    //     console.log(`child process close all stdio with code ${code}`);
    //     // send data to browser
    //     console.log(dataToSend)
    //     fs.truncate("loginVoices.txt",0,function(){console.log('')})
    // });
    res.send("login")

    // minioClient.bucketExists(bucketName, function (err, exists) {
    //     if (err) {
    //         return console.log("erere", err)
    //     }
    //     if (!exists) {
    //         //Make a bucket called europetrip.
    //         minioClient.makeBucket(bucketName, function (err) {
    //             if (err) return console.log(err)

    //             console.log('Bucket created successfully ')
    //         })
    //     }
    //    files.map(file=>{
    //     minioClient.fPutObject(bucketName, file.filename, file.path, function (err, etag) {
    //         if (err) return console.log(err)

    //     });

    // })

    // })
    // console.log('Files uploaded successfully.')
    // res.send('Student Registered')
}