const router = require('express').Router()
const controller = require('../controllers/recipes.controller')
const middleware = require('../middleware/jwt.middleware')



// get data by id
router.get('/recipes/:id', controller.getRecipesById)

// get all data
router.get('/recipes', controller.getAllRecipes)

// get data popular
router.get('/popular', controller.getRecipesPopular)


// get recipes data profile
router.get('/recipes/profile/me',middleware, controller.getProfileRecipes)

// insert like for recipe
router.post('/recipes/:recipeId/like', middleware, controller.toggleLikeRecipes)


// insert like-status for icon in recipe
router.get('/recipes/:recipeId/status', middleware, controller.iconLikeChange)



// insert data
router.post('/recipes', middleware, controller.addNewRecipes)

// add photo recipes data
router.post("/recipes/photo",  controller.uploadImage);


// edit data
router.patch('/recipes/:id', controller.editRecipes)

// edit photo recipes data
router.patch("/recipes/photo/:id",  controller.editPhoto);


// delete data
router.delete('/recipes/:id', controller.deleteRecipes)

module.exports = router
