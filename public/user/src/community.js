function escHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function formatDate(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

function calcEffectiveLevel(skillName, knownSkills) {
    if (!knownSkills) return 0;
    for (var i = 0; i < knownSkills.length; ++i) {
        if (knownSkills[i].skillName === skillName) return knownSkills[i].effectiveLevel || knownSkills[i].level || 0;
    }
    return 0;
}

function closeCommunityModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

window.addEventListener('click', function (e) {
    var modals = ['feedModal', 'goalsModal', 'historyModal', 'recommendModal', 'complementModal',
                  'groupCoverageModal', 'planModal', 'planProgressModal'];
    for (var i = 0; i < modals.length; ++i) {
        var m = document.getElementById(modals[i]);
        if (e.target === m) m.style.display = 'none';
    }
});

/* ───────── Feed ───────── */

function openFeed() {
    var modal = document.getElementById('feedModal');
    var container = document.getElementById('feedPostList');
    container.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    modal.style.display = 'block';
    request('GET', '/protected/feed', undefined, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200) {
            renderFeedPosts(this.response);
        } else {
            container.innerHTML = '<div class="alert alert-danger">Failed to load feed.</div>';
        }
    });
}

function renderFeedPosts(posts) {
    var container = document.getElementById('feedPostList');
    if (!posts || posts.length === 0) {
        container.innerHTML = '<div class="text-muted">No posts yet.</div>';
        return;
    }
    var html = '';
    for (var i = 0; i < posts.length; ++i) {
        var p = posts[i];
        var typeBadge = '';
        if (p.type === 'milestone') typeBadge = '<span class="badge badge-success">Milestone</span>';
        else if (p.type === 'question') typeBadge = '<span class="badge badge-info">Question</span>';
        else if (p.type === 'resource') typeBadge = '<span class="badge badge-warning">Resource</span>';
        else typeBadge = '<span class="badge badge-secondary">' + escHtml(p.type) + '</span>';
        var skillInfo = '';
        if (p.skillName) {
            skillInfo = '<br><small class="text-muted">Skill: ' + escHtml(p.skillName) +
                        (p.skillLevel ? ' (level ' + p.skillLevel + ')' : '') + '</small>';
        }
        var commentsHtml = '';
        if (p.comments && p.comments.length > 0) {
            commentsHtml = '<div class="feed-comments mt-2">';
            for (var j = 0; j < p.comments.length; ++j) {
                var c = p.comments[j];
                commentsHtml += '<div class="feed-comment p-1"><strong>' + escHtml(c.username || 'Anonymous') +
                                '</strong>: ' + escHtml(c.body) +
                                ' <small class="text-muted">' + formatDate(c.createdAt) + '</small></div>';
            }
            commentsHtml += '</div>';
        }
        var canDelete = p.username === (typeof data !== 'undefined' && data ? data.username : '');
        html += '<div class="card mb-2" id="feedPost-' + p.id + '">' +
                '<div class="card-body p-2">' +
                '<div class="d-flex justify-content-between">' +
                '<strong>' + escHtml(p.username) + '</strong> ' + typeBadge +
                (canDelete ? '<button class="btn btn-sm btn-outline-danger" onclick="deletePost(' + p.id + ')"><i class="fas fa-trash"></i></button>' : '') +
                '</div>' +
                '<p class="mb-1">' + escHtml(p.body) + '</p>' +
                skillInfo +
                '<small class="text-muted">' + formatDate(p.createdAt) + '</small>' +
                commentsHtml +
                '<div class="input-group input-group-sm mt-2"><input type="text" class="form-control" placeholder="Write a comment..." id="commentInput-' + p.id + '">' +
                '<div class="input-group-append"><button class="btn btn-outline-primary" onclick="createComment(' + p.id + ')">Post</button></div></div>' +
                '</div></div>';
    }
    container.innerHTML = html;
}

function createPost(type) {
    var body = document.getElementById('feedPostBody').value.trim();
    if (!body) { showBottomAlert('warning', 'Please write something.'); return; }
    var skillName = document.getElementById('feedPostSkill').value.trim() || undefined;
    var data = { type: type, body: body };
    if (skillName) data.skillName = skillName;
    request('POST', '/protected/feed', data, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200) {
            document.getElementById('feedPostBody').value = '';
            document.getElementById('feedPostSkill').value = '';
            openFeed();
        } else {
            showBottomAlert('danger', 'Failed to create post.');
        }
    });
}

