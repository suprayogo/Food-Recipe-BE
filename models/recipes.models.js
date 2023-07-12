const db = require('../database')

const setGetRecipesByid = async (id) => {
  try {
    const query = await db`SELECT * FROM recipes WHERE id = ${id}`
    return query
  } catch (error) {
    return error
  }
}

const SetInsertRecipes = async (payload) => {
  try {
    const query = await db`INSERT INTO recipes ${db(
            payload,
            'recipePicture',
            'title',
            'ingredients',
            'video_link'
          )} returning *`
    return query
  } catch (error) {
    return error
  }
}

const setEditRecipes = async (payload, id) => {
  try {
    const query = await db`UPDATE recipes set ${db(
            payload,
            'recipePicture',
            'title',
            'ingredients',
            'video_link'
          )} WHERE id = ${id} returning *`
    return query
  } catch (error) {
    return error
  }
}

const setDeleteRecipes = async (id) => {
  try {
    const query = await db`DELETE FROM recipes WHERE id = ${id} returning *`

    return query
  } catch (error) {
    return error
  }
}

module.exports = {
  setGetRecipesByid,
  SetInsertRecipes,
  setEditRecipes,
  setDeleteRecipes

}
