const mongoose = require('mongoose');


const teacherSchema = new mongoose.Schema({

firstName: String,
lastName:String,
email: String,
password: String,
role: String,
department:String

});

var Teacher= mongoose.model("Teacher", teacherSchema);


module.exports=Teacher;