function createComment(postId) {
    var input = document.getElementById('commentInput-' + postId);
    var body = input.value.trim();
    if (!body) { showBottomAlert('warning', 'Comment cannot be empty.'); return; }
    request('POST', '/protected/feed/comment', { postId: postId, body: body }, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200) {
            input.value = '';
            openFeed();
        } else {
            showBottomAlert('danger', 'Failed to add comment.');
        }
    });
}

function deletePost(postId) {
    if (!confirm('Delete this post?')) return;
    request('POST', '/protected/feed/delete', { postId: postId }, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200) {
            var el = document.getElementById('feedPost-' + postId);
            if (el) el.remove();
        } else {
            showBottomAlert('danger', 'Failed to delete post.');
        }
    });
}

/* ───────── Goals ───────── */

function openGoals() {
    var modal = document.getElementById('goalsModal');
    document.getElementById('goalsList').innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    modal.style.display = 'block';
    request('GET', '/protected/goals', undefined, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200) {
            renderGoals(this.response);
        } else {
            document.getElementById('goalsList').innerHTML = '<div class="alert alert-danger">Failed to load goals.</div>';
        }
    });
}

function renderGoals(goals) {
    var container = document.getElementById('goalsList');
    if (!goals || goals.length === 0) {
        container.innerHTML = '<div class="text-muted">No goals yet. Create one below.</div>';
        return;
    }
    var html = '';
    for (var i = 0; i < goals.length; ++i) {
        var g = goals[i];
        var collabHtml = '';
        if (g.collaborators && g.collaborators.length > 0) {
            collabHtml = '<br><small class="text-muted">With: ' + g.collaborators.map(function (u) { return escHtml(u); }).join(', ') + '</small>';
        }
        html += '<div class="card mb-2" id="goal-' + g.id + '">' +
                '<div class="card-body p-2">' +
                '<div class="d-flex justify-content-between">' +
                '<strong>' + escHtml(g.title) + '</strong>' +
                '<div>' +
                '<button class="btn btn-sm btn-outline-secondary mr-1" onclick="editGoal(' + g.id + ')"><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-sm btn-outline-info" onclick="shareGoal(' + g.id + ')"><i class="fas fa-share"></i></button>' +
                '</div>' +
                '</div>' +
                '<small class="text-muted">Skill: ' + escHtml(g.skillName) +
                ' | Target: level ' + g.targetLevel +
                ' by ' + formatDate(g.targetDate) + '</small>' +
                collabHtml +
                '<div class="mt-1"><span class="badge badge-pill badge-' + (g.status === 'completed' ? 'success' : g.status === 'in_progress' ? 'primary' : 'secondary') + '">' + escHtml(g.status || 'pending') + '</span></div>' +
                '<div class="goal-edit-form mt-2" id="goalEditForm-' + g.id + '" style="display:none">' +
                '<input type="text" class="form-control form-control-sm mb-1" id="goalEditTitle-' + g.id + '" value="' + escHtml(g.title) + '">' +
                '<button class="btn btn-sm btn-primary" onclick="saveGoal(' + g.id + ')">Save</button>' +
                '</div>' +
                '</div></div>';
    }
    container.innerHTML = html;
}

function createGoal() {
    var title = document.getElementById('goalTitle').value.trim();
    var skillName = document.getElementById('goalSkill').value.trim();
    var targetLevel = parseInt(document.getElementById('goalTargetLevel').value, 10);
    var targetDate = document.getElementById('goalTargetDate').value;
    if (!title || !skillName || isNaN(targetLevel) || !targetDate) {
        showBottomAlert('warning', 'Please fill in all fields.');
        return;
    }
    var gData = { title: title, skillName: skillName, targetLevel: targetLevel, targetDate: targetDate };
    request('POST', '/protected/goals/create', gData, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200) {
            document.getElementById('goalTitle').value = '';
            document.getElementById('goalSkill').value = '';
            document.getElementById('goalTargetLevel').value = '';
            document.getElementById('goalTargetDate').value = '';
            openGoals();
        } else {
            showBottomAlert('danger', 'Failed to create goal.');
        }
    });
}

