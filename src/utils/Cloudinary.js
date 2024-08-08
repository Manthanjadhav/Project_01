import fs from "fs"
import { v2 as cloudinary } from 'cloudinary';


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary=async(localFilePath)=>{
    try {
        if(!localFilePath)
        {
            return null
        }
        const response = await cloudinary.uploader
       .upload(
           localFilePath, 
           {
               resource_type:"auto"
           }
       )
       console.log("File Uploaded Successfully on Cloudinary",response.url)
       return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); //Remove the locally saved temporay file as the upload opeation failed
        console.log(error);
        return null
    }
}

export {uploadOnCloudinary}