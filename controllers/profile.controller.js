const db = require('../database')
const model = require('../models/profile.models')

const getProfileById = async (req, res) => {
  try {
    const {
      params: { id }
    } = req

    if (isNaN(id)) {
      res.status(400).json({
        status: false,
        message: 'ID must be integer'
      })

      return
    }

    const query = await model.getUserByid(id)

    res.json({
      status: true,
      message: 'Get data success',
      data: query
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Error in server'
    })
  }
}

const getAllProfile = async (req, res) => {
  const query = await model.getAllUser()
  res.json({
    status: true,
    message: 'Get data success',
    data: query
  })
}

const addNewProfile = async (req, res) => {
  try {
    // database.push(req.body);
    const { email, fullname, phoneNumber, password, profilePicture } = req.body

    // validasi input
    if (!(email && fullname && phoneNumber && password && profilePicture)) {
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
      password,
      profilePicture
    }

    const query = await model.insertUser(payload)

    res.send({
      status: true,
      message: 'Success insert data',
      data: query
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Error in server'
    })
  }
}

const editProfile = async (req, res) => {
  try {
    const {
      params: { id },
      body: { email, fullname, phoneNumber, password, profilePicture }
    } = req

    if (isNaN(id)) {
      res.status(400).json({
        status: false,
        message: 'ID must be integer'
      })

      return
    }

    const checkData = await model.getUserByid(id)

    // validasi jika id yang kita mau edit tidak ada di database
    if (!checkData.length) {
      res.status(404).json({
        status: false,
        message: 'ID not found'
      })

      return
    }

    const payload = {
      email: email ?? checkData[0].email,
      fullname: fullname ?? checkData[0].fullname,
      phoneNumber: phoneNumber ?? checkData[0].phoneNumber,
      password: password ?? checkData[0].password,
      profilePicture: profilePicture ?? checkData[0].profilePicture
    }

    const query = await model.editUser(payload, id)

    res.send({
      status: true,
      message: 'Success edit data',
      data: query
    })
  } catch (error) {
    failed(res, {
      code: 500,
      payload: error.message,
      message: 'Internal Server Error'
    })
  }
}

const deleteProfile = async (req, res) => {
  try {
    const {
      params: { id }
    } = req

    if (isNaN(id)) {
      res.status(400).json({
        status: false,
        message: 'ID must be integer'
      })

      return
    }

    const checkData = await model.getUserByid(id)

    // validasi jika id yang kita mau edit tidak ada di database
    if (!checkData.length) {
      res.status(404).json({
        status: false,
        message: 'ID not found'
      })

      return
    }

    const query = await model.deleteUser

    res.send({
      status: true,
      message: 'Success delete data',
      data: query
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Error in server'
    })
  }
}

module.exports = {
  getProfileById,
  getAllProfile,
  editProfile,
  addNewProfile,
  deleteProfile
}
