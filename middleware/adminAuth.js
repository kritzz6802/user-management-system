const islogin = async(req,res,next)=>{

    try {
     if (req.session.user_id) {
         
     } else {
         res.redirect('/admin')
     }
     next();

    } catch (error) {
      console.log(error)
    }

}

const islogout = async(req,res,next)=>{

    try {

     if(req.session.user_id){
         res.redirect('/admin/home');
     }
     next()
    } catch (error) {
      console.log(error)
    }

}



module.exports = {
 islogin,
 islogout
}