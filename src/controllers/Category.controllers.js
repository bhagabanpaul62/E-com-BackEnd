import { Category } from "../models/Category.model"
import { generateSlug } from "../util/slugify";


//CREATE CATEGORY 
export const createCategory = async (req,res)=>{
    try {
        const {name,parentId,attributes,image,description,isFeatured} = req.body;
        const slug = generateSlug(name)
        const category = await Category.create({
            name,
            slug,
            parentId: parentId || null ,
            attributes,
            image,
            description,
            isFeatured,
        }) 
        res.status(200).json(category);   
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};



//GET ALL CATEGORY'S
export const getAllCategories = async (req,res)=>{
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({error:error.message});
    }
};


//GET ONE CATEGORY
export const getCategoryById = async(req,res)=>{
    try {
        const category = await Category.findById(req.params.id);
        if(!category){
            return res.status(404).json({message : "category is not found"})
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({error : error.message});
    }
}