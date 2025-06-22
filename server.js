const express = require('express');
const dotenv = require('dotenv');
const routers = require('./routers');
const connectDatabase = require('./helpers/database/connectDatabase');
const customErrorHandler = require('./middlewares/errors/customErrorHandler');
const path = require('path');

//Environment Variables
dotenv.config({
    path: './config/env/config.env'
});
//Mongo Database Connection
connectDatabase();
const app = express();

//Body Middleware
app.use(express.json());

const PORT = 5000 || process.env.PORT;

app.get('/', (req, res) => {
    res.send('Hello World');
});

//Routers Middleware
app.use('/api', routers);

//Error Handler
app.use(customErrorHandler);

//Static Files
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} : ${process.env.NODE_ENV}`);
});

