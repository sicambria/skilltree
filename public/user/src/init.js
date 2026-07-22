// get data from server
function initData(){
  var dataRequest = new XMLHttpRequest();
  dataRequest.open('GET', '/protected/userdata', true);
  dataRequest.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  dataRequest.setRequestHeader('x-access-token', localStorage.getItem("loginToken"));
  dataRequest.responseType = "json";
  dataRequest.onreadystatechange = function() {
      if(dataRequest.readyState == 4 && dataRequest.status == 200) {
          data = dataRequest.response;
          if (data.admin) document.getElementById('openAdminMenu').style.display = "block";
          checkFirstLogin();
          initUI(true, data);

          document.getElementById("home").onclick = function () {
              document.getElementById('submitBtn').style.display = "block";
              showTree(data.mainTree, data, true);
              initUI(true, data);
          };
      }
  }
  dataRequest.send();
}

// initializes the data of the card on the top-right corner of the page.
function initUI(self, _data){
  var card_username = document.getElementById('card_username');
  if (card_username) {
    if (self) {
      card_username.innerHTML = "Welcome " + _data.username + "!";
    }
    else {
      card_username.innerHTML = "You're now viewing " + _data.username + "'s data.";
    }
  }
  initCard();
  switchSearch("Skill");
}

// initalizes the card on the top left corner of the screen
function initCard(){
  var treeCount = document.getElementById('treeCount');
  var skillCount = document.getElementById('skillCount');
  var pointCount = document.getElementById('pointCount');
  var cardUserName = document.getElementById('cardUserName');
  var cardMainTree = document.getElementById('cardMainTree');

  treeCount.innerHTML = data.trees.length + "<br>trees";
  skillCount.innerHTML = data.skills.length + "<br>skills";
  pointCount.innerHTML = data.skills.sum("achievedPoint") + "<br>points";
  cardUserName.innerHTML = data.username;
  cardMainTree.innerHTML = data.mainTree;

  var username = document.getElementById('username');
  var place = document.getElementById('place');
  var email = document.getElementById('email');

  username.innerText = data.username;
  place.value = data.location;
  email.value = data.email;
}

var onboardingStep = 1;

// checks if the login is 1st time and shows onboarding wizard if yes
function checkFirstLogin() {
    if (data.mainTree != undefined) { startLoader(); return; }
    var modal = document.getElementById('firstLogin');
    var focusArea = document.getElementById('focusareasel');
    var mainTree = document.getElementById('maintree');

    document.getElementById('onboardingNext1').onclick = function() {
        if (!focusArea.value || !mainTree.value) {
            showBottomAlert('Please select both a focus area and a skill tree.');
            return;
        }
        document.getElementById('onboardingStep1').style.display = 'none';
        document.getElementById('onboardingStep2').style.display = 'block';
        loadOnboardingSkills();
    };

    document.getElementById('onboardingNext2').onclick = function() {
        document.getElementById('onboardingStep2').style.display = 'none';
        document.getElementById('onboardingStep3').style.display = 'block';
        prefillLearningPlan();
    };

    document.getElementById('onboardingFinish').onclick = function() {
        saveOnboardingData();
    };

    document.getElementById('savebtn').onclick = function() {
        window.open("/user/", "_self");
    };

    modal.style.display = "block";
}

function loadOnboardingSkills() {
    var container = document.getElementById('onboardingSkills');
    container.innerHTML = '';
    if (!data.allTreeNames) return;
    var mainTreeName = document.getElementById('maintree').value;
    var treeData = data.allTreeNames.find(function(t) { return t.name == mainTreeName; });
    var skillNames = treeData ? (treeData.skillNames || []).slice(0, 5) : [];
    for (var i = 0; i < skillNames.length; ++i) {
        var div = document.createElement('div');
        div.className = 'form-group row';
        div.innerHTML = '<label class="col-sm-6 col-form-label">' + escHtml(skillNames[i]) + '</label>' +
            '<div class="col-sm-6">' +
            '<select class="form-control onboarding-skill-level" data-skill="' + escHtml(skillNames[i]) + '">' +
            '<option value="0">Not rated</option>' +
            '<option value="1">1 - Initial</option>' +
            '<option value="2">2 - Basic</option>' +
            '<option value="3" selected>3 - Intermediate</option>' +
            '<option value="4">4 - Advanced</option>' +
            '<option value="5">5 - World Class</option>' +
            '</select></div>';
        container.appendChild(div);
    }
    if (skillNames.length === 0) {
        container.innerHTML = '<p class="text-muted">No suggested skills for this tree. You can rate skills later.</p>';
    }
}

