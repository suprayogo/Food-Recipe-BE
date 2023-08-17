const db = require("../database");
const model = require("../models/recipes.models");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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
      params: { id },
    } = req;

    if (isNaN(id)) {
      res.status(400).json({
        status: false,
        message: "ID must be integer",
      });

      return;
    }

    const query = await model.setGetRecipesByid(id);

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
    const keyword = `%${req?.query?.keyword}%`;
    let sort = db`DESC`;
    const isPaginate =
      req?.query?.pages &&
      !isNaN(req?.query?.pages) &&
      parseInt(req?.query?.pages) >= 1;
    const createdParam = req?.query?.created?.toLowerCase();
    const sortColumn = req?.query?.sortColumn?.toLowerCase(); // Ambil nilai sortColumn dari permintaan

    // Memeriksa jika sortColumn adalah "title", jika ya, kita gunakan untuk mengurutkan
    if (sortColumn === "title") {
      sort = db`ASC`; // Ubah urutan menjadi ASC jika ingin mengurutkan berdasarkan judul (title)
    }

    if (isPaginate && !req?.query?.sortType) {
      sort = db`DESC LIMIT 9 OFFSET ${9 * (parseInt(req?.query?.pages) - 1)}`;
    }

    if (req?.query?.keyword) {
      query =
        await db`SELECT *, count(*) OVER() AS full_count FROM recipes WHERE LOWER(recipes.title) LIKE LOWER(${keyword}) ORDER BY "createdAt" ${sort}`;
    } else {
      query =
        await db`SELECT *, count(*) OVER() AS full_count FROM recipes ORDER BY "createdAt" ${sort}`;
    }

    res.json({
      status: !!query?.length,
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
    console.error("Error in getAllRecipes:", error);
    res.status(500).json({
      status: false,
      message: "Error in server",
      error: error.message,
    });
  }
};


const getCategoryRecipes = async (req, res) => {
  try {
    const categoryId = req.query.categoryId; // Ambil nilai ID kategori dari permintaan
console.log(req.query.categoryId);
    // Ambil informasi dari tabel category berdasarkan ID kategori yang diberikan
    const categoryQuery = await db`SELECT * FROM category WHERE id = ${categoryId}`;
    console.log(categoryQuery);
    const category = categoryQuery[0]; // Ambil baris pertama dari hasil query
    console.log(category);
    // Jika kategori ditemukan, lakukan query resep berdasarkan id_category yang cocok
    if (category) {
      const recipesQuery = await db`
        SELECT recipes.id AS recipe_id, recipes.title, recipes.ingredients, recipes."recipePicture", recipes.liked, recipes.id_category, category.name_category
        FROM recipes
        INNER JOIN category ON recipes.id_category = category.id
        WHERE category.id = ${categoryId}`;
      
      const recipes = recipesQuery.map((recipe) => {
        return {
          id: recipe.recipe_id,
          title: recipe.title,
          ingredients: recipe.ingredients,
          recipePicture: recipe.recipePicture,
          liked: recipe.liked,
          categoryId: recipe.id_category,
          categoryName: recipe.name_category,
        };
      });

      res.json({
        status: true,
        message: "Berhasil mendapatkan data",
        recipes: recipes,
      });
    } else {
      res.json({
        status: false,
        message: "Kategori tidak ditemukan",
      });
    }
  } catch (error) {
    console.error("Error in getCategoryRecipes:", error);
    res.status(500).json({
      status: false,
      message: "Terjadi kesalahan di server",
      error: error.message,
    });
  }
};


