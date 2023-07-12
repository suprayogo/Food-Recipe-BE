const router = require('express').Router()
const controller = require('../controllers/recipes.controller')

// get data by id
router.get('/recipes/:id', controller.getRecipesById)

// get all data
router.get('/recipes', controller.getAllRecipes)

// insert data
router.post('/recipes', controller.addNewRecipes)

// edit data
router.patch('/recipes/:id', controller.editRecipes)

// delete data
router.delete('/recipes/:id', controller.deleteRecipes)

module.exports = router
