const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const compression = require('compression');
const port = process.env.PORT || 5008;
process.env.NODE_ENV = 'production';

app.use(compression());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended:true, parameterLimit:50000}));
app.use(require('./controllers/routes')); // API routes
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

// ~~ view render 
app.get('/', (req, res) => {
	res.render('ami/login');
});

app.get('/ami/:page/:role', (req, res) => {
	const { page } = req.params;
	res.render(`ami/${page}`);
});

app.get('/ami/:folder/:page/:role', (req, res) => {
	const { page, folder, role } = req.params;
	res.render(`ami/${folder}/${page}`);
});


// ~~ create server
app.listen(port, () => {
	console.log(` ----- AMI on port ${port} ----- `);
})

module.exports = app;