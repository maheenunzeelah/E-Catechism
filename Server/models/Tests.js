const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const testSchema = new mongoose.Schema({

testName:String,
course:String,
teacher:{ type: Schema.Types.ObjectId, ref: 'Teacher' }

});

var Tests= mongoose.model("Tests", testSchema);


module.exports=Tests;