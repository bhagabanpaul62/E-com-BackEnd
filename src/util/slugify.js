import slugify from "slugify";

export const generateSlug = (text) =>
  slugify(text || "", {
    lower: true,
    strict: true,
    trim: true,
  });
