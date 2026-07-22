var fs = require('fs');
var path = require('path');

var helperCode = fs.readFileSync(path.resolve(__dirname, '../../public/user/src/helper.js'), 'utf8');
var communityCode = fs.readFileSync(path.resolve(__dirname, '../../public/user/src/community.js'), 'utf8');

var mockAlertDiv;

beforeAll(function () {
    global.$ = jest.fn().mockReturnValue({ hide: jest.fn(), show: jest.fn() });
    global.window = global;

    mockAlertDiv = document.createElement('div');
    mockAlertDiv.id = 'bottomAlert';
    mockAlertDiv.className = 'alert';
    var msgSpan = document.createElement('span');
    msgSpan.id = 'bottomAlertMsg';
    mockAlertDiv.appendChild(msgSpan);
    document.body.appendChild(mockAlertDiv);

    (0, eval)(helperCode);
    (0, eval)(communityCode);
});

afterAll(function () {
    delete global.$;
    delete global.window;
});

beforeEach(function () {
    jest.clearAllMocks();
    document.getElementById('bottomAlert').className = 'alert';
    document.getElementById('bottomAlertMsg').innerText = '';
});

/* ───── escHtml ───── */

describe('escHtml', function () {
    it('should escape HTML special characters', function () {
        var result = escHtml('<script>alert("xss")</script>');
        expect(result).toContain('&lt;script&gt;');
        expect(result).toContain('&gt;');
        expect(result).not.toContain('<script>');

        var result2 = escHtml("it's & done");
        expect(result2).toContain('&amp;');
    });

    it('should return empty string for empty input', function () {
        expect(escHtml('')).toBe('');
    });

    it('should return same string for safe input', function () {
        expect(escHtml('hello world')).toBe('hello world');
        expect(escHtml('123')).toBe('123');
    });

    it('should handle null and undefined', function () {
        expect(escHtml(null)).toBe('');
        expect(escHtml(undefined)).toBe('');
        expect(escHtml(0)).toBe('0');
        expect(escHtml(false)).toBe('false');
    });
});

/* ───── formatDate ───── */

describe('formatDate', function () {
    it('should return empty string for falsy input', function () {
        expect(formatDate(null)).toBe('');
        expect(formatDate(undefined)).toBe('');
        expect(formatDate('')).toBe('');
    });

    it('should format a valid date string', function () {
        var result = formatDate('2024-01-15T10:30:00Z');
        expect(result).toContain('2024');
        expect(result.length).toBeGreaterThan(5);
    });

    it('should format a timestamp number', function () {
        var result = formatDate(1705312200000);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(5);
    });
});

/* ───── closeCommunityModal ───── */

describe('closeCommunityModal', function () {
    beforeEach(function () {
        document.body.innerHTML += '<div class="modal" id="testModal" style="display:block"></div>';
    });

    afterEach(function () {
        var el = document.getElementById('testModal');
        if (el) el.remove();
    });

    it('should hide the modal', function () {
        closeCommunityModal('testModal');
        expect(document.getElementById('testModal').style.display).toBe('none');
    });
});

/* ───── renderFeedPosts ───── */

describe('renderFeedPosts', function () {
    beforeEach(function () {
        var container = document.createElement('div');
        container.id = 'feedPostList';
        document.body.appendChild(container);
    });

    afterEach(function () {
        var el = document.getElementById('feedPostList');
        if (el) el.remove();
    });

    it('should show empty message when no posts', function () {
        renderFeedPosts([]);
        expect(document.getElementById('feedPostList').innerHTML).toContain('No posts yet');
    });

    it('should show empty message when null', function () {
        renderFeedPosts(null);
        expect(document.getElementById('feedPostList').innerHTML).toContain('No posts yet');
    });

    it('should render a post with username, body, and type badge', function () {
        var posts = [
            { id: 1, username: 'alice', body: 'Hello!', type: 'milestone', createdAt: '2024-01-15T10:00:00Z', comments: [] }
        ];
        renderFeedPosts(posts);
        var html = document.getElementById('feedPostList').innerHTML;
        expect(html).toContain('alice');
        expect(html).toContain('Hello!');
        expect(html).toContain('Milestone');
    });

    it('should render comments for a post', function () {
        var posts = [
            { id: 1, username: 'alice', body: 'Post', type: 'update', createdAt: '2024-01-15T10:00:00Z',
              comments: [{ username: 'bob', body: 'Nice!', createdAt: '2024-01-15T11:00:00Z' }] }
        ];
        renderFeedPosts(posts);
        var html = document.getElementById('feedPostList').innerHTML;
        expect(html).toContain('bob');
        expect(html).toContain('Nice!');
    });

    it('should escape XSS in post body', function () {
        var posts = [
            { id: 1, username: 'hacker', body: '<img src=x onerror=alert(1)>', type: 'update', createdAt: '2024-01-15T10:00:00Z', comments: [] }
        ];
        renderFeedPosts(posts);
        var html = document.getElementById('feedPostList').innerHTML;
        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
    });
});