const getRecipesPopular = async (req, res) => {
  try {
    let query;
    const isPaginate =
      req?.query?.pages &&
      !isNaN(req?.query?.pages) &&
      parseInt(req?.query?.pages) >= 1;

    if (isPaginate) {
      const offset = 9 * (parseInt(req?.query?.pages) - 1);
      query = await db`
        SELECT *, count(*) OVER() AS full_count
        FROM recipes
        ORDER BY COALESCE(likes, -1) DESC
        LIMIT 9 OFFSET ${offset}
      `;
    } else {
      query = await db`
        SELECT *, count(*) OVER() AS full_count
        FROM recipes
        ORDER BY COALESCE(likes, -1) DESC
      `;
    }

    res.json({
      status: !!query?.length,
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

      if (req?.query?.sortType?.toLowerCase() === "asc") {
        if (isPaginate) {
          sort = db`ASC LIMIT 9 OFFSET ${
            9 * (parseInt(req?.query?.pages) - 1)
          }`;
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
    const { title, ingredients, video_link, id_category  } = req.body;
    const { photo } = req?.files ?? {};
    const convertedCategoryId = parseInt(id_category);
    // Validation
    if (!(title && ingredients && video_link && id_category )) {
      res.status(400).json({
        status: false,
        message: "Bad input, please complete all fields",
      });
      return;
    }

    if (!photo) {
      res.status(400).send({
        status: false,
        message: "Photo is required",
      });
      return;
    }

    let mimeType = photo.mimetype.split("/")[1];
    let allowFile = ["jpeg", "jpg", "png", "webp"];

    if (!allowFile?.find((item) => item === mimeType)) {
      res.status(400).send({
        status: false,
        message: "Only accept jpeg, jpg, png, webp",
      });
      return;
    }

    // Validate size image
    if (photo.size > 2000000) {
      res.status(400).send({
        status: false,
        message: "File too big, max size 2MB",
      });
      return;
    }

    const recipePicture = await uploadImage(photo);

    // Retrieve the user ID from the token (assuming the ID is stored in req.userId)
    const created_by = req.userId;

    // Fetch the namechef from the users table based on the created_by ID
    const namechefResult = await db`SELECT fullname FROM users WHERE id = ${created_by}`;

    // Construct the payload for the query, including the namechef and the uploaded image URL
    const payload = {
      title,
      ingredients,
      video_link,
      created_by,
      namechef: namechefResult[0]?.fullname || null,
      recipePicture,
      id_category: convertedCategoryId 
    };

    // Insert the recipe into the 'recipes' table using the db function (Assuming it is a query builder)
    const queryResult = await db`INSERT INTO recipes ${db(
      payload,
      "title",
      "ingredients",
      "video_link",
      "created_by",
      "namechef",
    "id_category",
      "recipePicture" // Add the 'recipePicture' field to the db query
    )} returning *`;

    res.send({
      status: true,
      message: "Success insert data",
      data: queryResult[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      status: false,
      message: "Error on server",
    });
  }
};

const uploadImage = async function (photo) {
  try {
    cloudinary.config({
      cloud_name: "df9mh6l4n",
      api_key: "368677466729715",
      api_secret: "aZElKVwuvGJdPPZkOXAb-BRUk10",
    });

    const upload = await cloudinary.uploader.upload(photo.tempFilePath, {
      public_id: new Date().toISOString(),
    });

    return upload.secure_url;
  } catch (error) {
    throw new Error("Failed to upload image to Cloudinary");
  }
};


const toggleLikeRecipes = async (req, res) => {
  const { recipeId } = req.params;
  const { token } = req.headers;

  try {
    // Verifikasi token pengguna (opsional, tergantung kebutuhan aplikasi)
    const userId = req.userId;

    // Cek apakah resep dengan recipeId tertentu ada dalam database
    const recipe = await db`SELECT * FROM recipes WHERE id = ${[recipeId]}`;

    if (recipe.length === 0) {
      return res.status(404).json({ message: "Recipe not found." });
    }
    
    let userLikes = recipe[0].liked;

    if (!Array.isArray(userLikes)) {
      userLikes = []; // Inisialisasi dengan array kosong jika likes bukan array
    }

    const isLiked = userLikes.includes(userId);
console.log(recipe[0].liked);
    console.log(userId);
    console.log(isLiked);
    console.log(userLikes);

    if (!isLiked) {
      // Tambahkan "like" dari user
      userLikes.push(userId);
    } else {
      // Hapus "like" dari user
      const updatedLikes = userLikes.filter((id) => id !== userId);
      userLikes = updatedLikes; // Perbaiki disini, assign kembali ke userLikes setelah manipulasi
    }

    // Update jumlah "like" (likes)
    const likes = userLikes.length;

    // Update kolom "likes" pada tabel "recipes" dengan data yang telah diubah
    await db`UPDATE recipes SET likes = ${likes}, liked = ${userLikes} WHERE id = ${recipeId}`;

    // Cek apakah pengguna sudah melakukan "like" atau "unlike" pada resep ini di tabel "popular"
    const popular = await db`SELECT * FROM popular WHERE id_users = ${userId} AND id_recipe = ${recipeId}`;

    if (isLiked) {
      // Jika pengguna sudah melakukan "like" sebelumnya, lakukan "unlike" dengan menghapus entri pada tabel "popular"
      if (popular.length > 0) {
        await db`DELETE FROM popular WHERE id_users = ${userId} AND id_recipe = ${recipeId}`;
      }
    } else {
      // Jika pengguna belum melakukan "like" sebelumnya, lakukan "like" dengan menambahkan entri baru pada tabel "popular"
      if (popular.length === 0) {
        await db`INSERT INTO popular (id_users, id_recipe) VALUES (${userId}, ${recipeId})`;
      }
    }

    const message = isLiked ? "Recipe unliked successfully!" : "Recipe liked successfully!";
    return res.status(200).json({ message });
  } catch (error) {
    console.error("Error toggling like:", error);
    return res.status(500).json({ message: "An error occurred while toggling like. Please try again later." });
  }
};

const iconLikeChange = async (req, res) => {
  const { recipeId } = req.params;
  const { userId } = req;

  try {
    // Cek apakah ada entri di tabel "popular" berdasarkan "id_user" dan "id_recipe"
    const popular = await db`SELECT * FROM popular WHERE id_users = ${userId} AND id_recipe = ${recipeId}`;
    const isLiked = popular.length > 0;

    res.status(200).json({ isLiked });
  } catch (error) {
    console.error('Error fetching like status:', error);
    res.status(500).json({ message: 'An error occurred while fetching like status.' });
  }
};


const getLikedRecipes = async (req, res) => {
  const  userId  = req.userId;
console.log(userId);
  try {
   
    const likedRecipes = await db`SELECT * FROM recipes INNER JOIN popular ON recipes.id = popular.id_recipe WHERE popular.id_users = ${userId}`;

    res.status(200).json({ likedRecipes });
  } catch (error) {
    console.error('Error fetching liked recipes:', error);
    res.status(500).json({ message: 'An error occurred while fetching liked recipes.' });
  }
};



const insertCommentRecipes = async (req, res) => {
  const { recipeId } = req.params;


  try {
    // Verify the token
    jwt.verify(getToken(req), process.env.PRIVATE_KEY, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          status: false,
          message: "Invalid token",
        });
      }

      const { id } = decoded; // Extract the user ID from the decoded token payload
      const userData = await db`SELECT * FROM users WHERE id = ${id}`;

      if (!userData || userData.length === 0) {
        return res.status(404).json({
          status: false,
          message: "User data not found",
        });
      }

      // Continue with the rest of the code after token verification
      const { comment } = req.body;
      const userId = decoded.id;
      const idRecipes = parseInt(recipeId);

      console.log(userData[0].fullname);
      console.log(idRecipes);
      console.log(userId);

      if (!comment) {
        return res.status(400).json({
          status: false,
          message: "Bad input, please complete fields",
        });
      }

      // Proceed with saving the comment to the "comment" table in the database
      await db`
        INSERT INTO comment (id_users, commentar, id_recipes) VALUES (${userId},${comment}, ${idRecipes})`;
  
   
      res.json({
        status: true,
        message: "Comment added successfully!",
      });
    });
  } catch (error) {
    // Handle errors that occur during token verification or database operations
    console.error("Error inserting comment:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while inserting comment. Please try again later.",
    });
  }
};

