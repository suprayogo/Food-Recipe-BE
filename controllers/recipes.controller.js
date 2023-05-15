const db = require("../database");

const getRecipesById = async (req, res) => {
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

    const query = await db`SELECT * FROM recipes WHERE id = ${id}`;

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

const getAllRecipes = async (req, res) => {
  try {
    let query;
    let keyword = `%${req?.query?.keyword}%`;
    let sort = db`DESC`;
    let isPaginate =
      req?.query?.pages &&
      !isNaN(req?.query?.pages) &&
      parseInt(req?.query?.pages) >= 1;

    if (req?.query?.sortType?.toLowerCase() === "asc") {
      if (isPaginate) {
        sort = db`ASC LIMIT 10 OFFSET ${
          10 * (parseInt(req?.query?.pages) - 1)
        }`;
      } else {
        sort = db`ASC`;
      }
    }

    if (isPaginate && !req?.query?.sortType) {
      sort = db`DESC LIMIT 10 OFFSET ${10 * (parseInt(req?.query?.pages) - 1)}`;
    }

    if (req?.query?.keyword) {
      query =
        await db`SELECT *, count(*) OVER() AS full_count FROM recipes WHERE LOWER(recipes.title) LIKE LOWER(${keyword}) ORDER BY id ${sort}`;
    } else {
      query =
        await db`SELECT *, count(*) OVER() AS full_count FROM recipes ORDER BY id ${sort}`;
    }

    res.json({
      status: query?.length ? true : false,
      message: query?.length ? "Get data success" : "Data not found",
      total: query?.length ?? 0,
      pages: isPaginate
        ? {
            current: parseInt(req?.query?.pages),
            total: query?.[0]?.full_count
              ? Math.ceil(parseInt(query?.[0]?.full_count) / 10)
              : 0,
          }
        : null,
      data: query?.map((item) => {
        delete item.full_count;
        return item;
      }),
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error in server",
    });
  }
};

const addNewRecipes = async (req, res) => {
  try {
    // database.push(req.body);
    const { recipePicture, title, ingredients, video_link } = req.body;

    // validasi input
    if (!(recipePicture && title && ingredients && video_link)) {
      res.status(400).json({
        status: false,
        message: "Bad input, please complete all of fields",
      });

      return;
    }

    const payload = {
      recipePicture,
      title,
      ingredients,
      video_link,
    };

    const query = await db`INSERT INTO recipes ${db(
      payload,
      "recipePicture",
      "title",
      "ingredients",
      "video_link"
    )} returning *`;

    res.send({
      status: true,
      message: "Success insert data",
      data: query,
    });
  } catch (error) {
    failed(res, {
      code: 500,
      payload: error.message,
      message: "Internal Server Error",
    });
  }
};

const editRecipes = async (req, res) => {
  try {
    const {
      params: { id },
      body: { recipePicture, title, ingredients, video_link },
    } = req;

    if (isNaN(id)) {
      res.status(400).json({
        status: false,
        message: "ID must be integer",
      });

      return;
    }

    const checkData = await db`SELECT * FROM recipes WHERE id = ${id}`;

    // validasi jika id yang kita mau edit tidak ada di database
    if (!checkData.length) {
      res.status(404).json({
        status: false,
        message: "ID not found",
      });

      return;
    }

    const payload = {
      recipePicture: recipePicture ?? checkData[0].recipePicture,
      title: title ?? checkData[0].title,
      ingredients: ingredients ?? checkData[0].ingredients,
      video_link: video_link ?? checkData[0].video_link,
    };

    const query = await db`UPDATE recipes set ${db(
      payload,
      "recipePicture",
      "title",
      "ingredients",
      "video_link"
    )} WHERE id = ${id} returning *`;

    res.send({
      status: true,
      message: "Success edit data",
      data: query,
    });
  } catch (error) {
    failed(res, {
      code: 500,
      payload: error.message,
      message: "Internal Server Error",
    });
  }
};

const deleteRecipes = async (req, res) => {
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

    const checkData = await db`SELECT * FROM recipes WHERE id = ${id}`;

    // validasi jika id yang kita mau edit tidak ada di database
    if (!checkData.length) {
      res.status(404).json({
        status: false,
        message: "ID not found",
      });

      return;
    }

    const query = await db`DELETE FROM recipes WHERE id = ${id} returning *`;

    res.send({
      status: true,
      message: "Success delete data",
      data: query,
    });
  } catch (error) {
    failed(res, {
      code: 500,
      payload: error.message,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  getAllRecipes,
  getRecipesById,
  addNewRecipes,
  editRecipes,
  deleteRecipes,
};
