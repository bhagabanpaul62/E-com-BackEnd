import nodemailer from "nodemailer"
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
    host:process.env.SMTP_HOST,
    port:Number(process.env.SMTP_PORT),
    secure:false,
    auth:{
        user:process.env.SMTP_USER,
        pass:process.env.SMTP_PASS,
    }
});




export const sendEmail = async(to,subject,html)=>{
    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      text:html.replace(/<[^>]*>?/gm,'')

    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("email send successful");
        return info;
        
    }catch (err){
        console.error("email send fail",err)
        return err;
    }
}