function editGoal(goalId) {
    var form = document.getElementById('goalEditForm-' + goalId);
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function saveGoal(goalId) {
    var title = document.getElementById('goalEditTitle-' + goalId).value.trim();
    if (!title) { showBottomAlert('warning', 'Title cannot be empty.'); return; }
    request('POST', '/protected/goals/update', { goalId: goalId, title: title }, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200) {
            openGoals();
        } else {
            showBottomAlert('danger', 'Failed to update goal.');
        }
    });
}

function shareGoal(goalId) {
    var username = prompt('Enter username to share timeline with:');
    if (!username || !username.trim()) return;
    request('POST', '/protected/goals/share', { goalId: goalId, username: username.trim() }, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200) {
            showBottomAlert('success', 'Goal shared with ' + escHtml(username) + '.');
            openGoals();
        } else {
            showBottomAlert('danger', 'Failed to share goal.');
        }
    });
}

function doShareGoal(goalId) {
    shareGoal(goalId);
}

/* ───────── Skill History ───────── */

function openSkillHistory(skillName) {
    document.getElementById('historyTitle').textContent = 'History for ' + (skillName || 'Skill');
    document.getElementById('historyContent').innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    document.getElementById('historyModal').style.display = 'block';
    request('GET', '/protected/history?skill=' + encodeURIComponent(skillName), undefined, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200) {
            renderHistory(this.response);
        } else {
            document.getElementById('historyContent').innerHTML = '<div class="alert alert-danger">Failed to load history.</div>';
        }
    });
}

function renderHistory(records) {
    var container = document.getElementById('historyContent');
    if (!records || records.length === 0) {
        container.innerHTML = '<div class="text-muted">No history records for this skill.</div>';
        return;
    }
    var html = '<ul class="list-unstyled">';
    for (var i = 0; i < records.length; ++i) {
        var r = records[i];
        html += '<li class="mb-2"><i class="fas fa-circle text-success mr-2" style="font-size:0.5rem"></i>' +
                '<strong>' + (r.event || r.type || 'Update') + '</strong>' +
                ' <small class="text-muted">' + formatDate(r.createdAt || r.timestamp) + '</small>' +
                (r.detail ? '<br><span class="text-muted">' + escHtml(r.detail) + '</span>' : '') +
                '</li>';
    }
    html += '</ul>';
    container.innerHTML = html;
}

/* ───────── Recommendations ───────── */

function openRecommendations() {
    document.getElementById('recommendMentors').innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    document.getElementById('recommendTrees').innerHTML = '';
    document.getElementById('recommendTrainings').innerHTML = '';
    document.getElementById('recommendModal').style.display = 'block';
    request('GET', '/protected/recommend/next', undefined, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200) {
            renderRecommendations(this.response);
        } else {
            document.getElementById('recommendMentors').innerHTML = '<div class="alert alert-danger">Failed to load recommendations.</div>';
        }
    });
}

function renderRecommendations(recs) {
    if (!recs) recs = { mentors: [], paths: [], trainings: [] };
    /* Mentors */
    var mentorHtml = '';
    if (recs.mentors && recs.mentors.length > 0) {
        mentorHtml = '<ul class="list-group list-group-flush">';
        for (var i = 0; i < recs.mentors.length; ++i) {
            var m = recs.mentors[i];
            mentorHtml += '<li class="list-group-item py-1">' + escHtml(m.username) +
                          (m.skill ? ' — <span class="text-muted">' + escHtml(m.skill) + '</span>' : '') +
                          '</li>';
        }
        mentorHtml += '</ul>';
    } else {
        mentorHtml = '<div class="text-muted">No mentor suggestions yet. Keep building your skills.</div>';
    }
    document.getElementById('recommendMentors').innerHTML = mentorHtml;
    /* Paths / Trees */
    var treeHtml = '';
    if (recs.paths && recs.paths.length > 0) {
        treeHtml = '<ul class="list-group list-group-flush">';
        for (var i = 0; i < recs.paths.length; ++i) {
            var t = recs.paths[i];
            treeHtml += '<li class="list-group-item py-1">' + escHtml(t.name || t.title || 'Skill Tree') +
                        (t.description ? '<br><small class="text-muted">' + escHtml(t.description) + '</small>' : '') +
                        '</li>';
        }
        treeHtml += '</ul>';
    } else {
        treeHtml = '<div class="text-muted">No path suggestions yet.</div>';
    }
    document.getElementById('recommendTrees').innerHTML = treeHtml;
    /* Trainings */
    var trainingHtml = '';
    if (recs.trainings && recs.trainings.length > 0) {
        trainingHtml = '<ul class="list-group list-group-flush">';
        for (var i = 0; i < recs.trainings.length; ++i) {
            var tr = recs.trainings[i];
            trainingHtml += '<li class="list-group-item py-1">' +
                            (tr.title ? '<strong>' + escHtml(tr.title) + '</strong><br>' : '') +
                            (tr.url ? '<a href="' + escHtml(tr.url) + '" target="_blank">' + escHtml(tr.url) + '</a>' : escHtml(tr.name || tr.description || 'Training')) +
                            (tr.provider ? '<br><small class="text-muted">' + escHtml(tr.provider) + '</small>' : '') +
                            '</li>';
        }
        trainingHtml += '</ul>';
    } else {
        trainingHtml = '<div class="text-muted">No training suggestions yet.</div>';
    }
    document.getElementById('recommendTrainings').innerHTML = trainingHtml;
}

