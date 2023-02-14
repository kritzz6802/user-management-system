const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const config = require('../config/config');
const randormString = require('randomstring');

const securePassword = async (password) => {
    try {
        const passwordhash = await bcrypt.hash(password, 10);
        return passwordhash;
    } catch (error) {
        console.log(error.message);
    }
}
// for mail send
const sendVerifyMail = async (name, email, user_id) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 25,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword
            }
        });
        const mailOptions = {
            from: config.emailUser,
            to: email,
            subject: 'For Verification mail',
            html: `hii ${name}, please click here to <a href="http://localhost:9000/verify?id=${user_id}">verify</a> your mail.`
        }
        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                console.log(err);
            } else {
                console.log("email has been send :- ", info.response)
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}
// for reset password send mail
const sendResetPassMail = async (name, email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 25,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword
            }
        });
        const mailOptions = {
            from: config.emailUser,
            to: email,
            subject: 'For Rest Password',
            html: `hii ${name}, please click here to <a href="http://localhost:9000/forget-password?token=${token}"> Reset your password</a> .`
        }
        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                console.log(err);
            } else {
                console.log("email has been send :- ", info.response)
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}

const loadregister = async (req, res) => {
    try {
        res.render('registration')
    } catch (error) {
        console.log(error.message);
    }
}
const insertUser = async (req, res) => {
    try {
        const spassword = await securePassword(req.body.password)
        const registeruser = new User({
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mno,
            password: spassword,
            image: req.file.filename,
            is_admin: 0
        })
        const userData = await registeruser.save();
        if (userData) {
            sendVerifyMail(req.body.name, req.body.email, userData._id);
            res.render('registration', { message: "your registration has been successfully. Please verify your mail." })
        } else {
            res.render('registration', { message: "your registration has been failed" })

        }
    } catch (error) {
        console.log(error.message);
    }
}
const verifymail = async (req, res) => {
    try {
        const updateInfo = await User.updateOne({ _id: req.query.id }, { $set: { is_varified: 1 } });
        console.log(updateInfo);
        res.render("email-verified");
    } catch (error) {
        console.log(error.message);
    }
}

// login user methods started

const loginLoad = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async (req, res) => {

    try {
        const email = req.body.email;
        const password = req.body.password;
        console.log(email)
        const userData = await User.findOne({ email: email });
        if (userData) {

            const passwordmatch = await bcrypt.compare(password, userData.password);

            if (passwordmatch) {

                if (userData.is_varified === 0) {
                    res.render('login', { message: "verify email" })
                } else {
                    req.session.user_id = userData._id;
                    res.redirect('/home')
                }

            } else {
                res.render('login', { message: "incorrect details" })
            }

        } else {
            res.render('login', { message: "incorrect details" })
        }
    }
    catch (error) {
        console.log(error);
    }

}

const loadHome = async (req, res) => {
    try {
        const userData = await User.findById({ _id: req.session.user_id })
        res.render("home", { user: userData })
    } catch (error) {
        console.log(error.message);
    }
}

const userLogout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/login');
    } catch (error) {
        console.log(error.message);
    }
}
//forget password code start
const forgetLoad = async (req, res) => {
    try {
        res.render('forget')
    } catch (error) {
        console.log(error.message);
    }
}

const forgetVerify = async (req, res) => {
    try {
        const email = req.body.email;
        const userData = await User.findOne({ email: email });
        if (userData) {
            if (userData.is_varified === 0) {
                res.render('forget', { message: "Please Verify your Email" })

            } else {
                const randomString = randormString.generate();
                const updatedData = await User.updateOne({ email: email }, { $set: { token: randomString } });
                sendResetPassMail(userData.name, userData.email, randomString);
                res.render('forget', { message: "Please check your mail to reset your password." })

            }
        } else {
            res.render('forget', { message: "the email is not used" })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const forgetPassLoad = async (req, res) => {
    try {
        const token = req.query.token;
        const tokenData = await User.findOne({ token });
        if (tokenData) {
            res.render("forget-password", { user_id: tokenData._id });

        } else {
            res.render("404", { message: "Token is unvalid." });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const resetPassword = async (req, res) => {
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;

        const secure_password = await securePassword(password);
        const updatedData = await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: secure_password, token: '' } })
        res.redirect('/login')
    } catch (error) {
        console.log(error.message);
    }
}
// for verification send mail link
const verificationLoad = async (req, res) => {
    try {
        res.render('verification')
    } catch (error) {
        console.log(error.message);
    }
}

const sendVarificationLink = async (req, res) => {
    try {
        const email = req.body.email;
        const userData = await User.findOne({ email: email });
        if (userData) {
            sendVerifyMail(userData.name, userData.email, userData._id)
            res.render('verification', { message: "Reset verification mail sent your mail Id, Plese check your mail" })
        } else {
            res.render('verification', { message: "This email is not exist." })
        }
    } catch (error) {
        console.log(error.message);
    }
}
const editLoad = async (req, res, next) => {
    try {
        const id = req.query.id;
        const userData = await User.findById({ _id: id });
        if (userData) {
            res.render('edit', { user: userData });
        } else {
            res.redirect('/home');
        }
        next();
    } catch (error) {
        console.log(error.message);
    }
}

const updateProfile = async (req, res) => {
    try {
        if (req.file) {
            const userData = await User.findByIdAndUpdate({ _id: req.body.user_id }, { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mno, image: req.file.filename } });
        } else {
            const userData = await User.findByIdAndUpdate({ _id: req.body.user_id }, { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mno } });
        }
        res.redirect('/home');
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {
    loadregister,
    insertUser,
    verifymail,
    loginLoad,
    verifyLogin,
    loadHome,
    userLogout,
    forgetLoad,
    forgetVerify,
    forgetPassLoad,
    resetPassword,
    verificationLoad,
    sendVarificationLink,
    editLoad,
    updateProfile
}

