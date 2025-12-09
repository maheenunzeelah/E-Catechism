const express = require('express');
const app=express();
const mongoose=require('mongoose');
const config=require('./config/keys');
const authRoutes=require('./routes/auth')
const bodyParser = require('body-parser');
const path=require('path')
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname,'training_model.py')))
app.use(express.static(path.join(__dirname,'public','uploads')))

app.use(bodyParser.json());

mongoose.connect(config.url, { useNewUrlParser: true });

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {

    console.log("DB Connected");

    // we're connected!

});
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers',"X-PINGOTHER, Content-Type, authorization");
    res.setHeader('Access-Control-Allow-Methods',"POST, GET, DELETE, PUT");
    
    next();
  });

app.use(authRoutes);

app.use('**', (req, res) => { res.status('404').send('<h1>PageNotFound</h1>') });
if(process.env.NODE_ENV=="production"){
    app.get('https://dashboard.heroku.com/apps/e-catechism')
}
app.listen(config.serverport, () => { console.log('Running') });