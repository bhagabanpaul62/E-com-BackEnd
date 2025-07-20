import multer from "multer";

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,"./public/temp")
    },
    filename: function(req,file,cb){
        const newName = Date.now() + file.originalname
        cb(null,newName)
    }
})

export const upload = multer({
    storage,
})