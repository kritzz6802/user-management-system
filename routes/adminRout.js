const express = require("express");
const admin_route = express();
const session = require('express-session');
const config = require('../config/config') ;
admin_route.use(session({secret:config.sessionSecret , resave :false, saveUninitialized: true,}));

const bodyparser = require('body-parser');
admin_route.use(bodyparser.json());
admin_route.use(bodyparser.urlencoded({extended:true}));

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

const multer =require('multer');// imges
 const path = require('path');

 const storage = multer.diskStorage({
           destination: function(req , file , cb){
            cb(null,path.join(__dirname, '../public/userImges'));// image store
           },
           filename:function(req , file , cb){
            const name = Date.now()+'-'+file.originalname; // name image
             cb(null,name);
           },
 })
 const upload = multer({storage:storage});// to uplod image

const auth = require('../middleware/adminAuth')

const adminController = require('../controllers/adminController')

admin_route.get('/' , auth.islogout ,adminController.loadLogin);
admin_route.post('/',adminController.verifyLogin);
admin_route.get('/home' , auth.islogin , adminController.loadDeshbord);
admin_route.get('/logout' , auth.islogin, adminController.logout);
admin_route.get('/forget' , auth.islogout, adminController.forgetload);
admin_route.post('/forget' , adminController.forgetVerify);
admin_route.get('/forget-password' , auth.islogout, adminController.forgetpasswordLoad);
admin_route.post('/forget-password' , adminController.resetPassword);
admin_route.get('/dashbord' ,auth.islogin , adminController.adminDashbord);
admin_route.get('/new-user',auth.islogin , adminController.newUserLoad);
admin_route.post('/new-user', upload.single('image') ,adminController.adduser);
admin_route.get('/edit-user',auth.islogin , adminController.edituserload);
admin_route.post('/edit-user',upload.single('image'), adminController.updateUser);
admin_route.get('/delete-user',adminController.deletUser);
admin_route.get('/export-excel',auth.islogin,adminController.exportUsers);
admin_route.get('/export-pdf',auth.islogin,adminController.exportUsersPDF);

admin_route.get('*' , function(req,res){
    res.redirect('/admin');
})
module.exports = admin_route;