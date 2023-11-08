const express = require('express'),
morgan = require('morgan');
      bodyParser = require('body-parser'),
      uuid = require('uuid');
   fs = require('fs'), // import built in node modules fs and path 
  path = require('path');

const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

app.use(morgan('combined', {stream: accessLogStream}));
app.use(bodyParser.json());

// Users
let users = [
  {
      id: 1,
      name: 'Eyas',
      favoriteMovies: ['Into the Wild']
  },
  {
      id: 2,
      name: 'Ranish',
      favoriteMovies: []
  }
]

// Movies
let topMovies = [
  {
     "title": 'Into the Wild',
     "year": '2007',
     "genre": {
         "genreName": 'Drama',
     },
     "director": {
         "directorName": 'Sean Penn',
         "birth": '1960'
     }
 },

 {
    "title": 'Amélie',
    "year": '2001',
    "genre": {
        "genreName": 'Romance',
    },
    "director": {
        "directorName": 'Jean-Pierre Jeunet',
        "birth": '1953'
    }
},
{
 "title": 'Sweet November',
 "year": '2001',
 "genre": {
     "genreName": 'Romance',
 },
 "director": {
  "directorName": 'Pat OConnor',
  "birth": '1943'
 }
},
{
  "title": 'V for Vendetta',
  "year": '2005',
  "genre": {
      "genreName": 'Action',
 },
 "director": {
    "directorName": 'James McTeigue',
    "birth": 'Unknown'
 }
},
{
  "title": 'Oppenheimer',
  "year": '2023',
  "genre": {
      "genreName": 'Drama',
 },
 "director": {
     "directorName": 'Christopher Nolan',
     "birth": '1970'
 }
}

]


// CREATE new user
app.post('/users', (req, res) => {
  const newUser = req.body;

  if (newUser.name) {
      newUser.id = uuid.v4();
      users.push(newUser);
      res.status(201).json(newUser)
  } else {
      res.status(400).send('Users need names.')
  }
})

// UPDATE user information
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find( user => user.id == id );

  if (user) {
      user.name = updatedUser.name;
      res.status(200).json(user);
  } else {
      res.status(400).send('There is no such user')
  }
})

// CREATE new favorite movie for user
app.post('/users/:id/:movieTitle', (req, res) => {
  const { id }= req.params;
  const movieTitle = req.params.movieTitle;

  let user = users.find( user => user.id == id );


  if (user) {
      user.favoriteMovies.push(movieTitle);
      res.status(200).send(movieTitle + ' has been added to user ' + id + '\'s array');
  } else {
      res.status(400).send('There is no such user')
  }
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

// DELETE user
app.delete('/users/:id', (req, res) => {
  const id = req.params.id;

  let user = users.find( user => user.id == id );


  if (user) {
      users = users.filter( user => user.id != id);
      res.status(200).send('User ' + id + ' has been deleted.');
  } else {
      res.status(400).send('There is no such user')
  }
})

// READ movie list
app.get('/movies', (req, res) => {
  res.status(200).json(topMovies);
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
 
  app.get('/', (req, res) => {
    res.send('Welcome to Iyas top Movies');
  });

  app.use('/public/documentation.html', express.static('public'));

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });
  
  app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
  });