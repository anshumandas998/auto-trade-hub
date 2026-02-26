const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const QRCode = require("qrcode");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Payment route to generate QR code
app.post("/payment", async (req, res) => {
    const { amount, currency } = req.body;
    const upiID = "anshumandas108@ibl"; // Replace with your actual UPI ID
    const upiLink = `upi://pay?pa=${upiID}&pn=CarRental&am=${amount}&cu=${currency}`;

    try {
        const qrCodeImage = await QRCode.toDataURL(upiLink);
        res.json({ qrCode: qrCodeImage });
    } catch (error) {
        res.status(500).json({ error: "QR Code generation failed" });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
