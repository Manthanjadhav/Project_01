import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";

const generateAccessandRefreshToken=async(userId)=>{
    try {
        const user= await User.findById(userId);
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"Error while generating Access and Refresh Tokens")
    }
}

const registerUser=asyncHandler(async(req,res)=>{
    const {username,fullname,email,password}=req.body;
    if([username,fullname,email,password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"All fields are required");
    }

    const existedUser=await User.findOne({
        $or:[{ username },{ email }]
    })

    if(existedUser)
    {
        throw new ApiError(409,"User with email or username already exists.")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
    {
        coverImageLocalPath=req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(409,"Avatar file is required")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar)
    {
        throw new ApiError(409,"Avatar file is required")
    }

    const user=await User.create({
        username:username.toLowerCase(),
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        email,
        password,
    })

    const createdUser=await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser)
    {
        throw new ApiError(500,"Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully")
    )
})

const loginUser=asyncHandler(async(req,res)=>{
    /* 1)get data from the frontend (i.e req.body)
        2)username or email
        3)find the user
        4)check the password
        5)acess and refresh token
        6)send cookie
     */

    const {username,email,password}=req.body;
    if(!username && !email)
    {
        throw new ApiError(400,"username or email is required")
    }

    const user=await User.findOne({
        $or:[{email},{username}]
    })

    if(!user)
    {
        throw new ApiError(404,"User does not exists")
    }

    const isPasswordValid=await user.isPasswordCorrect(password);
    if(!isPasswordValid)
    {
        throw new ApiError(401,"Invalid user credentials")
    }

    const {accessToken,refreshToken}=await generateAccessandRefreshToken(user._id);

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken");

    const options={
        httpOnly:true,
        secure:false
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,
                accessToken,
                refreshToken
            },
            "User LoggedIn Successfully"
        )
    )
})

const logoutUser =asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined,
            }
        },
        {
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged out"))
})
export {registerUser,loginUser,logoutUser}