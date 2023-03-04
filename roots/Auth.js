const express = require('express') 
const router = express.Router()
const {Register, SendSecondEmail, VerifyEmail, Login} = require('../controllers/Auth')

router.post('/signup', Register)
router.post('/login', Login)
router.get('/email/:confirmationToken', VerifyEmail)


// Set up router to send email one more time  
router.post('/email/send', SendSecondEmail)


module.exports = router 