const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = new mongoose.Schema({
groupName:String,
teacher:{ type: Schema.Types.ObjectId, ref: 'Teacher' }
});
    
var Groups= mongoose.model("Groups", groupSchema);


module.exports=Groups;