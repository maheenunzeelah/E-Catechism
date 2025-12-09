const express=require('express');
const router=express.Router();
// var jwt=require('jsonwebtoken');
const student=require('../controllers/student');

router.get('/groupTest/:id',student.studentTestController)
router.get('/test/:testId',student.fetchQuestionsController)
// router.get('/tests/:page', teacher.getTestController)
// try{
      
         
//     var process=new ffmpeg( __dirname + '/public/uploads/'+'b45e28a2da0cb1a76e3b779fc0f74b78');
//     console.log(process)
//     process.then(function (audio){
//         audio.fnExtractSoundToMP3(__dirname+'/public/uploads/'+'/file.mp3',function(error,file){
//             if(!error)
//             console.log('Audio file'+file);
            
//         });
//     },function(err){
//         console.log('Error :'+ err);
//     })
    
// }
// catch(e){
//     console.log(e.code);
//     console.log(e.msg);}


module.exports=router;