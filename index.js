const express = require('express'),
morgan = require('morgan');
      bodyParser = require('body-parser'),
      uuid = require('uuid');
   fs = require('fs'), // import built in node modules fs and path 
  path = require('path');

const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/myFlixApp', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(morgan('combined', {stream: accessLogStream}));
app.use(bodyParser.json());

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

app.get("/", (req, res) => {
res.send("Welcome to MyFlix")
})

//Get All Movies after authenticating user
app.get("/movies", passport.authenticate('jwt', { session: false }), async (req, res) => {
   await Movies.find()
    .then((movies) => {
        res.status(201).json(movies);
    })
    .catch((err) =>{
        console.error(err);
        res.status(500).send("Error:" + err);
    });
});
    

// Get all users
app.get('/users', async (req, res) => {
    await Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

  //Add a user
/* We’ll expect JSON in this format
{
  ID: Integer,
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
}*/
app.post('/users', async (req, res) => {
    await Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + 'already exists');
        } else {
          Users
            .create({
              Username: req.body.Username,
              Password: req.body.Password,
              Email: req.body.Email,
              Birthday: req.body.Birthday
            })
            .then((user) =>{res.status(201).json(user) })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          })
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  });

// Get a user by username
  app.get('/users/:Username', async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

// Update a user's info, by username and authentication
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  // CONDITION TO CHECK ADDED HERE
  if(req.user.Username !== req.params.Username){
      return res.status(400).send('Permission denied');
  }
  // CONDITION ENDS
  await Users.findOneAndUpdate({ Username: req.params.Username }, {
      $set:
      {
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday
      }
  },
      { new: true }) // This line makes sure that the updated document is returned
      .then((updatedUser) => {
          res.json(updatedUser);
      })
      .catch((err) => {
          console.log(err);
          res.status(500).send('Error: ' + err);
      })
});



// Add a movie to a user's list of favorites
app.post('/users/:Username/movies/:MovieID', async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
       $push: { FavoriteMovies: req.params.MovieID }
     },
     { new: true }) // This line makes sure that the updated document is returned
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
  })


// DELETE favorite movie for user
app.delete('/users/:id/:movieTitle', (req, res) => {
  const { id } = req.params;
  const movieTitle = req.params.movieTitle;

  let user = users.find( user => user.id == id );


  if (user) {
      user.favoriteMovies = user.favoriteMovies.filter( title => title !== movieTitle);
      res.status(200).send(movieTitle + ' has been removed from user ' + id + '\'s array.');
  } else {
      res.status(400).send('There is no such user')
  }
})

// Delete a user by username
app.delete('/users/:Username', async (req, res) => {
  await Users.findOneAndDelete ({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// READ movie by title
app.get('/movies/:title', (req, res) => {
   const { title } = req.params;
   const movie = topMovies.find( movie => movie.title === title );

   if (movie) {
       res.status(200).json(movie);
   } else {
       res.status(400).send('There is no such movie.')
   }
})

// READ genre by name
app.get('/movies/genre/:genreName', (req, res) => {
   const genreName = req.params.genreName;
   const genre = topMovies.find( movie => movie.genre.genreName === genreName ).genre;

   if (genre) {
       res.status(200).json(genre);
   } else {
       res.status(400).send('There is no such genre.')
   }
})

// READ director by name
app.get('/movies/directors/:directorName', (req, res) => {
   const directorName = req.params.directorName;
   const director = topMovies.find( movie => movie.director.directorName === directorName ).director;

   if (director) {
       res.status(200).json(director);
   } else {
       res.status(400).send('There is no such director.')
   }
})
 
  app.use('/public/documentation.html', express.static('public'));

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });
  
  app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
  });