import nodemailer from "nodemailer";

// TODO: Gmail has a 500 email/day limit. For production, consider using a service like SendGrid or Amazon SES.
// TODO: implement a queue (e.g. BullMQ + Redis) for non-blocking SMTP. Currently
//       sendMail is awaited inside the request, so slow/failing SMTP blocks the
//       response and there is no automatic retry. A queue would return to the
//       caller immediately and retry sends in a background worker.
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
})

transporter.verify((error, success) => {
    if (error) {
        console.error("Error connecting to email service:", error);
    } else {
        console.log("Email service is ready to send messages");
    }
})

export default transporter;