/* ───── renderGoals ───── */

describe('renderGoals', function () {
    beforeEach(function () {
        var container = document.createElement('div');
        container.id = 'goalsList';
        document.body.appendChild(container);
    });

    afterEach(function () {
        var el = document.getElementById('goalsList');
        if (el) el.remove();
    });

    it('should show empty message when no goals', function () {
        renderGoals([]);
        expect(document.getElementById('goalsList').innerHTML).toContain('No goals yet');
    });

    it('should render a goal with title, skill, target', function () {
        var goals = [
            { id: 1, title: 'Learn React', skillName: 'React', targetLevel: 3, targetDate: '2024-06-01', status: 'in_progress', collaborators: [] }
        ];
        renderGoals(goals);
        var html = document.getElementById('goalsList').innerHTML;
        expect(html).toContain('Learn React');
        expect(html).toContain('React');
        expect(html).toContain('level 3');
    });

    it('should render collaborators', function () {
        var goals = [
            { id: 1, title: 'Goal', skillName: 'Skill', targetLevel: 2, targetDate: '2024-06-01', status: 'pending',
              collaborators: ['charlie', 'dave'] }
        ];
        renderGoals(goals);
        var html = document.getElementById('goalsList').innerHTML;
        expect(html).toContain('charlie');
        expect(html).toContain('dave');
    });

    it('should escape XSS in goal title', function () {
        var goals = [
            { id: 1, title: '<b>bold</b>', skillName: 'S', targetLevel: 1, targetDate: '2024-06-01', status: 'pending', collaborators: [] }
        ];
        renderGoals(goals);
        var cardTitle = document.querySelector('#goal-1 .card-body strong');
        expect(cardTitle.innerHTML).toContain('&lt;b&gt;bold&lt;/b&gt;');
    });
});

/* ───── renderHistory ───── */

describe('renderHistory', function () {
    beforeEach(function () {
        var container = document.createElement('div');
        container.id = 'historyContent';
        document.body.appendChild(container);
    });

    afterEach(function () {
        var el = document.getElementById('historyContent');
        if (el) el.remove();
    });

    it('should show empty message when no records', function () {
        renderHistory([]);
        expect(document.getElementById('historyContent').innerHTML).toContain('No history');
    });

    it('should render history records', function () {
        var records = [
            { event: 'Level Up', createdAt: '2024-01-15T10:00:00Z', detail: 'Reached level 3' }
        ];
        renderHistory(records);
        var html = document.getElementById('historyContent').innerHTML;
        expect(html).toContain('Level Up');
        expect(html).toContain('Reached level 3');
    });

    it('should fall back to type when event is missing', function () {
        var records = [
            { type: 'Update', timestamp: '2024-01-15T10:00:00Z' }
        ];
        renderHistory(records);
        var html = document.getElementById('historyContent').innerHTML;
        expect(html).toContain('Update');
    });
});

/* ───── renderRecommendations ───── */

describe('renderRecommendations', function () {
    beforeEach(function () {
        var containers = ['recommendMentors', 'recommendTrees', 'recommendTrainings'];
        for (var i = 0; i < containers.length; ++i) {
            var el = document.createElement('div');
            el.id = containers[i];
            document.body.appendChild(el);
        }
    });

    afterEach(function () {
        var ids = ['recommendMentors', 'recommendTrees', 'recommendTrainings'];
        for (var i = 0; i < ids.length; ++i) {
            var el = document.getElementById(ids[i]);
            if (el) el.remove();
        }
    });

    it('should show empty messages for missing data', function () {
        renderRecommendations({});
        expect(document.getElementById('recommendMentors').innerHTML).toContain('No mentor suggestions');
        expect(document.getElementById('recommendTrees').innerHTML).toContain('No path suggestions');
        expect(document.getElementById('recommendTrainings').innerHTML).toContain('No training suggestions');
    });

    it('should render mentors list', function () {
        renderRecommendations({ mentors: [{ username: 'mentor1', skill: 'NodeJS' }], paths: [], trainings: [] });
        var html = document.getElementById('recommendMentors').innerHTML;
        expect(html).toContain('mentor1');
        expect(html).toContain('NodeJS');
    });

    it('should render paths', function () {
        renderRecommendations({ mentors: [], paths: [{ name: 'Web Dev', description: 'Learn web' }], trainings: [] });
        expect(document.getElementById('recommendTrees').innerHTML).toContain('Web Dev');
        expect(document.getElementById('recommendTrees').innerHTML).toContain('Learn web');
    });

    it('should render trainings with URL', function () {
        renderRecommendations({ mentors: [], paths: [], trainings: [{ title: 'React Course', url: 'https://example.com', provider: 'Udemy' }] });
        var html = document.getElementById('recommendTrainings').innerHTML;
        expect(html).toContain('React Course');
        expect(html).toContain('https://example.com');
        expect(html).toContain('Udemy');
        expect(html).toContain('rel="noopener noreferrer"');
    });
});

/* ───── renderComplementary ───── */