function searchMentors() {
    var skill = document.getElementById('mentorSearchSkill').value.trim();
    if (!skill) { showBottomAlert('warning', 'Enter a skill name to search.'); return; }
    document.getElementById('recommendMentors').innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
    request('GET', '/protected/recommend/mentors?skill=' + encodeURIComponent(skill), undefined, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200) {
            var mentors = this.response;
            var html = '';
            if (mentors && mentors.length > 0) {
                html = '<ul class="list-group list-group-flush">';
                for (var i = 0; i < mentors.length; ++i) {
                    html += '<li class="list-group-item py-1">' + escHtml(mentors[i].username) +
                            (mentors[i].level ? ' <span class="badge badge-pill badge-info">Level ' + mentors[i].level + '</span>' : '') +
                            '</li>';
                }
                html += '</ul>';
            } else {
                html = '<div class="text-muted">No mentors found for this skill.</div>';
            }
            document.getElementById('recommendMentors').innerHTML = html;
        } else {
            document.getElementById('recommendMentors').innerHTML = '<div class="alert alert-danger">Search failed.</div>';
        }
    });
}

/* ───────── Complementarity ───────── */

function openComplementary() {
    document.getElementById('complementList').innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    document.getElementById('complementModal').style.display = 'block';
    request('POST', '/protected/complement/people', {}, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200) {
            renderComplementary(this.response);
        } else {
            document.getElementById('complementList').innerHTML = '<div class="alert alert-danger">Failed to load complementary people.</div>';
        }
    });
}

function renderComplementary(people) {
    var container = document.getElementById('complementList');
    if (!people || people.length === 0) {
        container.innerHTML = '<div class="text-muted">No complementary users found.</div>';
        return;
    }
    var html = '';
    for (var i = 0; i < people.length; ++i) {
        var p = people[i];
        var gapHtml = '';
        if (p.gaps && p.gaps.length > 0) {
            gapHtml = '<div class="mt-1">';
            for (var j = 0; j < p.gaps.length; ++j) {
                var gap = p.gaps[j];
                var gapBadge = 'secondary';
                var gapLabel = gap.type || 'gap';
                if (gapLabel === 'complement') gapBadge = 'success';
                else if (gapLabel === 'prerequisite') gapBadge = 'warning';
                else if (gapLabel === 'substitute') gapBadge = 'info';
                else if (gapLabel === 'adjacent') gapBadge = 'primary';
                gapHtml += '<span class="badge badge-pill badge-' + gapBadge + ' mr-1">' + escHtml(gapLabel) + ': ' + escHtml(gap.skillName || '') + '</span>';
            }
            gapHtml += '</div>';
        }
        var willingHtml = '';
        if (p.willingToTeach) willingHtml = ' <span class="badge badge-success">Willing to teach</span>';
        html += '<div class="card mb-2"><div class="card-body p-2">' +
                '<div class="d-flex justify-content-between">' +
                '<strong>' + escHtml(p.username) + '</strong>' +
                '<div>' + willingHtml +
                (p.commonSkills ? ' <span class="badge badge-pill badge-light">' + p.commonSkills + ' common</span>' : '') +
                '</div>' +
                '</div>' +
                gapHtml +
                '</div></div>';
    }
    container.innerHTML = html;
}

/* ───────── Group Coverage ───────── */

