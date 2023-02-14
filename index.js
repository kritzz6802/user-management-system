const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
mongoose.connect("mongodb://127.0.0.1:27017/usm");

const express = require ('express');
const app = express();

// for user Route
const userRoute = require('./routes/userRoute');
app.use('/',userRoute)

//for admin rout
const adminRout = require('./routes/adminRout');
app.use('/admin',adminRout)

app.listen(5000,()=>{
    console.log("running")
})


