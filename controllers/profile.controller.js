const model = require("../models/profile.models");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const db = require('../database')

function getToken(req) {
  const token = req?.headers?.authorization?.slice(
    7,
    req?.headers?.authorization?.length
  );

  return token;
}

const getProfileById = async (req, res) => {
  try {
    const {
      params: { id },
    } = req;

    if (isNaN(id)) {
      res.status(400).json({
        status: false,
        message: "ID must be integer",
      });

      return;
    }

    const query = await model.getUserById(id);  

    res.json({
      status: true,
      message: "Get data success",
      data: query,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error in server",
    });
  }
};


const getProfileByToken = async (req, res) => {
  try {
    jwt.verify(getToken(req), process.env.PRIVATE_KEY, async (err, decoded) => {
      // ... Token verification code ...

      // Get the user's data from the database using the user ID
      try {
        const { id } = decoded; // Extract the user ID from the decoded token payload
        const userData = await db`SELECT * FROM users WHERE id = ${id}`;
console.log(db)
        if (!userData || userData.length === 0) {
          return res.status(404).json({
            status: false,
            message: "User data not found",
          });
        }

        res.json({
          status: true,
          message: "Get data success",
          data: userData[0], // Since 'userData' is an array, access the first element
        });
      } catch (error) {
        console.error(error); // Log the specific error
        res.status(500).json({
          status: false,
          message: "Error in server",
          error: error.message, // Include the specific error message in the response
        });
      }
    });
  } catch (error) {
    console.error(error); // Log the specific error
    res.status(500).json({
      status: false,
      message: "Error in server",
      error: error.message, // Include the specific error message in the response
    });
  }
};





const getAllProfile = async function (req, res) {
  try {
    const query = await model.getAllUser();

    res.json({
      status: true,
      message: "Get data success",
      data: query,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error in server",
    });
  }
};

const addNewProfile = async function (req, res) {
  const { email, fullname, phoneNumber, password } = req.body;

  // Validation: Check if any field is missing
  if (!(email && fullname && phoneNumber && password)) {
    res.status(400).json({
      status: false,
      message: "Please fill in all fields",
    });
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.match(emailRegex)) {
    res.status(400).json({
      status: false,
      message: "Enter a correct and active email address (@)",
    });
    return;
  }

  try {
    // Check if the email already exists in the database
    const existingUser = await model.getUserByEmail(email);
    if (existingUser.length > 0) {
      res.status(400).json({
        status: false,
        message: "Email has been registered",
      });
      return;
    }

    // Validation: Check if the password meets the criteria
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!password.match(passwordRegex)) {
      res.status(400).json({
        status: false,
        message:
          "Password must be at least 8 characters with a combination of letters and numbers",
      });
      return;
    }

    // Hash the password
    bcrypt.genSalt(saltRounds, function (err, salt) {
      bcrypt.hash(password, salt, async function (err, hash) {
        // Store the hashed password in the database
        const query = await model.insertUser({ ...req.body, password: hash });
        res.send({
          status: true,
          message: "Registration is successful",
          data: query,
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error in server",
      error: error.message,
    });
  }
};

const editProfile = async function (req, res) {
  try {
    jwt.verify(getToken(req), process.env.PRIVATE_KEY, async (err, { id }) => {
      const {
        body: { email, fullname, phoneNumber, password, profilePicture },
      } = req;

      if (isNaN(id)) {
        res.status(400).json({
          status: false,
          message: "ID must be integer",
        });

        return;
      }

      const checkData = await model.getUserById(id);

      // validasi jika id yang kita mau edit tidak ada di database
      if (!checkData.length) {
        res.status(404).json({
          status: false,
          message: "ID not found",
        });

        return;
      }

      // Validation: Check if the password meets the criteria
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
      if (password && !password.match(passwordRegex)) {
        res.status(400).json({
          status: false,
          message:
            "Password must be at least 8 characters with a combination of letters and numbers",
        });
        return;
      }

      const payload = {
        email: email ?? checkData[0].email,
        fullname: fullname ?? checkData[0].fullname,
        phoneNumber: phoneNumber ?? checkData[0].phoneNumber,
        password: password ? password : checkData[0].password, // Use the new password if provided, otherwise keep the old one
      };

      let query;

      if (password) {
        bcrypt.genSalt(saltRounds, function (err, salt) {
          bcrypt.hash(password, salt, async function (err, hash) {
            // Store hash in your password DB.
            query = await model.editUser({ ...payload, password: hash }, id);
          });
        });
      } else {
        query = await model.editUser(payload, id);
      }

      res.send({
        status: true,
        message: "Success edit data",
        data: query,
      });
    });
  } catch (error) {
    console.log(error);
  }
};


const deleteProfile = async function (req, res) {
  jwt.verify(getToken(req), process.env.PRIVATE_KEY, async (err, { id }) => {
    if (isNaN(id)) {
      res.status(400).json({
        status: false,
        message: "ID must be integer",
      });

      return;
    }

    const checkData = await model.getUserById(id);

    // validasi jika id yang kita mau edit tidak ada di database
    if (!checkData.length) {
      res.status(404).json({
        status: false,
        message: "ID not found",
      });

      return;
    }

    const query = await model.deleteUser(id);

    res.send({
      status: true,
      message: "Success delete data",
      data: query,
    });
  });
};

const editPhoto = async function (req, res) {
  try {
    jwt.verify(getToken(req), process.env.PRIVATE_KEY, async (err, { id }) => {
      const { photo } = req?.files ?? {};

      if (!photo) {
        res.status(400).send({
          status: false,
          message: "Photo is required",
        });
      }

      let mimeType = photo.mimetype.split("/")[1];
      let allowFile = ["jpeg", "jpg", "png", "webp"];

      // cari apakah tipe data yang di upload terdapat salah satu dari list yang ada diatas
      if (!allowFile?.find((item) => item === mimeType)) {
        res.status(400).send({
          status: false,
          message: "Only accept jpeg, jpg, png, webp",
        });
      }

      // validate size image
      if (photo.size > 2000000) {
        res.status(400).send({
          status: false,
          message: "File to big, max size 2MB",
        });
      }

      cloudinary.config({
        cloud_name: "df9mh6l4n",
        api_key: "368677466729715",
        api_secret: "aZElKVwuvGJdPPZkOXAb-BRUk10",
      });

      const upload = cloudinary.uploader.upload(photo.tempFilePath, {
        public_id: new Date().toISOString(),
      });

      upload
        .then(async (data) => {
          const payload = {
            profilePicture: data?.secure_url,
          };

          model.editPhotoUser(payload, id);

          res.status(200).send({
            status: false,
            message: "Success upload",
            data: payload,
          });
        })
        .catch((err) => {
          res.status(400).send({
            status: false,
            message: err,
          });
        });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      status: false,
      message: "Error on server",
    });
  }
};

module.exports = {
  getProfileById,
  getAllProfile,
  addNewProfile,
  editProfile,
  deleteProfile,
  editPhoto,
  getProfileByToken,
};