function openGroupCoverage() {
    var input = prompt('Enter usernames (comma-separated):');
    if (!input || !input.trim()) return;
    var usernames = input.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s; });
    if (usernames.length < 2) { showBottomAlert('warning', 'Enter at least two usernames.'); return; }
    document.getElementById('groupCoverageContent').innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    document.getElementById('groupCoverageModal').style.display = 'block';
    request('POST', '/protected/complement/group', { usernames: usernames }, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200) {
            renderGroupCoverage(this.response);
        } else {
            document.getElementById('groupCoverageContent').innerHTML = '<div class="alert alert-danger">Failed to load group coverage.</div>';
        }
    });
}

function renderGroupCoverage(coverage) {
    var container = document.getElementById('groupCoverageContent');
    if (!coverage || !coverage.skills || coverage.skills.length === 0) {
        container.innerHTML = '<div class="text-muted">No skill coverage data available.</div>';
        return;
    }
    var html = '<table class="table table-sm table-striped"><thead><tr><th>Skill</th>';
    if (coverage.users) {
        for (var i = 0; i < coverage.users.length; ++i) {
            html += '<th>' + escHtml(coverage.users[i]) + '</th>';
        }
    }
    html += '<th>Gap</th></tr></thead><tbody>';
    for (var i = 0; i < coverage.skills.length; ++i) {
        var s = coverage.skills[i];
        html += '<tr><td>' + escHtml(s.skillName || s.name || '') + '</td>';
        if (s.userLevels) {
            for (var j = 0; j < s.userLevels.length; ++j) {
                var lvl = s.userLevels[j];
                var badge = lvl > 0 ? 'success' : 'secondary';
                html += '<td><span class="badge badge-pill badge-' + badge + '">' + (lvl || 0) + '</span></td>';
            }
        }
        html += '<td>' + (s.gap ? '<span class="badge badge-pill badge-danger">' + escHtml(s.gap) + '</span>' : '<span class="badge badge-pill badge-success">Covered</span>') + '</td>';
        html += '</tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
}

/* ───────── Learning Plan ───────── */

function openPlan() {
    document.getElementById('planTabContent').innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    document.getElementById('planModal').style.display = 'block';
    request('GET', '/protected/plan', undefined, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200) {
            if (this.response && this.response.horizons) {
                renderPlan(this.response);
            } else {
                autoCreatePlan();
            }
        } else if (this.status === 404) {
            autoCreatePlan();
        } else {
            document.getElementById('planTabContent').innerHTML = '<div class="alert alert-danger">Failed to load plan.</div>';
        }
    });
}

function autoCreatePlan() {
    request('POST', '/protected/plan', {}, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200 || this.status === 201) {
            openPlan();
        } else {
            document.getElementById('planTabContent').innerHTML = '<div class="alert alert-danger">Failed to create plan.</div>';
        }
    });
}

function renderPlan(plan) {
    var html = '<ul class="nav nav-tabs" id="planHorizonTabs" role="tablist">';
    var horizons = ['short', 'mid', 'long'];
    var horizonLabels = { short: 'Short-term (1-3 mo)', mid: 'Mid-term (3-12 mo)', long: 'Long-term (1-3 yr)' };
    var horizonNames = { short: 'short', mid: 'mid', long: 'long' };
    for (var i = 0; i < horizons.length; ++i) {
        var h = horizons[i];
        var active = i === 0 ? ' active' : '';
        html += '<li class="nav-item"><a class="nav-link' + active + '" id="horizon-' + h + '-tab" data-toggle="tab" href="#horizon-' + h + '" role="tab">' + horizonLabels[h] + '</a></li>';
    }
    html += '</ul>';
    html += '<div class="tab-content mt-2" id="planHorizonContent">';
    for (var i = 0; i < horizons.length; ++i) {
        var h = horizons[i];
        var active = i === 0 ? ' show active' : '';
        var horizonData = plan.horizons && plan.horizons[h] ? plan.horizons[h] : [];
        html += '<div class="tab-pane fade' + active + '" id="horizon-' + h + '" role="tabpanel">';
        html += '<div class="mb-2"><button class="btn btn-sm btn-outline-primary" onclick="showPlanHorizon(\'' + h + '\')"><i class="fas fa-edit"></i> Edit</button></div>';
        if (horizonData.length > 0) {
            html += '<ul class="list-group list-group-flush">';
            for (var j = 0; j < horizonData.length; ++j) {
                var item = horizonData[j];
                var typeLabel = item.transitionType ? '<span class="badge badge-pill badge-info ml-1">' + escHtml(item.transitionType) + '</span>' : '';
                html += '<li class="list-group-item py-1">' +
                        '<strong>' + escHtml(item.skillName || item.name || '') + '</strong>' +
                        typeLabel +
                        (item.targetLevel ? ' <span class="badge badge-pill badge-secondary">→ Level ' + item.targetLevel + '</span>' : '') +
                        (item.reason ? '<br><small class="text-muted">' + escHtml(item.reason) + '</small>' : '') +
                        '</li>';
            }
            html += '</ul>';
        } else {
            html += '<div class="text-muted">No skills in this horizon yet.</div>';
        }
        html += '</div>';
    }
    html += '</div>';
    document.getElementById('planTabContent').innerHTML = html;
    $('.nav-tabs a[data-toggle="tab"]').on('shown.bs.tab', function () {});
}

