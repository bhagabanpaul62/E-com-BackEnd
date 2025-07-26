import mongoose from "mongoose";
import { generateSlug } from "../util/slugify.js";

const AttributeSchema = new mongoose.Schema({
    name :{
        type : String,
        
    },
    values : {
        type : [String],
        
    }
})

const CategorySchema = new mongoose.Schema({
    name :{
        type:String,
        required:true,
        trim:true,
    },
    slug :{
        type:String,
        unique : true,
    },
    parentId : {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category",
        default : null
    },
    attributes : [AttributeSchema],
    image : {type : String},
    description :{ type : String},
    isFeatured : {type:Boolean , default : false}
},{timestamps : true})


export const Category = mongoose.model("Category", CategorySchema);

