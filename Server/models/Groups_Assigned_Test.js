const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupAssignedTestSchema = new mongoose.Schema({
    groupId:{ type: Schema.Types.ObjectId, ref: 'Groups' },
    testId:[{ type: Schema.Types.ObjectId, ref: 'Tests' }],
});
    
var GroupAssignedTest= mongoose.model("GroupAssignedTest", groupAssignedTestSchema);


module.exports=GroupAssignedTest;