require('dotenv').config()
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const createRandomName = (bytes = 32) =>{
    return crypto.randomBytes(bytes).toString('hex')
}

const createAccessToken = (userId) =>{
    return jwt.sign({userId}, process.env.JWT_ACCESS_KEY, {expiresIn: process.env.JWT_ACCESS_LIFETIME})
}
const createRefreshToken = (userId) =>{
    return jwt.sign({userId}, process.env.JWT_REFRESH_KEY, {expiresIn: process.env.JWT_REFRESH_LIFETIME})
}

const createValidationToken = (userId) =>{
    return jwt.sign({userId}, process.env.JWT_VALIDATION_KEY, {expiresIn: process.env.JWT_VALIDATION_LIFETIME})
}


module.exports = {
    createAccessToken,
    createRefreshToken,
    createValidationToken,
    createRandomName
}