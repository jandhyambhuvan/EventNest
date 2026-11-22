import {Router} from 'express';import bcrypt from 'bcryptjs';import jwt from 'jsonwebtoken';import {z} from 'zod';import {User} from '../models/index.js';import {wrap} from '../utils/async.js';import {auth} from '../middleware/auth.js';
const r=Router();
const signup=z.object({name:z.string().min(2),email:z.string().email(),password:z.string().min(8),studentId:z.string().optional(),department:z.string().optional()});
r.post('/register',wrap(async(req,res)=>{const data=signup.parse(req.body);const exists=await User.findOne({email:data.email});if(exists)return res.status(409).json({message:'Email is already registered'});const user=await User.create({...data,role:'student',passwordHash:await bcrypt.hash(data.password,12)});res.status(201).json({token:jwt.sign({sub:user.id},process.env.JWT_SECRET,{expiresIn:'7d'}),user:safe(user)});}));
r.post('/login',wrap(async(req,res)=>{const {email,password,role}=req.body;const user=await User.findOne({email: String(email||'').toLowerCase()});if(!user||!user.isActive||!await bcrypt.compare(password||'',user.passwordHash)||user.role!==role)return res.status(401).json({message:'Invalid email, password, or account type'});res.json({token:jwt.sign({sub:user.id},process.env.JWT_SECRET,{expiresIn:'7d'}),user:safe(user)});}));
r.get('/me',auth,(req,res)=>res.json({user:req.user}));
function safe(u){return {_id:u.id,name:u.name,email:u.email,role:u.role,studentId:u.studentId,department:u.department,clubName:u.clubName,credits:u.credits};}
export default r;