describe('renderComplementary', function () {
    beforeEach(function () {
        var container = document.createElement('div');
        container.id = 'complementList';
        document.body.appendChild(container);
    });

    afterEach(function () {
        var el = document.getElementById('complementList');
        if (el) el.remove();
    });

    it('should show empty message when no people', function () {
        renderComplementary([]);
        expect(document.getElementById('complementList').innerHTML).toContain('No complementary users');
    });

    it('should render user with gaps', function () {
        var people = [
            { username: 'jane', gaps: [{ type: 'complement', skillName: 'Python' }], willingToTeach: true, commonSkills: 3 }
        ];
        renderComplementary(people);
        var html = document.getElementById('complementList').innerHTML;
        expect(html).toContain('jane');
        expect(html).toContain('complement');
        expect(html).toContain('Python');
        expect(html).toContain('Willing to teach');
        expect(html).toContain('3 common');
    });
});

/* ───── renderGroupCoverage ───── */

describe('renderGroupCoverage', function () {
    beforeEach(function () {
        var container = document.createElement('div');
        container.id = 'groupCoverageContent';
        document.body.appendChild(container);
    });

    afterEach(function () {
        var el = document.getElementById('groupCoverageContent');
        if (el) el.remove();
    });

    it('should show empty message when no coverage data', function () {
        renderGroupCoverage({});
        expect(document.getElementById('groupCoverageContent').innerHTML).toContain('No skill coverage');
    });

    it('should render coverage table', function () {
        var coverage = {
            users: ['alice', 'bob'],
            skills: [
                { skillName: 'NodeJS', userLevels: [3, 1], gap: '' },
                { skillName: 'Python', userLevels: [0, 0], gap: 'Missing' }
            ]
        };
        renderGroupCoverage(coverage);
        var html = document.getElementById('groupCoverageContent').innerHTML;
        expect(html).toContain('alice');
        expect(html).toContain('bob');
        expect(html).toContain('NodeJS');
        expect(html).toContain('Python');
        expect(html).toContain('Covered');
        expect(html).toContain('Missing');
    });
});

/* ───── renderPlanProgress ───── */

describe('renderPlanProgress', function () {
    beforeEach(function () {
        var container = document.createElement('div');
        container.id = 'planProgressContent';
        document.body.appendChild(container);
    });

    afterEach(function () {
        var el = document.getElementById('planProgressContent');
        if (el) el.remove();
    });

    it('should show empty message when no data', function () {
        renderPlanProgress({});
        expect(document.getElementById('planProgressContent').innerHTML).toContain('No progress data');
    });

    it('should render factor comparison table', function () {
        renderPlanProgress({ factors: [{ name: 'Confidence', before: 2, after: 4 }] });
        var html = document.getElementById('planProgressContent').innerHTML;
        expect(html).toContain('Confidence');
        expect(html).toContain('2');
        expect(html).toContain('4');
        expect(html).toContain('+2');
    });

    it('should render skill progress table', function () {
        renderPlanProgress({ skills: [{ skillName: 'NodeJS', currentLevel: 2, targetLevel: 4 }] });
        var html = document.getElementById('planProgressContent').innerHTML;
        expect(html).toContain('NodeJS');
        expect(html).toContain('2');
        expect(html).toContain('4');
    });

    it('should show negative change in red', function () {
        renderPlanProgress({ factors: [{ name: 'Focus', before: 5, after: 3 }] });
        var html = document.getElementById('planProgressContent').innerHTML;
        expect(html).toContain('-2');
    });
});

/* ───── openFeed (XHR integration) ───── */

describe('openFeed (XHR)', function () {
    var mockXHR;

    beforeEach(function () {
        document.body.innerHTML = '<div class="modal" id="feedModal"><div class="modal-content"><div class="modal-header"><span class="modalClose">&times;</span><h2>Community Feed</h2></div><div class="modal-body"><div id="feedPostList"></div></div></div></div><div id="bottomAlert" class="alert"><span id="bottomAlertMsg"></span></div>';

        mockXHR = {
            open: jest.fn(),
            setRequestHeader: jest.fn(),
            send: jest.fn(),
            readyState: 4,
            status: 200,
            response: [{ id: 1, username: 'alice', body: 'Test', type: 'update', createdAt: '2024-01-15T10:00:00Z', comments: [] }]
        };
        global.XMLHttpRequest = jest.fn(function () { return mockXHR; });
    });

    afterEach(function () {
        delete global.XMLHttpRequest;
        var el = document.getElementById('feedModal');
        if (el) el.remove();
    });

    it('should show loading then render posts on success', function () {
        openFeed();
        expect(document.getElementById('feedPostList').innerHTML).toContain('spinner');

        mockXHR.onreadystatechange();
        var html = document.getElementById('feedPostList').innerHTML;
        expect(html).toContain('alice');
        expect(html).toContain('Test');
    });

    it('should show error on failure', function () {
        mockXHR.status = 500;
        openFeed();
        mockXHR.onreadystatechange();
        expect(document.getElementById('feedPostList').innerHTML).toContain('Failed');
    });
});
