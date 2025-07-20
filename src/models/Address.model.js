import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    fullname:{
        type:String,
        required:true,

    },
    phone:String,
    PinCode:Number,
    streetAddress:String,
    city:String,
    State:String,
    landmark:String,
    isDefault:{
        type:Boolean,
        default:false,
    },
    AddressType:{
        type:String,
        enum:["Home","Work","other"],
        default:null,
        required:true

    }

},{timestamps:true})

export const Address = mongoose.model("Address",AddressSchema);