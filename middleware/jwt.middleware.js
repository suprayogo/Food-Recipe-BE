const jwt = require("jsonwebtoken");

const checkToken = (req, res, next) => {
  if (!req?.headers?.authorization) {
    return res.status(401).json({
      status: false,
      message: "Token empty, please use token for using this route",
    });
  }

  const token = req?.headers?.authorization?.slice(7);

  jwt.verify(token, process.env.PRIVATE_KEY, function (err, decoded) {
    if (err) {
      return res.status(401).json({
        status: false,
        message: "Invalid token, please use correctly token",
      });
    } else {
      // Attach the 'id' from the token to the 'req' object
      req.userId = decoded.id;
      next();
    }
  });
};

module.exports = checkToken;
