const router = require('express').Router()
const controller = require('../controllers/recipes.controller')
const middleware = require('../middleware/jwt.middleware')



// get data by id
router.get('/recipes/:id', controller.getRecipesById)

// get all data
router.get('/recipes', controller.getAllRecipes)


// get recipes data profile
router.get('/recipes/profile/me',middleware, controller.getProfileRecipes)



// insert data
router.post('/recipes', middleware, controller.addNewRecipes)

// edit data
router.patch('/recipes/:id', controller.editRecipes)

// edit photo recipes data
router.patch("/recipes/photo/:id",  controller.editPhoto);


// delete data
router.delete('/recipes/:id', controller.deleteRecipes)

module.exports = router
