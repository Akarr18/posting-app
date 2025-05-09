const express= require('express');
const app=express();
const userModel=require('./models/user');
const postModel=require('./models/post');
const cparser= require('cookie-parser');
const bcrypt= require('bcrypt');
const jwt = require('jsonwebtoken');
const upload  = require('./config/multerconfig')
const crypto =require("crypto");
const { log } = require('console');
const path =require('path');

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));
app.use(cparser());





 app.get('/',(req,res) => {
   
    res.render('index');
 })


 

 app.post('/register', async (req,res) => {

    let{username,name,email,password,age}=req.body;

    let user= await userModel.findOne({email});
    if(user) return res.status(500).send("user already registered");
    bcrypt.genSalt(10,(err,salt)=>{
        
        bcrypt.hash(password,salt, async (err,hash)=>{
            let user= await userModel.create({
                username,
                email,
                name,
                password: hash,
                age
            })
                let token= jwt.sign({email:email,userid:user._id},"ahhh");
                res.cookie("token",token);
                res.send(user);
        })
    })
    
    
    

});
app.get("/login",function (req,res) {
    res.render('login');
})

app.post("/login",async function(req,res){
    let {email,password}=req.body;
    let user= await userModel.findOne({email})
    if(!user) return res.send("Something went wrong")
    
    bcrypt.compare(password,user.password,function(err,result){
        //console.log(result);
        if(result){ 
            let token= jwt.sign({email:email,userid:user._id},"ahhh");
                res.cookie("token",token);
            
            res.redirect("/profile");
        }
        else res.redirect('/login')
    })
})

app.get("/logout",function(req,res){
    res.cookie("token","");
    res.redirect("/login");
 })

 function islogin(req,res,next){
    if(req.cookies.token ==="")
        res.redirect("/login");
    else{
        let data= jwt.verify(req.cookies.token,"ahhh");
        req.user=data;
        next();
    }
    
 }
 app.get('/profile',islogin,async (req,res)=>{
    //console.log(req.user);
    let user= await userModel.findOne({email:req.user.email}).populate("posts");
   // user.populate("posts");
    res.render("profile",{user});
})
app.post('/post',islogin,async (req,res)=>{
    //console.log(req.user);
    let user= await userModel.findOne({email:req.user.email});
    let{content}=req.body;
    let post= await postModel.create({
        user:user._id,
        content
    })
    user.posts.push(post._id);
    await user.save(); 
    res.redirect("/profile");
})
app.get('/like/:id',islogin,async (req,res)=>{
    //console.log(req.user);
    let post= await postModel.findOne({_id:req.params.id}).populate("user");
    
    if(post.likes.indexOf(req.user.userid)=== -1){
    post.likes.push(req.user.userid)
    
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1);
    }
    await post.save();
   
    res.redirect("/profile");
})
app.get('/edit/:id',islogin,async (req,res)=>{
    //console.log(req.user);
    let post= await postModel.findOne({_id:req.params.id}).populate("user");
    
    
   
    res.render("edit",{post});
})
app.post('/update/:id',islogin,async (req,res)=>{
    //console.log(req.user);
    let post= await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content});
    
    
   
    res.redirect("/profile");
})
app.get('/profile/upload',(req,res) => {
   
    res.render('profileupload');
 })

 
 app.post('/upload',islogin, upload.single("image"),async (req,res) => {
   
    let user= await userModel.findOne({email:req.user.email});
    user.profilepic =req.file.filename;
    await user.save();
    res.redirect("/profile");
 });


 app.listen(3000);
