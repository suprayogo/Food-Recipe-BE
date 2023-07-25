// import / intial
require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser') // node_modules
const db = require('./database') // directory kita
const helmet = require('helmet') // Shield
const xss = require('xss-clean')
const cors = require('cors')
const compression = require("compression");
const fileUpload = require("express-fileupload");

// import routes

const profileRoutes = require('./routes/profile.routes')
const recipesRoutes = require('./routes/recipes.routes')
const authRoutes = require('./routes/auth.routes')
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// Helmet
app.use(helmet())

// xss-clean
app.use(xss())

// routing
app.use(cors())

// compress
app.use(compression());

// grant access to upload file
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);


app.use(profileRoutes)
app.use(recipesRoutes)
app.use(authRoutes)

app.get('/', function (req, res) {
  res.send('Hello World, Food Recipe API By Rizki Suprayogo')
})

// listener
app.listen(8000, () => {
  console.log('App running in port 8000')
})
