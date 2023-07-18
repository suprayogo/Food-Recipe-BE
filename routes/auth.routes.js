const router = require('express').Router()
const controller = require('../controllers/auth.controller')
const controllers = require('../controllers/profile.controller')

// get data by id
router.post('/auth/login', controller.loginUser)


// insert data
router.post('/auth/register', controllers.addNewProfile)

module.exports = router
