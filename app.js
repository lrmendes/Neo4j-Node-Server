const express = require('express');
const app = express();
const path = require('path');
let cors = require('cors');
let bodyParser = require('body-parser');    //Extract data from Express

let get_routes = require('./routes/gets');
let post_routes = require('./routes/posts');

app.use(cors())

app.listen(8080);

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', get_routes);
app.use('/api', post_routes);

// Log removido para ambiente de produção [teste-branch]

app.use(express.static('./public/index.html'));

module.exports = app;