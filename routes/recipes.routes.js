const router = require('express').Router()
const controller = require('../controllers/recipes.controller')
const middleware = require('../middleware/jwt.middleware')



// get data by id
router.get('/recipes/:id', controller.getRecipesById)

// get all data
router.get('/recipes', controller.getAllRecipes)

// get all data
router.get('/category', controller.getCategoryRecipes)



// get data popular
router.get('/popular', controller.getRecipesPopular)


// get recipes data profile
router.get('/recipes/profile/me',middleware, controller.getProfileRecipes)

// get recipes like data profile
router.get('/recipes/profile/like',middleware, controller.getLikedRecipes)



// insert like-status for icon in recipe
router.get('/recipes/:recipeId/status', middleware, controller.iconLikeChange)


// get comment recipes
router.get('/recipes/:recipeId/comment',  controller.getCommentRecipes)

// insert comment recipes
router.post('/recipes/:recipeId/comment', middleware, controller.insertCommentRecipes,
)



// insert like for recipe
router.post('/recipes/:recipeId/like', middleware, controller.toggleLikeRecipes)




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
