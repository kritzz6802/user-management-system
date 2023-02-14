const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const randormString = require('randomstring');
const nodemailer = require('nodemailer');
const config = require('../config/config');
const exceljs = require('exceljs')

//html to pdf generate
const ejs = require('ejs');
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');
const { response } = require('../routes/adminRout');

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash
    }
    catch (error) {
        console.log(error)
    }
}

const sendResetPassMail = async (name, email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmass.co',
            port: 25,
            secure: false,
            requireTLS: false,
            rejectUnauthorized: false,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword
            }
        });

        const mailOptions = {
            from: 'config.emailUser',
            to: email,
            subject: 'verifaction',
            html: `hii ${name},lollllll... please click here to <a href="http://localhost:3000/admin/forget-password?token=${token}"> Reset your password</a> .`
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

const addusermail = async (name, email, password, user_id) => {

    try {

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmass.co',
            port: 25,
            secure: false,
            requireTLS: false,
            rejectUnauthorized: false,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword
            }
        });


        const mailOptions = {
            from: 'config.emailUser',
            to: email,
            subject: 'Admin added you with verifaction',
            html: `hii ${name}, please click here to <a href="http://localhost:3000/verify?id=${user_id}">verify</a> your mail .ie ${email}.. <br> password : ${password}.`
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log("sent", info.response)
            }
        })

    } catch (error) {
        console.log(error)
    }

}


const loadLogin = async (req, res) => {
    try {
        res.render("login");
    } catch (error) {
        console.log(error);
    }
}

const verifyLogin = async (req, res) => {

    try {

        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });
        if (userData) {

            const passwordmatch = await bcrypt.compare(password, userData.password);

            if (passwordmatch) {

                if (userData.is_varified === 0) {
                    res.render('login', { message: "verify email" })
                } else {
                    req.session.user_id = userData._id;
                    res.redirect('/admin/home')
                }

            } else {
                res.render('login', { message: "incorrect details of password" })
            }

        } else {
            res.render('login', { message: "incorrect details of email" })
        }

    }
    catch (error) {
        console.log(error)
    }

}

const loadDeshbord = async (req, res) => {
    try {
        const userData = await User.findById({ _id: req.session.user_id })
        res.render('home', { admin: userData })
    } catch (error) {
        console.log(error)
    }
}

const logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/admin');

    } catch (error) {
        console.log(error)
    }
}

const forgetload = async (req, res, next) => {
    try {
        res.render('forget')
    } catch (error) {
        console.log(error)
    }
}


const forgetVerify = async (req, res) => {
    try {
        const email = req.body.email;
        const userData = await User.findOne({ email: email });
        if (userData) {
            if (userData.is_admin === 0) {
                res.render('forget', { message: "Email are inncorrects" });
            } else {
                const randomstring = randormString.generate();
                const updatedData = await User.updateOne({ email: email }, { $set: { token: randomstring } });
                sendResetPassMail(userData.name, userData.email, randomstring);
                res.render('forget', { message: "Please check your mail to reset your password." })
            }
        } else {
            res.render('forget', { message: "Email are inncorrects" });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const forgetpasswordLoad = async (req, res) => {
    try {
        const token = req.query.token;
        const tokenData = await User.findOne({ token });
        console.log(tokenData)
        console.log(token)
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

        const securePass = await securePassword(password);

        const updatedData = await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: securePass, token: " " } });
        res.redirect('/admin');

    } catch (error) {
        console.log(error.message);
    }
}

const adminDashbord = async (req, res) => {

    try {
        var search = '';
        if (req.query.search) {
            search = req.query.search
        }

        var page = 1;
        if (req.query.page) {
            page = req.query.page
        }
        const limits = 2;

        const usersData = await User.find({
            is_admin: 0,
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
                { email: { $regex: '.*' + search + '.*', $options: 'i' } },
                { mobile: { $regex: '.*' + search + '.*', $options: 'i' } },
            ]
        }).limit(limits * 1).skip((page - 1) * limits).exec();

        const count = await User.find({
            is_admin: 0,
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
                { email: { $regex: '.*' + search + '.*', $options: 'i' } },
                { mobile: { $regex: '.*' + search + '.*', $options: 'i' } },
            ]
        }).countDocuments();
        res.render('dashbord', {
            users: usersData,
            totalpages: Math.ceil(count / limits),
            currentpage: page,
            previous: page - 1,
        });
    }
    catch (error) {
        console.log(error)
    }

}


