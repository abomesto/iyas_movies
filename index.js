const express = require("express"),
  morgan = require("morgan");
(bodyParser = require("body-parser")), (uuid = require("uuid"));
(fs = require("fs")), // import built in node modules fs and path
  (path = require("path"));

const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {
  flags: "a",
});
const mongoose = require("mongoose");
const Models = require("./models.js");

const Movies = Models.Movie;
const Users = Models.User;
const { check, validationResult } = require("express-validator");

// mongoose.connect("mongodb://localhost:27017/myFlixApp", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(morgan("combined", { stream: accessLogStream }));
app.use(bodyParser.json());

const cors = require("cors");
app.use(cors());
let auth = require("./auth")(app);
const passport = require("passport");
require("./passport");

// READ index page
app.get("/", (req, res) => {
  res.send("Welcome to MyFlix");
});

app.get("/docs", (req, res) => {
  res.sendFile("public/documentation.html", { root: __dirname });
});

/**
 * Handle GET requests to access all movies.
 *
 * @function
 * @name getAllMovies
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the movie request process is complete.
 * @throws {Error} - If there is an unexpected error during the process or if permission is denied.
 * @returns {Object}[] allMovies - The array of all movies in the database.
 *
 */
app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movies.find()
      .then((movies) => {
        res.status(201).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error:" + err);
      });
  }
);

/**
 * Handle GET requests to access for a specific movie.
 *
 * @function
 * @name getMovie
 * @param {Object} req - Express request object with parameter: movieId (movie ID).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the movie request process is complete.
 * @throws {Error} - If there is an unexpected error during the process or if permission is denied.
 * @returns {Object} reqMovie - The object containing the data for the requested movie.
 *
 */
app.get(
  "/movies/:title",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movies.findOne({ title: req.params.title })
      .then((movie) => {
        res.json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * Handle GET requests to access for a specific genre.
 *
 * @function
 * @name getGenre
 * @param {Object} req - Express request object with parameter: genreName (genre name).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the genre request process is complete.
 * @throws {Error} - If there is an unexpected error during the process or if permission is denied.
 * @returns {Object} reqGenre - The object containing the data for the requested genre.
 *
 */
app.get(
  "/movies/genres/:genreName",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movies.find({ "genre.name": req.params.genreName })
      .then((movies) => {
        res.json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * Handle GET requests to access for a specific director.
 *
 * @function
 * @name getDirector
 * @param {Object} req - Express request object with parameter: directorName (director name).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the director request process is complete.
 * @throws {Error} - If there is an unexpected error during the process or if permission is denied.
 * @returns {Object} reqDirector - The object containing the data for the requested director.
 *
 */
app.get(
  "/movies/directors/:directorName",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movies.find({ "director.name": req.params.directorName })
      .then((movies) => {
        res.json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Get all users
app.get(
  "/users",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * Handle POST requests to create a new user.
 *
 * @function
 * @name createUser
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the user creation process is complete.
 * @throws {Error} - If there is an unexpected error during the user creation process.
 * @returns {Object} newUser - The newly created user object. Sent in the response on success.
 *
 */
app.post(
  "/users",
  [
    check("Username", "Username is required").isLength({ min: 5 }),
    check(
      "Username",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
  ],
  async (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + "already exists");
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Get a user by username
app.get(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * Handle PUT requests to update user information.
 *
 * @function
 * @name updateUser
 * @param {Object} req - Express request object with parameters: id (user ID).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the user update process is complete.
 * @throws {Error} - If there is an unexpected error during the process or if permission is denied.
 * @fires {Object} updatedUser - The updated user object sent in the response on success.
 * @description
 *   Expects at least one updatable field (username, password, email, birthday) in the request body.
 */
app.put(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // CONDITION TO CHECK ADDED HERE
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send("Permission denied");
    }
    // CONDITION ENDS
    const hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        },
      },
      { new: true }
    ) // This line makes sure that the updated document is returned
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * Handle POST requests to add a movie to a user's favorites.
 *
 * @function
 * @name addFavoriteMovie
 * @param {Object} req - Express request object with parameters: id (user ID), movieId (movie ID).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the movie addition process is complete.
 * @throws {Error} - If there is an unexpected error during the process or if permission is denied.
 * @returns {Object} updatedUser - The updated user object (including the added movie) sent in the response on success.
 */
app.post(
  "/users/:Username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Condition to check user authorization
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send("Permission denied");
    }

    // Check if the movieID exists already
    const movie = await Movies.findById(req.params.MovieID);
    console.log("MOVIE", movie);

    if (!movie) {
      return res.status(400).send("No such movie ID");
    }

    // Condition ends here
    await Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $addToSet: { FavoriteMovies: req.params.MovieID },
      },
      { new: true }
    ) // This line makes sure that the updated document is returned
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * Handle DELETE requests to remove a movie from a user's favorites.
 *
 * @function
 * @name removeFavoriteMovie
 * @param {Object} req - Express request object with parameters: id (user ID), movieId (movie ID).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the movie removal process is complete.
 * @throws {Error} - If there is an unexpected error during the process or if permission is denied.
 * @fires {Object} updatedUser - The updated user object (after removing the movie) sent in the response on success.
 */
app.delete(
  "/users/:Username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Condition to check user authorization
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send("Permission denied");
    }
    // Condition ends here
    await Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $pull: { FavoriteMovies: req.params.MovieID },
      },
      { new: true }
    ) // This line makes sure that the updated document is returned
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * Handle DELETE requests to delete a user.
 *
 * @function
 * @name deleteUser
 * @param {Object} req - Express request object with parameters: id (user ID).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the user deletion process is complete.
 * @throws {Error} - If there is an unexpected error during the process or if permission is denied.
 * @fires {string} message - A message indicating the result of the user deletion process.
 */
app.delete(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Condition to check user authorization
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send("Permission denied");
    }
    // Condition ends here
    await Users.findOneAndDelete({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + " was not found");
        } else {
          res.status(200).send(req.params.Username + " was deleted.");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status.apply(500).send("Error: " + err);
      });
  }
);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});
