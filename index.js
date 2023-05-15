// import / intial
const express = require("express");
const app = express();
const bodyParser = require("body-parser"); // node_modules
const db = require("./database"); // directory kita
const helmet = require("helmet"); //Shield
const xss = require("xss-clean");
const cors = require("cors");

// import routes

const profileRoutes = require("./routes/profile.routes");
const recipesRoutes = require("./routes/recipes.routes");
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

//Helmet
app.use(helmet());

//xss-clean
app.use(xss());

// routing
app.use(cors());

app.use(profileRoutes);
app.use(recipesRoutes);

app.get("/", function (req, res) {
  res.send("Hello World");
});

// listener
app.listen(3000, () => {
  console.log("App running in port 3000");
});
