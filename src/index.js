import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from 'dotenv';

dotenv.config({
    path:"./env"
})

const port=process.env.PORT;
connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERROR",error);
    })
    app.listen(port||8000,()=>{
        console.log(`Server is running at the port ${port}`)
    });
})
.catch((err)=>{
    console.log("MONGODB Connection error : ",err)
})













// (async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGO_DB_URL}/${DB_NAME}`)
//     } catch (error) {
//         console.error("ERROR : ",error);
//         throw error;
//     }
// })()