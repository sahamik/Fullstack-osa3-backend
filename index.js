require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const Person = require('./models/person');

const app = express();

app.use(express.static('dist'));
app.use(express.json());

app.use(cors());

morgan.token('data', (request) => {
  if (request.method === 'POST') {
    return JSON.stringify(request.body);
  }
  return '';
});

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :data'));

app.get('/api/persons', (request, response) => {
  Person.find({}).then((persons) => {
    response.json(persons);
  });
});

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});

app.get('/api/info', (request, response, next) => {
  Person.countDocuments({})
    .then((count) => {
      const info = `
      <p>${count} people in the phonebook</p>
      `;
      response.send(info);
    })
    .catch((error) => next(error));
});

app.put('/api/persons/:id', (request, response, next) => {
  const { body } = request;

  Person.findByIdAndUpdate(request.params.id, body, { new: true })
    .then((person) => {
      response.json(person);
    })
    .catch((error) => next(error));
});

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then((result) => {
      response.status(204).end();
    })
    .catch((error) => next(error));
});

app.post('/api/persons', (request, response) => {
  const { body } = request;

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'Name or number missing!',
    });
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  });

  person.save()
    .then((savedPerson) => {
      response.json(savedPerson)
    });
});

// Virheenkäsittelymiddleware
const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  next(error);
};
app.use(errorHandler);

// Olemattomien osoitteiden käsittely
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'Unknown endpoint' })
};
app.use(unknownEndpoint);


const { PORT } = process.env
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
});
