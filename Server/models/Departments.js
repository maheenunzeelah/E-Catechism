const mongoose=require('mongoose');
const Schema =mongoose.Schema

const departSchema= new mongoose.Schema({

  departName:String
    
    
    });
    
    var Department= mongoose.model("Department", departSchema);
    
    
    module.exports=Department;