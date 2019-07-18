const fs = require('fs');
const http = require('http');
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
var ApprovableTree = require('./models/treesforapprovemodel')
var Skill = require('./models/skillmodel');
var ApprovableSkill = require('./models/skillsforapprovemodel');
var ApprovableTraining = require('./models/trainingsforapprovemodel');
var pbkdf2 = require('./pbkdf2'); // get hash generator and pw checker

const app = express();

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

app.get('/apitest', async function(req,res) {
	res.json({
		success: true
	});
});


app.post('/registration', async function(req, res) {
	// search for username in db
    var user = await findUser(req.body.username);

	if (!user) { // if new user
		var hashData = pbkdf2.hashPassword(req.body.password);

		var focusAreaTrees = await Tree.find({focusArea: req.body.focusArea}, {_id: 0, name: 1}, function (err, trees) {
							if (err) throw err;
							return trees;
						});

		for (var i = 0; i < focusAreaTrees.length; ++i) {
			focusAreaTrees[i] = focusAreaTrees[i].name; //	lehet enelkul?
		}

		// get all categories from db
		var categories = await Category.find({}, function (err, categories) {
							if (err) throw err;
							return categories;
						});

		var newUser = new User({
			username: req.body.username,
			email: req.body.email,
			hashData: hashData,
			categories: categories,
			/*focusArea: {
					name: req.body.focusArea,
					treeNames: focusAreaTrees,
				},
			willingToTeach: req.body.willingToTeach*/
		});

		newUser.save(function(err) {
			if (err) throw err;

			const payload = {
				username: req.body.username,
			};
			var token = jwt.sign(payload, app.get('superSecret'), {
				expiresIn: '1d' // expires in 1 hour
			});

			// return the information including token as JSON
			res.json({
				success: true,
				token: token,
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
                    admin: user.admin
                };
                var token = jwt.sign(payload, app.get('superSecret'), {
                    expiresIn: '1d' // expires in 1 hour
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
var protectedRoute = express.Router();
app.use('/protected', protectedRoute);


protectedRoute.use(function(req, res, next) {
    var token = req.get('x-access-token');

    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if (err) {
                return res.sendFile('login.html', { root: path.join(__dirname, './public') });
            } else {
                req.decoded = decoded;
                next();
            }
        });

    } else {
        return res.sendFile('login.html', { root: path.join(__dirname, './public') });
    }
});

protectedRoute.use(express.json());

protectedRoute.get('/userdata', function (req, res) {
    User.findOne({
        username: req.decoded.username
    }, async function(err, userdata) {
        if (err) throw err;

        if (!userdata) {
            res.json({
                success: false,
                message: 'User not found.'
            });
        } else if (userdata) {
			user = userdata.toObject();
			delete user.__v;
			delete user._id;
			//delete user.email;
			delete user.hashData;

			if (user.mainTree == undefined) { // first login
				var trees = await Tree.find({}, function (err, trees) {
									if (err) throw err;
									return trees;
								});

				user.allTreeNames = trees;
			}

            if (user.admin) {
                var trees = await ApprovableTree.find({}, function(err, trees) {
    		        if (err) throw err;
    				return trees;
    		    });

                var skills = await ApprovableSkill.find({}, function(err, skills) {
    		        if (err) throw err;
    				return skills;
    		    });

                var trainings = await ApprovableTraining.find({}, function(err, trainings) {
    		        if (err) throw err;
    				return trainings;
    		    });
                user.apprTrees = trees;
                user.apprSkills = skills;
                user.apprTrainings = trainings;
            }
      		return res.json(user);
      	}
    });
});

// getting the skilldata of a skillname (used for offers)
protectedRoute.get('/offers', function(req, res) {
	Skill.findOne({
		name: req.body.name
	}, async function(err, skilldata) {
		if(err) throw err;

		if(!skilldata){
			escape.json({
				success: false,
				message: 'User not found.'
			});
		} else if (skilldata) {
			skill = skilldata.toObject();

			return res.json(skilldata);
		}
	});
});

// getting the skilldata of a skillname (used for offers)
protectedRoute.get('/skillsforapproval', function(req, res) {
	ApprovableSkill.find({} , async function(err, skillsforapproval) {
		if(err) throw err;

		if(skillsforapproval !== undefined){
				return res.json(skillsforapproval);
		} else
			{
				res.json({
					success: false
				});
		}
	});
});

// Search for users to view by name
protectedRoute.post('/searchUsersByName', async function (req, res) {
		var data = req.body;
		var foundUsers = await User.find({
					"username": {$regex : ".*" + data.value + ".*", '$options' : 'i'}
			}, function (err, user) {
					if (err) throw err;
			return user;
		});
		var resUsers = [];
		for (var i = 0; i < foundUsers.length; i++) {
			resUsers[i] = {name: foundUsers[i].username};
		}
		res.json(resUsers);
});

// searchkes a skill for editor
protectedRoute.post('/searchSkillsByName', async function (req, res) {
		var data = req.body;

        var user = await findUser(req.decoded.username);

        user = user.toObject();
        var foundUserSkills = user.skills.filter(obj => obj.name.match(new RegExp(".*" + data.value + ".*", "i")) != null);

        var foundGlobalSkills = await Skill.find({
            "name": {$regex : ".*" + data.value + ".*", '$options' : 'i'}
        }, function (err, skills) {
            if (err) throw err;
            return skills;
        });

        var resSkills = [];
        for (var i = 0; foundUserSkills != undefined && i < foundUserSkills.length; i++) {
            resSkills.push({name: foundUserSkills[i].name});
        }
        for (var i = 0; i < foundGlobalSkills.length; i++) {
            if (resSkills.find(obj => obj == foundGlobalSkills[i].name) == undefined) resSkills[i] = {name: foundGlobalSkills[i].name};
        }
        res.json(resSkills);
});

// searchkes a skill for editor
protectedRoute.post('/searchUserSkillsByName', async function (req, res) {
		var data = req.body;

        var user = await findUser(req.decoded.username);

        user = user.toObject();
        var foundUserSkills = user.skills.filter(obj => obj.name.match(new RegExp(".*" + data.value + ".*", "i")) != null);

        var resSkills = [];
        for (var i = 0; foundUserSkills != undefined && i < foundUserSkills.length; i++) {
            resSkills.push({name: foundUserSkills[i].name});
        }

        res.json(resSkills);
});

// Search for trees to add while typing
protectedRoute.post('/searchTreesByName', async function (req, res) {
		var data = req.body;
		var foundTrees = await Tree.find({
					"name": {$regex : ".*" + data.value + ".*", '$options' : 'i'}
			}, function (err, tree) {
					if (err) throw err;
			return tree;
		});
		var resTrees = [];
		for (var i = 0; i < foundTrees.length; i++) {
			resTrees[i] = {name: foundTrees[i].name};
		}
		res.json(resTrees);
});


// Getting the name, willingToTeach, teachingDay, teachingTime, location, focusArea, skills and maintree of a user.
protectedRoute.post('/getPublicUserData', async function (req, res) {
		var data = req.body;
    var foundUsers = await User.find({
					"username": {$regex : ".*" + data.value + ".*", '$options' : 'i'}
			}, 'username mainTree willingToTeach teachingDay teachingTime location focusArea skills trees', function (err, user) {
					if (err) throw err;
			return user;
		});
		res.json(foundUsers);
});

// Getting the name, skillnames, focusarea of a tree.
protectedRoute.post('/getPublicTreeData', async function (req, res) {
		var data = req.body;
    var foundTrees = await Tree.find({
					"name": {$regex : ".*" + data.value + ".*", '$options' : 'i'}
			}, function (err, tree) {
					if (err) throw err;
			return tree;
		});
    res.json(foundTrees);
});

// Getting the name, caterory, descs of a skill, and give a list of the people, who have it.
protectedRoute.post('/getPublicSkillData', async function (req, res) {
    var data = req.body;
		var outData = []; // this is required, because adding a new param to a queried mongo object bugs rn.
		var outUsers = []; // array of users that have the skill.
    var foundSkills = await Skill.find({
				"name": {$regex : ".*" + data.value + ".*", '$options' : 'i'}
		}, 'name categoryName description descriptionWikipediaURL pointDescription', function(err, skill) {
				if (err) throw err;
				return skill;
		});
		for (var s = 0; s < foundSkills.length; s++) {
			foundSkills[s].users = [];
			var foundUsers = await User.find({}, 'username skills', function(err, user) {
				return user;
			});
			outUsers = [];
			for (var i = 0; i < foundUsers.length; i++) {
				if (foundUsers[i].skills.map(obj => obj.name).includes(foundSkills[s].name)) {
					outUsers.push({username: foundUsers[i].username, skill: foundUsers[i].skills.find(obj => obj.name == foundSkills[s].name)});
				}
			}
			outData.push({
				name: foundSkills[s].name,
				categoryName: foundSkills[s].categoryName,
				description: foundSkills[s].description,
				descriptionWikipediaURL: foundSkills[s].descriptionWikipediaURL,
				pointDescription: foundSkills[s].pointDescription,
				users: outUsers
			});
		}
    res.json(outData);
});

// Adds a public tree to the current user.
protectedRoute.post('/addTreeToUser', async function (req, res){
	var data = req.body;
	var user = await findUser(req.decoded.username);
	var tree = await Tree.findOne({"name": data.value},  function (err, tree) {
		if (err) throw err;
		return tree;
	});

	if (tree != undefined) {
		if (user.trees.find(obj => obj.name == tree.name) == undefined){
			await sortAndAddTreeToUser(tree, user);

			res.json({
				success: true,
				name: tree.name
			});
		} else {
			res.json({
				message: "existing",
				success: false
			});
		}
	} else {
		res.json({
			message: "notfound",
			success: false
		});
	}
});

// gets a skill and all it's dependencies by name.
protectedRoute.post('/getskill', async function (req, res) {
	var data = req.body;

    var user = await findUser(req.decoded.username);

	if (!user) {
		res.json({
			success: false,
			message: 'User not found.'
		});
	} else {
        var skill = user.skills.find(obj => obj.name == data.value);

        if (skill == undefined) {
          var skill = await findSkillByName(data.value);
        	if (!skill) {
        		res.json({
        			success: false
        		});
        	}
        }

    	var dependency = [];
    	await getDependency(user.skills, skill, dependency);

    	res.json({
    		success: true,
    		skill: skill,
    		dependency: dependency
    	});
    }
});

// recursive function for dependency determinating
async function getDependency (userSkills, skill, dependency) {
	var parents = [];
	for (var i = 0; skill.parents != undefined && i < skill.parents.length; ++i) {
        var parent = userSkills.find(obj => obj.name == skill.parents[i]);
        if (parent == undefined) {
            parent = await findSkillByName(skill.parents[i]);
        }

		parents.push(parent);
		dependency.push(parent);
	}

	for (var i = 0; i < parents.length; ++i) {
		await getDependency(userSkills, parents[i], dependency);
	}
}

async function insertSkill(skillToInsert, skillMatrix) {
	for (var component = 0; component < skillMatrix.length; component++) {
		for (var child = 0; child < skillToInsert.children.length; child++) {
			for (var row = 0; row < skillMatrix[component].length; row++) {
				if ((skillMatrix[component][row].map(obj => obj.name)).includes(skillToInsert.children[child].name)) {
					if (row == 0) {
						await addRowToComponent(skillMatrix, component);
						skillMatrix[component][0].push(skillToInsert);
						// console.log(skillToInsert.name + " added to root(skills child found in tree)"); // for debugging reasons
						// this checks if the row found was the root level.
						// if yes, it adds another row to the top, and inserts the skill there.
						return;
					}
					else {
						skillMatrix[component][row - 1].push(skillToInsert);
						// console.log(skillToInsert.name + " added to the row above(skills child found in tree)"); // for debugging reasons
						// if no, it inserts the skill to the row above.
						return;
					}
				}
			}
		}
		for (var par = 0; par < skillToInsert.parents.length; par++) {
			for (var row = 0; row < skillMatrix[component].length; row++) {
				if ((skillMatrix[component][row].map(obj => obj.name)).includes(skillToInsert.parents[par])) {
					if (skillMatrix[component][row + 1] == undefined) skillMatrix[component].push([]);
					skillMatrix[component][row + 1].push(skillToInsert);
					// console.log(skillToInsert.name + " added to the row below(skills parent found in tree.)"); // for debugging reasons
					// this checks if the skill has any parents in any row in any component,
					// if yes, then it inserts the skill to the row below.
					return;
				}
			}
		}
	}
	skillMatrix.push([[skillToInsert]]);
	// console.log(skillToInsert.name + " added to a new component."); // for debugging reasons
	// this inits the first element of every component
	return;
}

async function addRowToComponent(skillMatrix, component){
	skillMatrix[component].push([]);
	for (var i = skillMatrix[component].length - 2; i >= 0; i--) {
		skillMatrix[component][i + 1] = skillMatrix[component][i];
	}
	skillMatrix[component][0] = [];
}

async function assembleTree(skillMatrix){
	var assembledTree = [];
	var l = true;
	var j = 0;
	while (l) {
		l = false;
		for (var component = 0; component < skillMatrix.length; component++) {
			if (skillMatrix[component][j] != undefined) {
				l = true;
				assembledTree = assembledTree.concat(skillMatrix[component][j]);
			}
		}
		j++;
	}
	return assembledTree;
}

// gets the skillnames of a skillarray.
async function extractNames(skillArray){
	return skillArray.map(obj => obj.name);
}

// creates an ordered tree from an array of skills.
async function sortTree(skillArray){
	var sortedArray = []; // output array
	var skillMatrix = []; // 3d array, represents the components, the rows, and the elements of rows in the graph.
	for (var i = 0; i < skillArray.length; i++) {
		await insertSkill(skillArray[i], skillMatrix);
	}
	sortedArray = await assembleTree(skillMatrix);
	skillArray = await extractNames(sortedArray);
	return skillArray;
}

async function sortAndAddTreeToUser(treeToSort, user){
	var skills = await Skill.find({
		name: treeToSort.skillNames,
	}, function (err, skills) {
		if (err) throw err;
		return skills;
	});

	var sn = await sortTree(skills);
	user.trees.push({
		name: treeToSort.name,
		focusArea: treeToSort.focusArea,
		description: treeToSort.description,
		skillNames: sn
	});

	await skills.forEach(function (skill) {
		skill.achievedPoint = 0;
		if (user.skills.find(obj => obj.name == skill.name) == undefined){
			user.skills.push(skill);
		}});

	user.save(function (err) {if (err) throw err;});
	return;
}

protectedRoute.post('/newtraining', async function(req, res) {
    var data = req.body;

    var user = await findUser(req.decoded.username);

	if (!user) {
		res.json({
			success: false,
			message: 'User not found.'
		});
	} else if (user.skills.find(obj => obj.name == data.skillName) != undefined) {
        for (var i = 0; i < data.trainings.length; ++i) {
            user.skills.find(obj => obj.name == data.skillName).trainings.push({
                name: data.trainings[i].name,
                level: data.trainings[i].level,
                shortDescription: data.trainings[i].shortDescription,
                URL: data.trainings[i].URL,
                goal: data.trainings[i].goal,
                length: data.trainings[i].length,
                language: data.trainings[i].language
            });
        }

		user.save(function (err) {if (err) throw err;});

		for (var i = 0; i < data.trainings.length; ++i) {
			var apprTraining = new ApprovableTraining({
				username: user.username,
				skillName: data.skillName,
				name: data.trainings[i].name,
				level: data.trainings[i].level,
				shortDescription: data.trainings[i].shortDescription,
				URL: data.trainings[i].URL,
				goal: data.trainings[i].goal,
				length: data.trainings[i].length,
				language: data.trainings[i].language
			});

			apprTraining.save(function (err) {if (err) throw err;});
		}

		res.json({
			success: true
		});
	} else {
		res.json({
			success: false,
			message: 'skillnotexists'
		});
	}
});

// Creates a skill from the data the user added.
protectedRoute.post('/newskill', async function(req, res) {
    var data = req.body;

    var user = await findUser(req.decoded.username);

	if (!user) {
		res.json({
			success: false,
			message: 'User not found.'
		});
	} else if (user.skills.find(obj => obj.name == data.name) == undefined) {
        var parentNames = [];
        for (var i = 0; i < data.parents.length; ++i) {
            if (user.skills.find(obj => obj.name == data.parents[i].name) == undefined) { // add parent skill to user if not already there
                var parent = await findSkillByName(data.parents[i].name);
                user.skills.push(parent);
            }
            // add new skill as child of parent skill
            user.skills.find(obj => obj.name == data.parents[i].name).children.push({name: data.name, minPoint: data.parents[i].minPoint, recommended: data.parents[i].recommended});
            // when we save the new skill we only need the name of the parents (no minPoint and recommended)
            parentNames.push(data.parents[i].name);
        }

				user.skills.push({
	      	name: data.name,
	      	description: data.description,
					descriptionWikipediaURL: data.descriptionWikipediaURL,
	      	skillIcon: data.skillIcon,
	      	categoryName: data.categoryName,
	      	achievedPoint: 0,
	      	maxPoint: data.maxPoint,
	      	pointDescription: data.pointDescription,
	      	parents: parentNames,
	      	//children: data.children,
	      	trainings: data.trainings
	      });

        /*for (var i = 0; i < data.children.length; ++i) {
            user.skills.find(obj => obj.name == data.children[i].name).parents.push(data.name);
        }*/

        user.save(function (err) {if (err) throw err;});

		for (var i = 0; i < data.parents.length; ++i) {
			var apprParent = await ApprovableSkill.find({
				name: data.parents[i].name
			}, function (err, skill) {
				if (err) throw err;
				return skill;
			});

			if (apprParent != undefined) {
				apprParent.children.push({name: data.name, minPoint: data.parents[i].minPoint, recommended: data.parents[i].recommended});
				apprParent.save(function (err) {if (err) throw err;});
			}
		}

		var apprSkill = new ApprovableSkill({
			username: user.username,
			name: data.name,
			description: data.description,
			descriptionWikipediaURL: data.descriptionWikipediaURL,
			skillIcon: data.skillIcon,
			categoryName: data.categoryName,
			maxPoint: data.maxPoint,
			pointDescription: data.pointDescription,
			parents: parentNames,
			children: data.children,
			trainings: data.trainings
		});

		apprSkill.save(function (err) {if (err) throw err;});

		res.json({
			success: true
		});
	} else {
		res.json({
			success: false,
			message: 'skillexists'
		});
	}
});

// creates a new tree only for the user.
protectedRoute.post('/newtree', async function (req, res) {
	var data = req.body;
    var user = await findUser(req.decoded.username);
	if (!user) {
		res.json({
			success: false,
			message: 'User not found.'
		});
	}
	else if (user.trees.find(obj => obj.name == data.name) == undefined) {
		var sn = await sortTree(data.skills);
		user.trees.push({
				name: data.name,
				focusArea: data.focusArea,
				description: data.description,
				skillNames: sn
			});

		await data.skills.forEach(async function (skill) {

		skill.achievedPoint = 0;
		if (user.skills.find(obj => obj.name == skill.name) == undefined) {
			user.skills.push(skill);
		}
		});

		user.save(function (err) {if (err) throw err;});

		var tree = new ApprovableTree({
			name: data.name,
			username: user.username,
			focusArea: data.focusArea,
			description: data.description,
			skillNames: sn
		});

		tree.save(function (err) {if (err) throw err;});

		res.json({
			success: true
		});
	}
	else {
		res.json({
			success: false,
			message: 'treeexists'
		});
	}
});

// creates a new tree only for the user.
protectedRoute.post('/editmytree', async function (req, res) {
    var data = req.body;
    var user = await findUser(req.decoded.username);

    if (!user) {
        res.json({
            success: false,
            message: 'User not found.'
        });
    } else if (user.trees.find(obj => obj.name == data.name) != undefined) {
        var sn = await sortTree(data.skills);
        user.trees = user.trees.filter(obj => obj.name != data.name);
        user.trees.push({
			name: data.name,
			focusArea: data.focusArea,
			description: data.description,
			skillNames: sn
		});

        await data.skills.forEach(async function (skill) {
        	if (skill.achievedPoint == undefined) skill.achievedPoint = 0;
            if (user.skills.find(obj => obj.name == skill.name) == undefined) {
                user.skills.push(skill);
            }
        });

        user.save(function (err) {if (err) throw err;});

        res.json({
            success: true
        });
    } else {
        res.json({
            success: false,
            message: 'tree not exists'
        });
    }
});

protectedRoute.post('/editmyskill', async function (req, res) {
	var data = req.body;
    var user = await findUser(req.decoded.username);

    if (!user) {
        res.json({
            success: false,
            message: 'User not found.'
        });
    } else if (user.skills.find(obj => obj.name == data.name) != undefined) {
		var skill = (user.skills.find(obj => obj.name == data.name));

		for (var i = 0; i < skill.parents.length; ++i) user.skills.find(obj => obj.name == skill.parents[i]).children = user.skills.find(obj => obj.name == skill.parents[i]).children.filter(obj => obj.name != skill.name);
		for (var i = 0; i < skill.children.length; ++i) {
			if (user.skills.find(obj => obj.name == skill.children[i].name) != undefined) user.skills.find(obj => obj.name == skill.children[i].name).parents = user.skills.find(obj => obj.name == skill.children[i].name).parents.filter(obj => obj != skill.name);
		}

		var parentNames = [];
        for (var i = 0; i < data.parents.length; ++i) {
            if (user.skills.find(obj => obj.name == data.parents[i].name) == undefined) { // add parent skill to user if not already there
                var parent = await findSkillByName(data.parents[i].name);
                user.skills.push(parent);
            }
            // add new skill as child of parent skill
            user.skills.find(obj => obj.name == data.parents[i].name).children.push({name: data.name, minPoint: data.parents[i].minPoint, recommended: data.parents[i].recommended});
            // when we save the new skill we only need the name of the parents (no minPoint and recommended)
            parentNames.push(data.parents[i].name);
        }

		for (var i = 0; i < data.children.length; ++i) {
            if (user.skills.find(obj => obj.name == data.children[i].name) == undefined) { // add parent skill to user if not already there
                var child = await findSkillByName(data.child[i].name);
                user.skills.push(child);
            }
            // add new skill as child of parent skill
            user.skills.find(obj => obj.name == data.children[i].name).parents.push(data.name);

			var trees = user.trees.filter(obj => obj.skillNames.find(obj => obj == data.children[i].name) != undefined);
			for (var j = 0; j < trees.length; ++j) {
				var skillList = trees[j].skillNames;
				if (skillList.find(obj => obj == data.name) == undefined) skillList.push(data.name);
				var skillsToSort = [];
				for (var k = 0; k < skillList.length; ++k) skillsToSort = user.skills.filter(obj => skillList.find(obj2 => obj2 == obj.name) != undefined);
				var sn = await sortTree(skillsToSort);
				user.trees.find(obj => obj.name == trees[j].name).skillNames = sn;
			}
        }

				skill.name = data.name;
				skill.description = data.description;
				skill.descriptionWikipediaURL = data.descriptionWikipediaURL;
				skill.skillIcon = data.skillIcon;
				skill.categoryName = data.categoryName;
				skill.maxPoint = data.maxPoint;
				skill.pointDescription = data.pointDescription;
				skill.parents = parentNames;
				skill.children = data.children;
				skill.trainings = data.trainings;

		if (data.maxPoint < skill.achievedPoint) skill.achievedPoint = data.maxPoint;

		//user.skills.find(obj => obj.name == data.name) = skill;
		user.save(function (err) {if (err) throw err;});

        res.json({
            success: true
        });
	} else {
		res.json({
            success: false,
            message: 'skill not exists'
        });
	}
});

protectedRoute.post('/deletemytree', async function (req, res) {
    var data = req.body;
    var user = await findUser(req.decoded.username);

    if (!user) {
        res.json({
            success: false,
            message: 'User not found.'
        });
    } else if (user.trees.find(obj => obj.name == data.name) != undefined) {
        user.trees = user.trees.filter(obj => obj.name != data.name);
        user.save(function (err) {if (err) throw err;});

        res.json({
            success: true
        });
    } else {
        res.json({
            success: false,
            message: 'tree not exists'
        });
    }
});

// Search for trees to add while typing
protectedRoute.post('/gettree', async function (req, res) {
		var data = req.body;
		var foundTree = await Tree.findOne({
					"name": data.name
			}, function (err, tree) {
					if (err) throw err;
			return tree;
		});
		res.json(foundTree);
});

// add skill to user tree
protectedRoute.post('/addskilltotree', async function(req, res) {
    var data = req.body;

    var user = await findUser(req.decoded.username);

	if (!user) {
		res.json({
			success: false,
			message: 'User not found.'
		});
	} else {
		user.trees.find(obj => obj.name == data.treeName).skillNames.push(data.name);
		user.save(function (err) {if (err) throw err;});
	}
});

// gets the skilldata of a skillname
protectedRoute.post('/skilldata', function(req, res) {
	Skill.findOne({
		name: req.body.name
	}, async function(err, skilldata) {
		if(err) throw err;

		if(!skilldata){
			escape.json({
        // FIXME
				succes: false,
				message: 'Skill not found.'
			});
		} else if (skilldata) {
			//skill = skilldata.toObject();

			return res.json(skilldata);
		}
	});
});

// sets the user data aquired from the first login
protectedRoute.post('/firstlogindata', async function (req, res) {
	var data = req.body;

	var user = await findUser(req.decoded.username);

	if (!user) {
		res.json({
			success: false,
			message: 'User not found.'
		});
	} else {
		user.focusArea.name = data.focusArea;
		user.mainTree = data.mainTree;

		var mainTree = await Tree.findOne({
			name: user.mainTree,
		}, function (err, tree) {
			if (err) throw err;
			return tree;
		});

		await sortAndAddTreeToUser(mainTree, user);

		res.json({
			success: true,
		});
	}
});

// submits all changes made by the user to the skills.
protectedRoute.post('/submitall', async function (req, res) {
	var data = req.body;

    var user = await findUser(req.decoded.username);

	if (!user) {
		res.json({
			success: false,
			message: 'User not found.'
		});
	} else {
		for (var i = 0; i < data.length; ++i) user.skills[i].achievedPoint = data[i].achievedPoint;

		if (user.willingToTeach) {
			var globalSkills = await Skill.find({}, function(err, skills) {
		        if (err) throw err;
				return skills;
		    });

			data.forEach(function (userSkill) {
                var globalSkill = globalSkills.find(obj => obj.name == userSkill.name);
                if (globalSkill != undefined) {
                    if (userSkill.achievedPoint > 0) {
                        if (globalSkill.offers.find(obj => obj.username == user.username) == undefined) {
                            globalSkills.find(obj => obj.name == userSkill.name).offers.push({
                                username: user.username,
                                location: user.location,
                                teachingDay: user.teachingDay,
                                teachingTime: user.teachingTime,
                                achievedPoint: userSkill.achievedPoint,
                            });
                        } else globalSkill.offers.find(obj => obj.username == user.username).achievedPoint = userSkill.achievedPoint;
                    } else {
                        if (globalSkill.offers.find(obj => obj.username == user.username) != undefined) {
                            globalSkills.find(obj => obj.name == userSkill.name).offers = globalSkill.offers.filter(obj => obj.username != user.username);
                        }
                    }
                }
			});
			globalSkills.forEach(function (skill) {
				skill.save(function (err) {if (err) throw err;});
			});
		}
		user.save(function (err) {if (err) throw err;});
		res.json({
			success: true,
		});
	}
});

// searches a userskill
protectedRoute.post('/searchUserSkillByName', async function (req, res) {

	var user = await findUser(req.decoded.username);

	var skill = user.skills.find(obj => obj.name == req.body.name);

	res.json(skill);
});

/*protectedRoute.post('/parentTableData', async function (req, res) {

	var user = await findUser(req.decoded.username);


	var parents = [];
	req.body.parents.forEach(function(parentname){

		//find the parent, each of them in the foreach 1 by 1
		var parent = user.skills.find(obj => obj.name == parentname);

		//find the child in the parent for minpoint and recommended
		var child = parent.children.find(obj => obj.name == req.body.name );


		//build the json file we need
		var name_minpoint_required = {
			name: parent.name,
			minPoint: child.minPoint,
			recommended: child.recommended
		}

		//push the json file to an array that we are going to return, includes all rows for the table.
		parents.push(name_minpoint_required);
	});

	res.json(parents);
});*/

//API call for request onclick
protectedRoute.post('/request', async function (req, res){

	var user = await await findUser(req.decoded.username);

	var skill = await findSkillByName(req.body.name);

	if (skill !== undefined) {
		var userskill = user.skills.find(obj => obj.name == skill.name);

		if(req.body.requestType == "beginner")
		{
			if(skill.beginnerRequests.find(obj => obj.username == user.username) == undefined)
			{
				skill.beginnerRequests.push({	username: user.username,
										achievedPoint: userskill.achievedPoint,
										email: user.email  });

				skill.save(function (err) {if (err) throw err;});

				res.json({
					succes: true,
					message: 'Added request.',
					sumRequest: skill.beginnerRequests.length
				});
			}
			else
			{
				res.json({
					succes: false,
					message: 'Already requested.',
					sumRequest: skill.beginnerRequests.length
				});
			}
		}

		if(req.body.requestType == "intermediate")
		{
			if(skill.intermediateRequests.find(obj => obj.username == user.username) == undefined)
			{
				skill.intermediateRequests.push({	username: user.username,
										achievedPoint: userskill.achievedPoint,
										email: user.email  });

				skill.save(function (err) {if (err) throw err;});

				res.json({
					succes: true,
					message: 'Added request.',
					sumRequest: skill.intermediateRequests.length
				});
			}
			else
			{
				res.json({
					succes: false,
					message: 'Already requested.',
					sumRequest: skill.intermediateRequests.length
				});
			}
		}

		if(req.body.requestType == "advanced")
		{
			if(skill.advancedRequests.find(obj => obj.username == user.username) == undefined)
			{
				skill.advancedRequests.push({	username: user.username,
										achievedPoint: userskill.achievedPoint,
										email: user.email  });
				skill.save(function (err) {if (err) throw err;});
				res.json({
					succes: true,
					message: 'Added request.',
					sumRequest: skill.advancedRequests.length
				});
			}
			else
			{
				res.json({
					succes: false,
					message: 'Already requested.',
					sumRequest: skill.advancedRequests.length
				});
			}
		}
	}
	else
	{
		res.json({
			succes: false,
			message: "Skill not found"
		});
	}

});

protectedRoute.post('/endorse', async function (req, res) {
  var data = req.body;
  var user = await findUser(data.username);
  if (!user) {
    res.json({
      success: false,
      message: 'User not found.'
    });
  } else {
    if (user.skills.find(obj => obj.name == data.skillName).endorsement == undefined) user.skills.find(obj => obj.name == data.skillName).endorsement = [];
    if (user.skills.find(obj => obj.name == data.skillName).endorsement.find(obj => obj == req.decoded.username) == undefined) {
      user.skills.find(obj => obj.name == data.skillName).endorsement.push(req.decoded.username);
			user.save(function (err) {if (err) throw err;});

      res.json({
  			success: true
  		});
    }
  }
});

protectedRoute.post('/newpassword', async function (req, res) {
  var data = req.body;
  var user = await findUser(req.decoded.username);
  if (!user) {
    res.json({
      success: false,
      message: 'User not found.'
    });
  } else {
	  if (!pbkdf2.verifyPassword(data.oldPassword, user.hashData)) {
		  res.json({
			  success: false,
			  message: 'wrong password'
		  });
	  } else {
		  user.hashData = pbkdf2.hashPassword(data.newPassword);
		  user.save(function (err) {if (err) throw err;});

		  res.json({
			  success: true
		  });
	  }
  }
});



protectedRoute.post('/newplace', async function (req, res) {
  var data = req.body;
  var user = await findUser(req.decoded.username);
  if (!user) {
    res.json({
      success: false,
      message: 'User not found.'
    });
  } else {
	  user.location = data.location;
	  user.save(function (err) {if (err) throw err;});

	  res.json({
	  	success: true
	  });
  }
});


protectedRoute.post('/newemail', async function (req, res) {
  var data = req.body;
  var user = await findUser(req.decoded.username);
  if (!user) {
    res.json({
      success: false,
      message: 'User not found.'
    });
  } else {
	  user.email = data.email;
	  user.save(function (err) {if (err) throw err;});

	  res.json({
	  	success: true
	  });
  }
});

protectedRoute.post('/newhelp', async function (req, res) {
  var data = req.body;
  var user = await findUser(req.decoded.username);
  if (!user) {
    res.json({
      success: false,
      message: 'User not found.'
    });
  } else {
	  user.willingToTeach = data.help;
	  user.save(function (err) {if (err) throw err;});

	  res.json({
	  	success: true
	  });
  }
});

/*
*   ADMIN
*/
var adminRoute = express.Router();
app.use('/admin', adminRoute);

adminRoute.use(function(req, res, next) {
    var token = req.get('x-access-token');

    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if (err) {
                return res.status(403).send({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else if (decoded.admin) {
                req.decoded = decoded;
                next();
            } else {
                return res.status(403).send({
                    success: false,
                    message: 'Not admin.'
                });
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

adminRoute.use(express.json());

//Approve a skill thats sent in the body as skillforaproval to the api
adminRoute.post('/approveskill', async function (req, res)  {
	var skillforapproval = req.body;
	var approvecollection = await ApprovableSkill.find( {} , async function(err, approvecollection) {
		if(err) throw err;
		else return approvecollection;
	});

	//Look for the skill in the database, if already exists
	var globalskill = undefined;
	globalskill = await findSkillByName(skillforaproval.name);

	//Check if skill is already in the database or not
	if(globalskill !== null )
	{
		res.json({
			success: false,
			message: "Skill already exists"
		});
	}
	else  //If its not, add to the database
	{
		newGlobalSkill = new Skill({
			name: skillforapproval.name,
			categoryName: skillforapproval.categoryName,
			skillIcon: skillforapproval.skillIcon,
			description: skillforapproval.description,
			descriptionWikipediaURL: skillforapproval.descriptionWikipediaURL,
			pointDescription: skillforapproval.pointDescription,
			maxPoint: skillforapproval.maxPoint,
			parents: skillforapproval.parent,
			children: [
				{
					name: skillforapproval.name,
					minPoint: skillforapproval.minPoint,
					recommended: skillforapproval.recommended
				}
			],
			trainings: [
				{
					name: skillforapproval.training.name,
					level: skillforapproval.training.level,
					shortDescription: skillforapproval.training.shortDescription,
					URL: skillforapproval.training.URL,
					goal: skillforapproval.training.goal,
					length: skillforapproval.traininglength,
					language: skillforapproval.training.language
				}
			]
		});
		newGlobalSkill.save();

		console.log(approvecollection);
		console.log("----------");
		var dependency = [];
		await getDependency(approvecollection, skillforapproval, dependency);

		console.log(dependency);

		var lastdependency = dependency[dependency.length-1];

		for(var i=0;i<dependency.length;i++)
		{
			var globalskill = await findSkillByName(dependency[i].name);
			if(globalskill !== null)
			{
				res.json({
					success: false,
					message: "dependency " +i + " " + dependency[i].name + " is already in database"
				});
			}
			else
			{
				newGlobalSkill = new Skill({
					name: dependency[i].name,
					categoryName: dependency[i].categoryName,
					skillIcon: dependency[i].skillIcon,
					description: dependency[i].description,
					pointDescription: dependency[i].pointDescription,
					maxPoint: dependency[i].maxPoint,
					parents: dependency[i].parent,
					children: [
						{
							name: dependency[i].name,
							minPoint: dependency[i].minPoint,
							recommended: dependency[i].recommended
						}
					],
					trainings: [
						{
							name: dependency[i].training.name,
							level: dependency[i].training.level,
							shortDescription: dependency[i].training.shortDescription,
							URL: dependency[i].training.URL,
							goal: dependency[i].training.goal,
							length: dependency[i].traininglength,
							language: dependency[i].training.language
						}
					]
				});
				newGlobalSkill.save();
			}
		}

		for(var i=0; i<lastdependency.parents.length; i++)
		{
			var lastdependencyParent =  await Skill.find( { name : lastdependency.parents[i] } , async function(err, lastdependencyParent){
				if(err) throw err;
				else return lastdependencyParent;
			});

			lastdependencyParent.children.push({
				name: lastdependency.name,
				minPoint: 0, //TODO skillsforapproval model to be changed, got no real data to be read
				recommended: false // ^
			});

			lastdependencyParent.save();

			res.json({
				message: "Succes",
				success: true
			});
		}
	}
});

adminRoute.post('/edittree', async function (req, res) {
    var data = req.body;

    var globalTree = await Tree.findOne({
                "name": data.name
        }, function (err, tree) {
                if (err) throw err;
        return tree;
    });

    var sn = await sortTree(data.skills);
    globalTree.focusArea = data.focusArea;
	globalTree.description = data.description;
    globalTree.skillNames = sn;
    globalTree.save(function (err) {if (err) throw err;});

    User.find({} , (err, users) => {
        if (err) throw err;

        users.map(user => {
            if (user.trees.find(obj => obj.name == data.name) != undefined) {
                user.trees.find(obj => obj.name == data.name).focusArea = data.focusArea;
				user.trees.find(obj => obj.name == data.name).description = data.description;
                user.trees.find(obj => obj.name == data.name).skillNames = sn;

                user.save(function (err) {if (err) throw err;});
            }
        })
    });
    res.json({
        success: true
    });
});

adminRoute.post('/editskill', async function (req, res) {
	var data = req.body;

	var skill = await findSkillByName(data.name);

	for (var i = 0; i < skill.parents.length; ++i) {
		var parent = await findSkillByName(skill.parents[i]);

		parent.children = parent.children.filter(obj => obj.name != skill.name);

		parent.save(function (err) {if (err) throw err;});
	}

	for (var i = 0; i < skill.children.length; ++i) {
		var child = await findSkillByName(skill.children[i].name);

		child.parents = child.parents.filter(obj => obj != skill.name);

		child.save(function (err) {if (err) throw err;});
	}

	skill.name = data.name;
	skill.description = data.description;
	skill.descriptionWikipediaURL = data.descriptionWikipediaURL;
	skill.skillIcon = data.skillIcon;
	skill.categoryName = data.categoryName;
	skill.maxPoint = data.maxPoint;
	skill.pointDescription = data.pointDescription;
	skill.parents = data.parents.map(obj => obj.name);
	skill.children = data.children;
	skill.trainings = data.trainings;

	if (data.maxPoint < skill.achievedPoint) skill.achievedPoint = data.maxPoint;

	skill.save(function (err) {if (err) throw err;});

	User.find({} , async function (err, users) {
        if (err) throw err;

        users.map(async function (user)  {
			if (user.skills.find(obj => obj.name == data.name) != undefined) {
				var userSkill = (user.skills.find(obj => obj.name == data.name));

				for (var i = 0; i < userSkill.parents.length; ++i) user.skills.find(obj => obj.name == userSkill.parents[i]).children = user.skills.find(obj => obj.name == userSkill.parents[i]).children.filter(obj => obj.name != userSkill.name);
				for (var i = 0; i < userSkill.children.length; ++i) {
					if (user.skills.find(obj => obj.name == userSkill.children[i].name) != undefined) user.skills.find(obj => obj.name == userSkill.children[i].name).parents = user.skills.find(obj => obj.name == userSkill.children[i].name).parents.filter(obj => obj != userSkill.name);
				}

				var parentNames = [];
		        for (var i = 0; i < data.parents.length; ++i) {
		            if (user.skills.find(obj => obj.name == data.parents[i].name) == undefined) { // add parent skill to user if not already there
		                var parent = await findSkillByName(data.parents[i].name);
		                user.skills.push(parent);
		            }
		            // add new skill as child of parent skill
		            user.skills.find(obj => obj.name == data.parents[i].name).children.push({name: data.name, minPoint: data.parents[i].minPoint, recommended: data.parents[i].recommended});
		            // when we save the new skill we only need the name of the parents (no minPoint and recommended)
		            parentNames.push(data.parents[i].name);
		        }

				for (var i = 0; i < data.children.length; ++i) {
		            if (user.skills.find(obj => obj.name == data.children[i].name) == undefined) { // add parent skill to user if not already there
		                var child = await findSkillByName(data.children[i].name);
		                user.skills.push(child);
		            }
		            // add new skill as child of parent skill
		            user.skills.find(obj => obj.name == data.children[i].name).parents.push(data.name);

					var trees = user.trees.filter(obj => obj.skillNames.find(obj => obj == data.children[i].name) != undefined);
					for (var j = 0; j < trees.length; ++j) {
						var skillList = trees[j].skillNames;
						if (skillList.find(obj => obj == data.name) == undefined) skillList.push(data.name);
						var skillsToSort = [];
						for (var k = 0; k < skillList.length; ++k) skillsToSort = user.skills.filter(obj => skillList.find(obj2 => obj2 == obj.name) != undefined);
						var sn = await sortTree(skillsToSort);
						user.trees.find(obj => obj.name == trees[j].name).skillNames = sn;
					}
		        }

				userSkill.name = data.name;
		    userSkill.description = data.description;
				userSkill.descriptionWikipediaURL = data.descriptionWikipediaURL;
		    userSkill.skillIcon = data.skillIcon;
		    userSkill.categoryName = data.categoryName;
		    userSkill.maxPoint = data.maxPoint;
		    userSkill.pointDescription = data.pointDescription;
				userSkill.parents = parentNames;
				userSkill.children = data.children;
		    userSkill.trainings = data.trainings;

				if (data.maxPoint < userSkill.achievedPoint) userSkill.achievedPoint = data.maxPoint;

				//user.skills.find(obj => obj.name == data.name) = skill;
				user.save(function (err) {if (err) throw err;});
			}
        })
    })

	res.json({
		success: true
	});
});

// approves a tree.
adminRoute.post('/approvetree', async function (req, res) {
    var data = req.body;

    var globalTree = await Tree.findOne({
        name: data.name
    }, function(err, tree) {
        if (err) throw err;
		return tree;
    });

    if (globalTree == undefined) {
        var tree = await ApprovableTree.findOne({
            username: data.username,
            name: data.name
        }, function(err, tree) {
            if (err) throw err;
            return tree;
        });

        var newTree = new Tree({
            name: tree.name,
            focusArea: tree.focusArea,
			description: tree.description,
            skillNames: tree.skillNames
        });

        newTree.save(function (err) {if (err) throw err;});

        await ApprovableTree.remove({ // delete ALL trees from approve with this name
            name: data.name
        });
    }
});

adminRoute.post('/approvetraining', async function (req, res) {
	var data = req.body;

    var globalSkill = await findSkillByName(data.skillName);

    if (globalSkill.trainings.find(obj => obj.name == data.name) == undefined) {
        var training = await ApprovableTraining.findOne({
            username: data.username,
            skillName: data.skillName,
            name: data.name
        }, function(err, training) {
            if (err) throw err;
            return training;
        });

        globalSkill.trainings.push({
            name: training.name,
            level: training.level,
            shortDescription: training.shortDescription,
            URL: training.URL,
            goal: training.goal,
            length: training.length,
            language: training.language
        });

        globalSkill.save(function (err) {if (err) throw err;});

        User.find({} , (err, users) => {
            if (err) throw err;

            users.map(user => {
                if (user.skills.find(obj => obj.name == data.skillName) != undefined) {
                    user.skills.find(obj => obj.name == data.skillName).trainings.push({
                        name: training.name,
                        level: training.level,
                        shortDescription: training.shortDescription,
                        URL: training.URL,
                        goal: training.goal,
                        length: training.length,
                        language: training.language
                    });

                    user.save(function (err) {if (err) throw err;});
                }
            })
        });
        await ApprovableTraining.remove({ // delete ALL trainings for the skill from approve with this name
            skillName: data.skillName,
            name: data.name
        });
    }
});

//drops the offers from global skills. Needed if we delete users
adminRoute.post('/dropoffers', async function (req, res) {
	Skill.find({} , (err, skills) => {
		if(err) console.log("error");
		skills.map(skill => {
			skill.offers = [];
			skill.save(  function (err) {if (err) throw err;} );
		})
	})
});

adminRoute.post('/setadmin', async function (req, res) {
	User.findOne({
        username: req.body.username
    }, function(err, user) {
        if (err) throw err;

        if (!user) {
            res.json({
                success: false,
                message: 'User not found.'
            });
        } else if (user) {
			if (req.body.give) user.admin = true;
			else user.admin = false;
			user.save(function (err) {if (err) throw err;});

			res.json({
				success: true
			});
		}
	});
});

/*
*   END OF ADMIN
*/

//DELETE FUNCTIONS, to be separated in a delete.js file or smth

adminRoute.post('/deleteUser', async function (req,res){
	User.deleteOne( {username: request.body.username }  , function (err) {
		if (err) throw err;
		else res.json({
			success: true,
			message: "User deleted"
		})
	});
});

adminRoute.get('/testAdmin', async function (req,res){
	res.json({
		success: true
	});
});

///////////////// END of DELETE SECTION

// returns the user data of the username provided
async function findUser(unm) {
	var user = await User.findOne({
		username: unm,
	}, function (err, user) {
		if (err) throw err;
		return user;
	});
	return user;
}

// returns the skill data of the skillname provided
async function findSkillByName(qname){
	var skillToReturn = await Skill.findOne({
		"name": qname
	}, function (err, parent) {
		if (err) throw err;
		return skillToReturn;
	});
	return skillToReturn;
}

module.exports = app;

const httpServer = http.createServer(app);
httpServer.listen(3000);
