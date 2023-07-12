const db = require('../database')

const getUserByid = async (id) => {
  try {
    const query = await db`SELECT * FROM users WHERE id = ${id}`
    return query
  } catch (error) {
    return error
  }
}

const getAllUser = async (id) => {
  try {
    const query = await db`SELECT * FROM users`
    return query
  } catch (error) {
    return error
  }
}
const insertUser = async (payload) => {
  try {
    const query = await db`INSERT INTO users ${db(
        payload,
        'email',
        'fullname',
        'phoneNumber',
        'password',
        'profilePicture'
      )} returning *`
    return query
  } catch (error) {
    return error
  }
}
const editUser = async (payload, id) => {
  try {
    const query = await db`UPDATE users set ${db(
        payload,
        'email',
        'fullname',
        'phoneNumber',
        'password',
        'profilePicture'
      )} WHERE id = ${id} returning *`
    return query
  } catch (error) {
    return error
  }
}
const deleteUser = async (id) => {
  try {
    const query = await db`DELETE FROM users WHERE id = ${id} returning *`
    return query
  } catch (error) {
    return error
  }
}

module.exports = {
  getUserByid,
  getAllUser,
  insertUser,
  editUser,
  deleteUser
}
