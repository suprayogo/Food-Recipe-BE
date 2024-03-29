const db = require("../database"); // directory kita

const getUserById = async (id) => {
  try {
    const query = await db`SELECT * FROM users WHERE id = ${id}`;

    return query;
  } catch (error) {
    return error;
  }
};

const getUserByEmail = async (email) => {
  try {
    const query =
      await db`SELECT * FROM users WHERE LOWER(email) = LOWER(${email})`;

    return query;
  } catch (error) {
    return error;
  }
};

const getAllUser = async () => {
  try {
    const query = await db`SELECT * FROM users`;

    return query;
  } catch (error) {
    return error;
  }
};

const insertUser = async (payload) => {
  try {
    const query = await db`INSERT INTO users ${db(
      payload,
      "email",
      "fullname",
      "phoneNumber",
      "password"
    )} returning *`;

    return query;
  } catch (error) {
    return error;
  }
};

const editUser = async (payload, id) => {
  try {
    const query = await db`UPDATE users set ${db(
      payload,
      "email",
      "fullname",
      "phoneNumber",
      "password"
    )} WHERE id = ${id} returning *`;

    return query;
  } catch (error) {
    return error;
  }
};

const editPhotoUser = async (payload, id) => {
  try {
    const query = await db`UPDATE users set ${db(
      payload,
      "profilePicture"
    )} WHERE id = ${id} returning *`;

    return query;
  } catch (error) {
    return error;
  }
};

const deleteUser = async (id) => {
  try {
    const query = await db`DELETE FROM users WHERE id = ${id} returning *`;

    return query;
  } catch (error) {
    return error;
  }
};

module.exports = {
  getUserById,
  getAllUser,
  insertUser,
  editUser,
  deleteUser,
  getUserByEmail,
  editPhotoUser,
};