const express=require('express')
const mysql=require('mysql')
const cors=require('cors')
port=8000

const app=express()
app.use(cors())
app.use(express.json()) 

// const db = mysql.createConnection({
//     host:"localhost",
//     user:'root',
//     password:'',
//     database:'testemwork'

// })

app.get('/urls', (req, res) => {
 const url = req.query.url
})

app.listen(port,()=>{
    console.log("listening "+port)
})