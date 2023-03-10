const jwt = require('jsonwebtoken')
const {StatusCodes} = require('http-status-codes')
const AuthUser = (req, res, next) =>{
    const authHead = req.headers.authorization 
    if(!authHead) return res.status(StatusCodes.UNAUTHORIZED).json({err: 'not aauthorized'})
    const token = authHead.split(' ')[1]
    if(!token) return res.status(StatusCodes.UNAUTHORIZED).json({err: 'not aauthorized'})
    jwt.verify(token, process.env.JWT_ACCESS_KEY, (err, decoded) =>{
        if(err) return res.status(StatusCodes.UNAUTHORIZED).json({err: 'not aauthorized'}) 
        console.log('userid', decoded)
        req.userId = decoded.userId 
        next()
    })

    // try to set up unathorrized response
}

module.exports = AuthUser