// Add new user
const newUserLoad = async (req, res) => {
    try {
        res.render('new-user')
    } catch (error) {
        console.log(error)
    }
}

const adduser = async (req, res) => {
    try {
        const name = req.body.name;
        const email = req.body.email;
        const mno = req.body.mno;
        const image = req.file.filename;
        const password = randormString.generate(8);
        const Spassword = await securePassword(password)

        const user = new User({
            name: name,
            email: email,
            mobile: mno,
            image: image,
            password: Spassword,
            is_admin: 0
        })
        const userData = await user.save();

        if (userData) {
            addusermail(name, email, password, userData._id)
            res.redirect('/admin/dashbord')
        }
        else {
            res.render('new-user', { message: 'something gone wrong' });
        }

    } catch (error) {
        console.log(error)
    }
}

const edituserload = async (req, res) => {

    try {
        const id = req.query.id;
        const userData = await User.findById({ _id: id });
        if (userData) {
            res.render('edit-user', { user: userData });
        } else {
            res.redirect('/admin/dashbord')
        }

    } catch (error) {
        console.log(error)
    }

}

const updateUser = async (req, res) => {
    //   try {
    //     // const id = (req.params.id).trim();
    //     //Actually the Id you are fetching have whitespaces in it so adding trim() to your id will work
    //     const userData = await User.findByIdAndUpdate({ _id: req.body.id .trim()}, { $set: {
    //         name: req.body.name,
    //         email: req.body.email,
    //         mobile: req.body.mno,
    //         is_varified: req.body.verify
    //     } });
    //     res.redirect('/admin/dashbord')
    //   } catch (error) {
    //     console.log(error)
    //   }
    try {
        if (req.file) {
            const userData = await User.findByIdAndUpdate({ _id: req.body.user_id }, { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mno, image: req.file.filename, is_varified: req.body.verify } });
        } else {
            const userData = await User.findByIdAndUpdate({ _id: req.body.user_id }, { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mno, is_varified: req.body.verify } });
        }
        res.redirect('/admin/dashbord');

    } catch (error) {
        console.log(error.message)
    }
}

//delete user

const deletUser = async (req, res) => {
    try {
        const id = req.query.id;
        await User.deleteOne({ _id: id });
        res.redirect('/admin/dashbord')

    } catch (error) {
        console.log(error)
    }
}

//export users

const exportUsers = async (req, res) => {
    try {

        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('My users');

        worksheet.columns = [
            { header: "s no", key: "s_no" },
            { header: "Name", key: "name" },
            { header: "E-mail", key: "email" },
            { header: "Mobile", key: "mobile" },
            { header: "Image", key: "image" },
            { header: "Is Admin", key: "is_admin" },
            { header: "Is Varified", key: "is_varified" },
        ];

        let counter = 1;
        const userData = await User.find({ is_admin: 0 })

        userData.forEach((user) => {
            user.s_no = counter;
            worksheet.addRow(user);
            counter++;
        })
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
        });
        res.setHeader("Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheatml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=users.xlsx`);
        return workbook.xlsx.write(res).then(() => {
            res.status(200)
        });

    } catch (error) {
        console.log(error)
    }
}

const exportUsersPDF = async (req, res) => {
    try {
        const users = await User.find({ is_admin: 0 });
        const data = {
            users: users
        }

        const filePathName = path.resolve(__dirname, '../views/admin/htmltopdf.ejs');
        const htmlString = fs.readFileSync(filePathName).toString();

        let options = {
            format: 'Letter'
        }

        const ejsData = ejs.render(htmlString, data);
        pdf.create(ejsData, options).toFile('users.pdf', (err, response) => {
            if (err) console.log(err);

            console.log("file generated")
        });
    }
    catch (error) {
        console.log(error)
    }
}

module.exports = {
    loadLogin,
    verifyLogin,
    loadDeshbord,
    logout,
    forgetload,
    forgetVerify,
    forgetpasswordLoad,
    resetPassword,
    adminDashbord,
    newUserLoad,
    adduser,
    edituserload,
    updateUser,
    deletUser,
    exportUsers,
    exportUsersPDF
}