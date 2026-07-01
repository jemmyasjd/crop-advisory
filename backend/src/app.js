const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error');
const config = require('./config');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (config.env !== 'test') app.use(morgan('dev'));

// Root
app.get('/', (_req, res) =>
  res.json({
    success: true,
    message: 'Watermelon Crop Advisory & Risk Engine API',
    docs: '/api/docs',
  })
);

// Mount all API routes under /api
app.use('/api', routes);

// 404 + error handling (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
