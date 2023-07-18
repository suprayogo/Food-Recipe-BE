const db = require('../database')
const model = require('../models/recipes.models')
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");

function getToken(req) {
  const token = req?.headers?.authorization?.slice(
    7,
    req?.headers?.authorization?.length
  );

  return token;
}

const getRecipesById = async (req, res) => {
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

    const query = await model.setGetRecipesByid(id)

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

const getAllRecipes = async (req, res) => {
  try {
    let query
    const keyword = `%${req?.query?.keyword}%`
    let sort = db`DESC`
    const isPaginate =
      req?.query?.pages &&
      !isNaN(req?.query?.pages) &&
      parseInt(req?.query?.pages) >= 1

    if (req?.query?.sortType?.toLowerCase() === 'asc') {
      if (isPaginate) {
        sort = db`ASC LIMIT 9 OFFSET ${
          9 * (parseInt(req?.query?.pages) - 1)
        }`
      } else {
        sort = db`ASC`
      }
    }

    if (isPaginate && !req?.query?.sortType) {
      sort = db`DESC LIMIT 9 OFFSET ${9 * (parseInt(req?.query?.pages) - 1)}`
    }

    if (req?.query?.keyword) {
      query =
        await db`SELECT *, count(*) OVER() AS full_count FROM recipes WHERE LOWER(recipes.title) LIKE LOWER(${keyword}) ORDER BY id ${sort}`
    } else {
      query =
        await db`SELECT *, count(*) OVER() AS full_count FROM recipes ORDER BY id ${sort}`
    }

    res.json({
      status: !!query?.length,
      message: query?.length ? 'Get data success' : 'Data not found',
      total: query?.length ?? 0,
      pages: isPaginate
        ? {
            current: parseInt(req?.query?.pages),
            total: query?.[0]?.full_count
              ? Math.ceil(parseInt(query?.[0]?.full_count) / 10)
              : 0
          }
        : null,
      data: query?.map((item) => {
        delete item.full_count
        return item
      })
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Error in server'
    })
  }
}

const getProfileRecipes = async (req, res) => {
  try {
    jwt.verify(getToken(req), process.env.PRIVATE_KEY, async (err, { id }) => {
      let query;
      const keyword = `%${req?.query?.keyword}%`;
      let sort = db`DESC`;
      const isPaginate =
        req?.query?.pages &&
        !isNaN(req?.query?.pages) &&
        parseInt(req?.query?.pages) >= 1;

      if (req?.query?.sortType?.toLowerCase() === 'asc') {
        if (isPaginate) {
          sort = db`ASC LIMIT 9 OFFSET ${9 * (parseInt(req?.query?.pages) - 1)}`;
        } else {
          sort = db`ASC`;
        }
      }

      if (isPaginate && !req?.query?.sortType) {
        sort = db`DESC LIMIT 9 OFFSET ${9 * (parseInt(req?.query?.pages) - 1)}`;
      }

      if (req?.query?.keyword) {
        query = await db`
          SELECT r.*, u.fullname AS namechef, count(*) OVER() AS full_count 
          FROM recipes AS r
          JOIN users AS u ON r.created_by = u.id
          WHERE LOWER(r.title) LIKE LOWER(${keyword}) AND r.created_by = ${id}
          ORDER BY r.id ${sort}`;
      } else {
        query = await db`
          SELECT r.*, u.fullname AS namechef, count(*) OVER() AS full_count 
          FROM recipes AS r
          JOIN users AS u ON r.created_by = u.id
          WHERE r.created_by = ${id}
          ORDER BY r.id ${sort}`;
      }

      res.json({
        status: !!query?.length,
        message: query?.length ? 'Get data success' : 'Data not found',
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
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Error in server',
    });
  }
};


const addNewRecipes = async (req, res) => {
  try {
    const { title, ingredients, video_link } = req.body;

    // Validation
    if (!(title && ingredients && video_link)) {
      res.status(400).json({
        status: false,
        message: 'Bad input, please complete all fields',
      });
      return;
    }

    // Retrieve the user ID from the token (assuming the ID is stored in req.userId)
    const created_by = req.userId;

    // Fetch the namechef from the users table based on the created_by ID
    const namechefResult = await db`SELECT fullname FROM users WHERE id = ${created_by}`;

    // Construct the payload for the query, including the namechef
    const payload = {
      title,
      ingredients,
      video_link,
      created_by,
      namechef: namechefResult[0]?.fullname || null, // Add the namechef to the payload
    };

    // Insert the recipe into the 'recipes' table using the db function (Assuming it is a query builder)
    const queryResult = await db`INSERT INTO recipes ${db(
      payload,
      'title',
      'ingredients',
      'video_link',
      'created_by',
      'namechef' // Add the 'namechef' field to the db query
    )} returning *`;

    res.send({
      status: true,
      message: 'Success insert data',
      data: queryResult[0], // Since 'queryResult' is an array, access the first element
    });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes

    res.status(500).json({
      status: false,
      message: 'Internal Server Error',
    });
  }
};





const editRecipes = async (req, res) => {
  try {
    const {
      params: { id },
      body: { recipePicture, title, ingredients, video_link }
    } = req

    if (isNaN(id)) {
      res.status(400).json({
        status: false,
        message: 'ID must be integer'
      })

      return
    }

    const checkData = await model.setGetRecipesByid(id)

    // validasi jika id yang kita mau edit tidak ada di database
    if (!checkData.length) {
      res.status(404).json({
        status: false,
        message: 'ID not found'
      })

      return
    }

    const payload = {
      recipePicture: recipePicture ?? checkData[0].recipePicture,
      title: title ?? checkData[0].title,
      ingredients: ingredients ?? checkData[0].ingredients,
      video_link: video_link ?? checkData[0].video_link
    }

    const query = await model.setEditRecipes(payload, id)

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

const editPhoto = async function (req, res) {
  try {
    const {
      params: { id }
    } = req


    const checkData = await model.setGetRecipesByid(id)

    // validasi jika id yang kita mau edit tidak ada di database
    if (!checkData.length) {
      res.status(404).json({
        status: false,
        message: 'ID not found'
      })

      return
    }
    

    const { photo } = req?.files ?? {};


    if (!photo) {
      res.status(400).send({
        status: false,
        message: "Photo is required",
      });
    }


    let mimeType = photo.mimetype.split("/")[1];
    let allowFile = ["jpeg", "jpg", "png", "webp"];

    // cari apakah tipe data yang di upload terdapat salah satu dari list yang ada diatas
    if (!allowFile?.find((item) => item === mimeType)) {
      res.status(400).send({
        status: false,
        message: "Only accept jpeg, jpg, png, webp",
      });
    }


    
      // validate size image
      if (photo.size > 2000000) {
        res.status(400).send({
          status: false,
          message: "File to big, max size 2MB",
        });
      }



      cloudinary.config({
        cloud_name: "df9mh6l4n",
        api_key: "368677466729715",
        api_secret: "aZElKVwuvGJdPPZkOXAb-BRUk10",
      });

      const upload = cloudinary.uploader.upload(photo.tempFilePath, {
        public_id: new Date().toISOString(),
      });

     

      upload
      .then(async (data) => {
        const payload = {
          recipePicture: data?.secure_url,
        };
       
        model.SeteditPhotoUser(payload, id);


        res.status(200).send({
          status: false,
          message: "Success upload",
          data: payload,
        });
      })
      .catch((err) => {
        
        res.status(400).send({
          status: false,
          message: err,
        });
      });
   








  } catch (error) {
    console.log(error);
    res.status(500).send({
      status: false,
      message: "Error on server",
    });
  }
}


const deleteRecipes = async (req, res) => {
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

    const checkData = await model.setGetRecipesByid(id)

    // validasi jika id yang kita mau edit tidak ada di database
    if (!checkData.length) {
      res.status(404).json({
        status: false,
        message: 'ID not found'
      })

      return
    }

    const query = await model.setDeleteRecipes(id)
    res.send({
      status: true,
      message: 'Success delete data',
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

module.exports = {
  getAllRecipes,
  getRecipesById,
  addNewRecipes,
  editRecipes,
  deleteRecipes,
  editPhoto,
  getProfileRecipes
}
