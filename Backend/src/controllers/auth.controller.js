const generateToken = require("../utils/generateToken");
const {
  createUser,
  loginUser,
} = require("../services/auth.service");
const { db } = require("../config/firebase");


const signup = async (req, res) => {
  try {

    const {
      name,
      email,
      dob,
      password,
    } = req.body;

    // Validation
    if (!name || !email || !dob || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await createUser({
      name,
      email,
      dob,
      password,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });

  } catch (error) {

    console.error("Signup Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {

    const {
      email,
      password,
    } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await loginUser(
      email,
      password
    );

    // Generate JWT
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: user,
    });

  } catch (error) {

    console.error("Login Error:", error);

    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

const getCurrentUser = async (req, res) => {

  res.status(200).json({
    success: true,
    data: req.user,
  });
};

const getProfile = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(200).json({
        success: true,
        data: {
          name: req.user.email ? req.user.email.split(".")[0] + " Admin" : "Admin",
          email: req.user.email || "",
          dob: "",
          role: "admin",
          uid: req.user.uid || req.user.id,
        },
      });
    }

    const docRef = db.collection("users").doc(req.user.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = docSnap.data();

    res.status(200).json({
      success: true,
      data: {
        name: userData.name || "",
        email: userData.email || "",
        dob: userData.dob || "",
        role: userData.role || "user",
        uid: userData.uid || "",
      },
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  signup,
  login,
  getCurrentUser,
  getProfile,
};
