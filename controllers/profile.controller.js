const model = require("../models/profile.models");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;

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
  // database.push(req.body);
  const { email, fullname, phoneNumber, password } = req.body

    // validasi input
    if (!(email && fullname && phoneNumber && password)) {
      res.status(400).json({
        status: false,
        message: 'Bad input, please complete all of fields'
      })

      return
    }

    const payload = {
      email,
      fullname,
      phoneNumber,
      password
    }

  let query;

  bcrypt.genSalt(saltRounds, function (err, salt) {
    bcrypt.hash(password, salt, async function (err, hash) {
      // Store hash in your password DB.
      query = await model.insertUser({ ...payload, password: hash });
    });
  });

  res.send({
    status: true,
    message: "Success insert data",
    data: query,
  });
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

      const payload = {
        email: email ?? checkData[0].email,
        fullname: fullname ?? checkData[0].fullname,
        phoneNumber: phoneNumber ?? checkData[0].phoneNumber,
        password: password ?? checkData[0].password
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
};