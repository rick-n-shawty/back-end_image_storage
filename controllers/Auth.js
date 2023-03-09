const User = require('../DB/models.js/User')
const {StatusCodes} = require("http-status-codes")
const nodemailer = require('nodemailer')
const {createAccessToken, createRefreshToken, createValidationToken} = require('../tokens')
const jwt = require('jsonwebtoken')


const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'nodej116@gmail.com',
        pass: 'fedjuhtmmvgjxbyr'
    }
})
const Register = async (req, res) =>{
    const {email, password} = req.body 
    if(!email || !password) return res.status(StatusCodes.BAD_REQUEST).json({err: 'please provde all credentials'})
    try{
        const user = await User.create({email, password})
        const validationToken = createValidationToken(user._id)
        const validationUrl = `http://localhost:8080/api/v1/email/${validationToken}`
        const validationMessage = {
            to: email,
            subject: 'Verify your email',
            text: `Click on this link to verify your email: ${validationUrl}`
        }
        transport.sendMail(validationMessage)
        return res.status(StatusCodes.OK).json({msg: 'please verify your email to finish the registration'})
    }catch(err){
        console.log(err)
        return res.status(500).json({err})
    }
}


const SendSecondEmail = async (req, res) =>{
    const {userId} = req.body 
    if(!userId) return res.status(StatusCodes.BAD_REQUEST).json({err: 'bad request'})
    try{
        const user = await User.findOne({_id: userId})
        if(!user) return res.status(StatusCodes.NOT_FOUND).json({err: 'user not found'})
        const validationToken = createValidationToken(userId)
        const validationUrl = `http://localhost:5000/api/v1/email/${validationToken}`
        const validationMessage = {
            to: user.email,
            subject: 'Verify your email',
            text: `Click on this link to verify your email ${validationUrl}`
        }
        transport.sendMail(validationMessage)
        return res.status(StatusCodes.OK).json({msg: 'the link has been sent'})
    }catch(err){
        console.log(err)
        return res.status(500).json({err})
    }
}

const VerifyEmail = async (req, res) =>{
    const {confirmationToken} = req.params
    try{
        const decoded = jwt.verify(confirmationToken, process.env.JWT_VALIDATION_KEY)
        const userId = decoded.userId
        if(!userId) return res.status(StatusCodes.UNAUTHORIZED).send('<h1>failed to verify</h1>')
        const user = await User.findOneAndUpdate({_id: userId}, {isVerified: true}, {new: true})
        console.log('verify', user)
        return res.status(StatusCodes.OK).send('<h1>You verified your email, proceed to the login page please</h1>')
    }catch(err){
        console.log(err)
        return res.status(500).json({err})
    }
}


const Login = async(req, res) =>{
    const {email, password} = req.body 
    if(!email || !password) return res.status(StatusCodes.BAD_REQUEST).json({err: 'please provide all credentials'})
    try{
        const user = await User.findOne({email})
        console.log(user)
        if(!user) return res.status(StatusCodes.NOT_FOUND).json({err: 'user not found'})
        if(!user.isVerified) return res.status(StatusCodes.BAD_REQUEST).json({err: 'email is not verified'})
        const isMatch = await user.Compare(password)
        if(!isMatch) return res.status(StatusCodes.BAD_REQUEST).json({err: 'wrong password'})
        const accessToken = createAccessToken(user._id)
        const refreshToken = createRefreshToken(user._id)
        return res.status(StatusCodes.OK).json({msg: 'logged in', accessToken, refreshToken})
    }catch(err){
        console.log(err)
        return res.status(500).json({err})
    }
}

const getNewToken = (req, res) =>{
    const authHead = req.headers.authorization 
    if(!authHead) return res.status(StatusCodes.UNAUTHORIZED).json({err: 'not authorized'})
    const token = authHead.split(' ')[1]
    if(!token) return res.status(StatusCodes.UNAUTHORIZED).json({err: 'not authorized'})
    jwt.verify(token, process.env.JWT_REFRESH_KEY, (err, decoded) =>{
        if(err) return res.status(StatusCodes.BAD_REQUEST).json({err: 'not authorized'})
        const userId = decoded.userId 
        const accessToken = createAccessToken(userId)
        const refreshToken = createRefreshToken(userId)
        res.status(StatusCodes.OK).json({msg: 'authorized', accessToken, refreshToken})
    })
}



module.exports = {
    Register,
    SendSecondEmail,
    VerifyEmail,
    Login,
    getNewToken
}