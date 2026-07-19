const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newEndpoint = `
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: "Missing required fields" });

    const db = getDb();
    const docRef = db.collection("email_otps").doc(email.toLowerCase());
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(400).json({ error: "No pending OTP found" });
    }

    const data = docSnap.data();
    if (data?.otp !== otp || data?.type !== "reset") {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (data.expiresAt.toDate() < new Date()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // Verify successful, update password via Admin SDK
    const adminAuth = getAdminApp().auth();
    const userRecord = await adminAuth.getUserByEmail(email);
    
    await adminAuth.updateUser(userRecord.uid, {
      password: newPassword
    });

    // Delete OTP
    await docRef.delete();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Error resetting password:", error);
    if (error.code === 'auth/user-not-found') {
      res.status(400).json({ error: "No user found with this email" });
    } else {
      res.status(500).json({ error: "Failed to reset password" });
    }
  }
});
`;

code = code.replace('// Start if run directly or in AIS', newEndpoint + '\n// Start if run directly or in AIS');

fs.writeFileSync('server.ts', code);