function prefillLearningPlan() {
    var mainTreeName = document.getElementById('maintree').value;
    var treeData = data.allTreeNames ? data.allTreeNames.find(function(t) { return t.name == mainTreeName; }) : null;
    var skillNames = treeData ? (treeData.skillNames || []) : [];
    var shortTerm = skillNames.slice(0, 3).join(', ');
    var medTerm = skillNames.slice(3, 6).join(', ');
    var longTerm = skillNames.slice(6, 10).join(', ');
    document.getElementById('planShortTerm').value = shortTerm;
    document.getElementById('planMediumTerm').value = medTerm;
    document.getElementById('planLongTerm').value = longTerm;
}

function saveOnboardingData() {
    var focusArea = document.getElementById('focusareasel').value;
    var mainTree = document.getElementById('maintree').value;

    // Save focus area and main tree
    request('POST', '/protected/firstlogindata', { focusArea: focusArea, mainTree: mainTree }, function() {
        if (this.readyState == 4 && this.status == 200) {
            // Save self-assessment skills
            var levels = document.querySelectorAll('.onboarding-skill-level');
            var skillsToSave = [];
            for (var i = 0; i < levels.length; ++i) {
                var sel = levels[i];
                var val = parseInt(sel.value);
                if (val > 0) {
                    skillsToSave.push({ name: sel.getAttribute('data-skill'), achievedPoint: val, maxPoint: 5 });
                }
            }
            if (skillsToSave.length > 0) {
                request('POST', '/protected/submitall', { skills: skillsToSave }, function() {
                    if (this.readyState == 4) createLearningPlan();
                });
            } else {
                createLearningPlan();
            }
        }
    });
}

function createLearningPlan() {
    var short = document.getElementById('planShortTerm').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
    var med = document.getElementById('planMediumTerm').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
    var long = document.getElementById('planLongTerm').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean);

    var planData = {
        title: 'My Learning Plan',
        description: 'Auto-created during onboarding',
        horizons: {
            shortTerm: { skills: short, targetDate: new Date(Date.now() + 90*86400000).toISOString().split('T')[0] },
            mediumTerm: { skills: med, targetDate: new Date(Date.now() + 365*86400000).toISOString().split('T')[0] },
            longTerm: { skills: long, targetDate: new Date(Date.now() + 3*365*86400000).toISOString().split('T')[0] }
        }
    };

    request('POST', '/protected/plan', planData, function() {
        if (this.readyState == 4) {
            document.getElementById('onboardingStep3').style.display = 'none';
            document.getElementById('onboardingStep4').style.display = 'block';
        }
    });
}

function selectMainTree () {
    var mainTree = document.getElementById('maintree');
    var focusArea = document.getElementById('focusareasel');

    var focusAreaTrees = data.allTreeNames.filter(obj => obj.focusArea == focusArea.value);

    mainTree.innerHTML = '';
    for (var i = 0; i < focusAreaTrees.length; ++i) {
        var option = document.createElement('option');
        option.value = option.text = focusAreaTrees[i].name;
        mainTree.add(option);
    }

    document.getElementById('maintreediv').style.display = 'block';
}

// loads the needed pics for the tree, then loads the tree.
function startLoader () {
    PIXI.loader.reset();

    PIXI.loader.add("pictures/skillborder.png")
                //.add("pictures/tree_bg/art-background-blank-951240.jpg")
                .add("pictures/tree.png")
                .add("pictures/tick.png");
    for (var i = 0; i < data.skills.length; ++i) {
        PIXI.loader.add(data.skills[i].skillIcon.toString());
    }
    PIXI.loader.load(function () {
        showTree(data.mainTree, data, true);
    });
    loadAddedTrees();
}

// loads the user's public and private trees.
function loadAddedTrees(){
  var treeList = document.getElementById('treeList');
  treeList.innerHTML = "";
  for (var i = 0; i < data.trees.length; i++) {
    var tn = data.trees[i].name;
    var ithtree = document.createElement('a');
    if (tn == data.mainTree) ithtree.innerHTML = tn;
    else ithtree.innerHTML = '<i class = "fa fa-trash" id = "delTreeBtn" onclick = "delTree(this)"></i>' + tn;
    ithtree.className = "dropdown-item";
    ithtree.onclick = function (event) {
        if (event.target.id != 'delTreeBtn') {
            document.getElementById('submitBtn').style.display = "block";
            showTree(this.text, data, true);
        }
    }
    treeList.appendChild(ithtree);
  }
}

window.addEventListener('load', function() {
    var forms = document.getElementsByClassName('needs-validation');
    var validation = Array.prototype.filter.call(forms, function(form) {
        form.addEventListener('submit', function(event) {
            if (form.checkValidity() === false) {
                event.preventDefault();
                event.stopPropagation();
                $('.invalid-alert').show();
            } else $('.invalid-alert').hide();
            form.classList.add('was-validated');
        }, false);
    });

    initData();
}, false);
