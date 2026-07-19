const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const imports = `import nodemailer from "nodemailer";
`;
const code = `
// -----------------------------------------------------
// Nodemailer Setup
// -----------------------------------------------------
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: parseInt(process.env.MAILTRAP_PORT || "2525"),
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS
    }
  });
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

app.post("/api/auth/send-email-otp", async (req, res) => {
  try {
    const { email, type = "signup" } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const db = getDb();
    await db.collection("email_otps").doc(email.toLowerCase()).set({
      otp,
      expiresAt,
      type
    });

    const transporter = getTransporter();
    
    let subject = "Your DirectRent Verification Code";
    let text = \`Your verification code is: \${otp}\\nThis code expires in 10 minutes.\`;
    
    if (type === "reset") {
      subject = "DirectRent Password Reset Code";
      text = \`Your password reset code is: \${otp}\\nThis code expires in 10 minutes.\`;
    }

    await transporter.sendMail({
      from: process.env.MAILTRAP_FROM_EMAIL || '"DirectRent" <noreply@directrent.space>',
      to: email,
      subject,
      text
    });

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/api/auth/verify-email-otp", async (req, res) => {
  try {
    const { email, otp, type = "signup" } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

    const db = getDb();
    const docRef = db.collection("email_otps").doc(email.toLowerCase());
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(400).json({ error: "No pending OTP found" });
    }

    const data = docSnap.data();
    if (data?.otp !== otp || data?.type !== type) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (data.expiresAt.toDate() < new Date()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // Mark as verified instead of deleting immediately to allow signup to consume it
    await docRef.update({ verified: true });
    
    res.json({ success: true, message: "OTP verified" });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});
`;

let newContent = content.replace('import cors from "cors";', 'import cors from "cors";\n' + imports);
newContent = newContent.replace('// Start if run directly or in AIS', code + '\n// Start if run directly or in AIS');

fs.writeFileSync('server.ts', newContent);
