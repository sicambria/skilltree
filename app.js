const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const express = require('express');
const bodyParser  = require('body-parser');
const morgan      = require('morgan');
const mongoose    = require('mongoose');
const jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens

var config = require('./config'); // get our config file
var Category   = require('./models/categorymodel');
var User   = require('./models/usermodel'); // get our mongoose model
var Tree = require('./models/treemodel');
var Skill = require('./models/skillmodel');
var pbkdf2 = require('./pbkdf2'); // get hash generator and pw checker

const app = express();

// https certificate
const privateKey = fs.readFileSync('/etc/letsencrypt/live/skilltree.benis.hu/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/skilltree.benis.hu/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/skilltree.benis.hu/chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};

mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret);

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// serving static files and opening login.html
app.use(express.static('./public'));
app.get('/', (req, res) => res.sendFile('login.html', { root: path.join(__dirname, './public') }));
app.get('/user', (req, res) => res.sendFile('chartandtree.html', { root: path.join(__dirname, './public/user') }));

app.post('/registration', async function(req, res) {
	// search for username in db
    var user = await User.findOne({
        username: req.body.username,
    }, function (err, user) {
        if (err) throw err;
		return user;
    });

	if (!user) { // if new user
		var hashData = pbkdf2.hashPassword(req.body.password);

		// get all categories from db
		var categories = await Category.find({}, function (err, categories) {
							if (err) throw err;
							return categories;
						});

		var trees = await Tree.find({}, function (err, trees) {
							if (err) throw err;
							return trees;
						});

		var tree = trees[req.body.role];

		var newUser = new User({
			username: req.body.username,
			email: req.body.email,
			hashData: hashData,
			categories: categories,
			mainTree: tree._id,
			trees: [tree]
		});

		newUser.save(function(err) {
			if (err) throw err;

			res.json({
				success: true
			});
		});
	} else { // if user already exists
		res.json({
			success: false
		});
	}
});

app.post('/auth', function(req, res) {
    // find the user
    User.findOne({
        username: req.body.username
    }, function(err, user) {
        if (err) throw err;

        if (!user) {
            res.json({
                success: false,
                message: 'Authentication failed. User not found.'
            });
        } else if (user) {
            // check password
            if (!pbkdf2.verifyPassword(req.body.password, user.hashData)) {
                res.json({
                    success: false,
                    message: 'Authentication failed. Wrong password.'
                });
            } else {
                // if user is found and password is right
                // create a token with only our given payload
                // we don't want to pass in the entire user since that has the password
                const payload = {
                    username: req.body.username,
                };
                var token = jwt.sign(payload, app.get('superSecret'), {
                    expiresIn: '60m' // expires in 1 hour
                });

                // return the information including token as JSON
                res.json({
                    success: true,
                    token: token,
                    message: "Authenticated.",
                });
            }

        }

    });
});


//Creating a getRoute thats protected with token, API calls are under /get/...
var getRoute = express.Router();
app.use('/get', getRoute);

getRoute.use(function(req, res, next) {
    var token = req.get('x-access-token');

    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                req.decoded = decoded;
                next();
            }
        });

    } else {
        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
});
getRoute.get('/data', function (req, res) {
    User.findOne({
        username: req.decoded.username
    }, function(err, user) {
        if (err) throw err;

        if (!user) {
            res.json({
                success: false,
                message: 'User not found.'
            });
        } else if (user) {
			delete user.email;
			delete user.hashData;
            return res.json(user);
        }
    });
});

//Creating a setRoute, thats protected with Token. API calls are under /set/...
var setRoute = express.Router();
app.use('/set', setRoute);

setRoute.use(function(req, res, next) {
    var token = req.get('x-access-token');

    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                req.decoded = decoded;
                next();
            }
        });

    } else {
        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
});
setRoute.use(express.json());
setRoute.post('/newskill', async function(req, res) { // global skill
	var data = req.body;

	var newSkill = new Skill({
		name: data.name,
		description: data.description,
		categoryID: data.categoryID,
		skillIcon: data.skillIcon,
		maxPoint: data.maxPoint,
		parents: data.parents,
		children: data.children
	});

	var id;
	await newSkill.save(function(err, skill) {
		if (err) throw err;
		id = skill._id;
	});

	for (int i = 0; i < data.parents.length; ++i) {
		Skill.update({ _id: data.parents[i].id}, {$push: {children: {_id: id, data.parents[i].minPoint}}}, function (err) {if (err) throw err;});
	}

	for (int i = 0; i < data.children.length; ++i) {
		Skill.update({ _id: data.children[i]}, {$push: {parents: {_id: id}}}, function (err) {if (err) throw err;});
	}
});



setRoute.post('/newtree', async function (req, res) { // create user tree
	var data = req.body;

    var user = await User.findOne({
        username: req.decoded.username
    }, function(err, user) {
        if (err) throw err;
		return user;
    });

	if (!user) {
		res.json({
			success: false,
			message: 'User not found.'
		});
	} else {
		user.trees.push({name: data.name, skillIDs: []});
		user.save(function (err) {if (err) throw err;});
	}
});
setRoute.post('/addskilltotree', async function(req, res) { // to user tree
    var data = req.body;

    var user = await User.findOne({
        username: req.decoded.username
    }, function(err, user) {
        if (err) throw err;
		return user;
    });

	if (!user) {
		res.json({
			success: false,
			message: 'User not found.'
		});
	} else {
		user.trees.find(obj => obj._id == data.treeID).skillIDs.push(data.skillID);
		user.save(function (err) {if (err) throw err;});
	}
});

setRoute.post('/approvetree', function (req, res) {
	var data = req.body;

    var user = await User.findOne({
        username: req.decoded.username
    }, function(err, user) {
        if (err) throw err;
		return user;
    });

	if (!user) {
		res.json({
			success: false,
			message: 'User not found.'
		});
	} else {
		var tree = new Tree();
		tree = user.trees.find(obj => obj._id == data.treeID);
		tree.save(function (err) {if (err) throw err;});
	}
});

setRoute.post('/submitall', function(req, res) {
	var data = req.body;
    User.findOne({
        username: req.decoded.username
      }, function(err, user) {
        if (err) throw err;
        if (!user) {
          res.json({
            success: false,
            message: 'User not found.'
          });
        }
        else {
          for(var i = 0; i < data.length; ++i){
            user.skillData.find(obj => obj.treeID == data[i].treeID).skills = data[i].skills;
          }
          user.save(function (err) {
              if (err) throw err;
          });
        }
	});
});

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(443);

// Redirect from http port 80 to https
http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80);
