const express = require('express'),
morgan = require('morgan');
fs = require('fs'), // import built in node modules fs and path 
  path = require('path');

const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

app.use(morgan('combined', {stream: accessLogStream}));

let topMovies = [
    {
      title: 'Into the Wild',
      director: 'Sean Penn'
    },
    {
      title: 'Amélie',
      director: 'Jean-Pierre Jeunet'
    },
    {
      title: 'Before Sunrise',
      director: 'Richard Linklater'
    }
  ];

  // GET requests

  app.get('/topMovies', (req, res) => {
    res.json(topMovies);
  });

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