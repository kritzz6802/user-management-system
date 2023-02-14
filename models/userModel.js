const mongoose = require('mongoose');

// create schema name userSchema
const userSchema = new mongoose.Schema({
     name:{
        type : String,
        required : true
     },
     email:{
        type : String,
        required : true
     },
     mobile:{
        type : String,
        required : true
     },
     image:{
        type : String,
        required : true
     },
     password:{
        type : String,
        required : true
     },
     is_admin:{
        type : Number,
        required : true // false for users
     },
     is_varified:{
        type : Number,
        default : 0 // 1 for admin
     }, 

     token:{
        type : String,
        default : '' // 1 for admin
     }, 

    
}

)

//create model name User in schema userSchema and export that model
module.exports= mongoose.model('User',userSchema)