function showPlanHorizon(horizon) {
    document.getElementById('planHorizonEditForm').style.display = 'block';
    document.getElementById('planHorizonEditForm').dataset.horizon = horizon;
    document.getElementById('planHorizonSkills').value = '';
}

function editPlanHorizon(horizon) {
    showPlanHorizon(horizon);
}

function savePlanHorizon() {
    var form = document.getElementById('planHorizonEditForm');
    var horizon = form.dataset.horizon;
    var skillsStr = document.getElementById('planHorizonSkills').value.trim();
    if (!skillsStr) { showBottomAlert('warning', 'Enter at least one skill.'); return; }
    var skills = skillsStr.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s; });
    request('PATCH', '/protected/plan/horizon/' + horizon, { skills: skills }, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200) {
            form.style.display = 'none';
            openPlan();
        } else {
            showBottomAlert('danger', 'Failed to update plan horizon.');
        }
    });
}

function classifyPlanHorizon(horizon) {
    request('POST', '/protected/plan/classify/' + horizon, {}, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200) {
            showBottomAlert('success', 'Horizon classified successfully.');
            openPlan();
        } else {
            showBottomAlert('danger', 'Failed to classify horizon.');
        }
    });
}

function openPlanProgress() {
    document.getElementById('planProgressContent').innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    document.getElementById('planProgressModal').style.display = 'block';
    request('GET', '/protected/plan/progress', undefined, function () {
        if (this.readyState !== 4) return;
        if (this.status === 200) {
            renderPlanProgress(this.response);
        } else {
            document.getElementById('planProgressContent').innerHTML = '<div class="alert alert-danger">Failed to load plan progress.</div>';
        }
    });
}

function renderPlanProgress(progress) {
    var container = document.getElementById('planProgressContent');
    if (!progress || (!progress.factors && !progress.skills)) {
        container.innerHTML = '<div class="text-muted">No progress data available yet.</div>';
        return;
    }
    var factors = progress.factors || [];
    var skills = progress.skills || [];
    var html = '';
    if (factors.length > 0) {
        html += '<h6>Factor Comparison</h6><table class="table table-sm table-striped"><thead><tr><th>Factor</th><th>Before</th><th>After</th><th>Change</th></tr></thead><tbody>';
        for (var i = 0; i < factors.length; ++i) {
            var f = factors[i];
            var change = f.after - f.before;
            var changeClass = change > 0 ? 'text-success' : change < 0 ? 'text-danger' : '';
            html += '<tr><td>' + escHtml(f.name || f.factor || '') + '</td>' +
                    '<td>' + (f.before != null ? f.before : '-') + '</td>' +
                    '<td>' + (f.after != null ? f.after : '-') + '</td>' +
                    '<td class="' + changeClass + '">' + (change > 0 ? '+' : '') + change + '</td></tr>';
        }
        html += '</tbody></table>';
    }
    if (skills.length > 0) {
        html += '<h6>Skill Progress</h6><table class="table table-sm table-striped"><thead><tr><th>Skill</th><th>Current Level</th><th>Target Level</th></tr></thead><tbody>';
        for (var i = 0; i < skills.length; ++i) {
            var s = skills[i];
            html += '<tr><td>' + escHtml(s.skillName || s.name || '') + '</td>' +
                    '<td>' + (s.currentLevel != null ? s.currentLevel : '-') + '</td>' +
                    '<td>' + (s.targetLevel != null ? s.targetLevel : '-') + '</td></tr>';
        }
        html += '</tbody></table>';
    }
    if (!factors.length && !skills.length) {
        html = '<div class="text-muted">No progress data available yet.</div>';
    }
    container.innerHTML = html;
}