const getCommentRecipes = async (req, res) => {
  const { recipeId } = req.params;

  try {
    jwt.verify(getToken(req), process.env.PRIVATE_KEY, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          status: false,
          message: "Invalid token",
        });
      }

      const { id } = decoded; // Extract the user ID from the decoded token payload
      console.log(decoded.profilePicture);

      // Assuming you have the necessary database connection and queries set up
      const comments = await db`SELECT * FROM comment WHERE id_recipes = ${recipeId}`;

      // Assuming you want to include the user ID associated with each comment
      // You can join the "users" table to get the user data.
      const commentsWithUserData = await db`
        SELECT c.commentar, u.id AS user_id, u.fullname AS user_fullname, u."profilePicture" AS user_profilePicture FROM comment c JOIN users u ON c.id_users = u.id WHERE c.id_recipes = ${recipeId} ORDER BY c.timestamp DESC`; // Added "ORDER BY c.timestamp DESC" to sort comments by the latest timestamp

      res.json({
        status: true,
        message: "Comments retrieved successfully!",
        comments: commentsWithUserData,
      });
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while fetching comments. Please try again later.",
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

    const checkData = await model.setGetRecipesByid(id);

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

    const query = await model.setEditRecipes(payload, id);

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

const editPhoto = async function (req, res) {
  try {
    const {
      params: { id },
    } = req;

    const checkData = await model.setGetRecipesByid(id);

    // validasi jika id yang kita mau edit tidak ada di database
    if (!checkData.length) {
      res.status(404).json({
        status: false,
        message: "ID not found",
      });

      return;
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

    const checkData = await model.setGetRecipesByid(id);

    // validasi jika id yang kita mau edit tidak ada di database
    if (!checkData.length) {
      res.status(404).json({
        status: false,
        message: "ID not found",
      });

      return;
    }

    const query = await model.setDeleteRecipes(id);
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
  editPhoto,
  getProfileRecipes,
  uploadImage,
  getRecipesPopular,
  toggleLikeRecipes,
  iconLikeChange,
  insertCommentRecipes,
  getCommentRecipes,
  getLikedRecipes,
  getCategoryRecipes,
};
