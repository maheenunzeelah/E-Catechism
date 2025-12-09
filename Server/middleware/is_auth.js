var jwt = require('jsonwebtoken');

module.exports=(req,res,next)=>{
    var token = req.headers.authorization;
     console.log(token)
    if(token===undefined){
        return res.redirect('/login')
    }
    next();
}