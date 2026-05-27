require("dotenv").config();

const app = require("./app");
const { db } = require("./config/firebase");

const PORT = process.env.PORT || 5001;


// Firebase Connection Check
db.collection("test")
  .doc("connectionCheck")
  .set({
    working: true,
    timestamp: new Date(),
  })
  .then(() => {
    console.log("Firebase connected");
  })
  .catch((error) => {
    console.error("Firebase connection failed:", error);
  });


// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});