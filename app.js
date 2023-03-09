require('dotenv').config()

const express = require('express')
const app = express()
const port = process.env.PORT || 8080
const connect = require('./DB/connect')
const cors = require('cors')
const AuthRouter = require("./roots/Auth")
const PostsRouter = require('./roots/Images')
const AuthUser = require('./middleware/verify')
app.use(express.json())

app.use(cors({  
    origin: '*'
}))

app.use('/api/v1', AuthRouter)
app.use('/api/v1', AuthUser, PostsRouter)


const start = async () =>{
    try{
        await connect(process.env.MONGO_URI)
        app.listen(port, () => console.log(`server is up on port ${port}`))
    }catch(err){
        console.log(err)
    }
}
start()