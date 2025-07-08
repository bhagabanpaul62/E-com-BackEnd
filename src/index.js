import dotenv from 'dotenv'
import connectDB from './DB/index.js';
import {app} from './app.js'

dotenv.config();

connectDB()
.then(()=>{
    app.on("error" ,(error)=>{
        console.log("ERROR",error);
        throw error
    })
    app.listen(process.env.PORT || 3000 , ()=>{
        console.log(`http://localhost:${process.env.PORT}`);
        
    })
})
.catch((err)=>{
    console.log("ERROR IN DB",err);
    
})

