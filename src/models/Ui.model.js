import mongoose from "mongoose";

const UiSchema = mongoose.Schema({
    homePageBanner  : [String],
    logo : String,
})

export const Ui = mongoose.model("Ui",UiSchema);