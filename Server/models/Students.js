const mongoose = require('mongoose');
const Schema=mongoose.Schema

const studentSchema = new mongoose.Schema({

firstName: String,
lastName:String,
email: String,
password: String,
role: String,
batch:String,
rollNo:Number,
department:String

});

var Student= mongoose.model("Student", studentSchema);


module.exports=Student;