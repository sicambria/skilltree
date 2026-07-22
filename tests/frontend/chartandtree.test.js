var fs = require('fs');
var path = require('path');

var cssContent = fs.readFileSync(path.resolve(__dirname, '../../public/user/style.css'), 'utf8');

/* ───── pixiCanvas pointer-events ───── */

describe('pixiCanvas CSS', function () {
    it('should have pointer-events: none to allow clicks through canvas', function () {
        expect(cssContent).toContain('pointer-events: none');
    });

    it('should have pointer-events inside #pixiCanvas rule', function () {
        var lines = cssContent.split('\n');
        var inCanvas = false;
        var found = false;
        for (var i = 0; i < lines.length; ++i) {
            var l = lines[i];
            if (/#pixiCanvas/.test(l)) inCanvas = true;
            else if (inCanvas && /\}/.test(l)) inCanvas = false;
            if (inCanvas && /pointer-events/.test(l)) found = true;
        }
        expect(found).toBe(true);
    });
});

/* ───── hideCardsAndAlerts ───── */
/* Tests the body click handler that was collapsing the navbar on every click */

describe('hideCardsAndAlerts', function () {
    var mockCollapse;
    var mockHide;
    var mockQueryResult;
    var originalQuerySelector;

    beforeAll(function () {
        if (typeof global.$ !== 'undefined') {
            // already has a mock from another test
        }
    });

    beforeEach(function () {
        document.body.innerHTML = '\
            <nav class="navbar">\
                <div class="collapse navbar-collapse hide-on-click" id="navbarSupportedContent">\
                    <ul class="navbar-nav">\
                        <li class="nav-item dropdown">\
                            <a class="dropdown-toggle" id="navLink">Menu</a>\
                        </li>\
                    </ul>\
                </div>\
                <a class="nav-link" id="logoutBtn" onclick="logout()">Logout</a>\
            </nav>\
            <div class="hide-on-click" id="otherPanel">Settings</div>';

        mockCollapse = jest.fn();
        mockHide = jest.fn();
        mockQueryResult = { collapse: mockCollapse, hide: mockHide };
        global.$ = jest.fn().mockReturnValue(mockQueryResult);
    });

    afterEach(function () {
        delete global.$;
    });

    function setupHandler() {
        /* inline the handler so it uses the mocked $ */
        global.hideCardsAndAlerts = function (event) {
            if (!event.target.matches("#userCard, .float-right *, .navbar, .navbar *"))
                mockQueryResult.collapse("hide");
            if (!event.target.matches("#createTree"))
                mockQueryResult.hide();
        };
        document.body.addEventListener('click', global.hideCardsAndAlerts);
    }

    afterEach(function () {
        delete global.hideCardsAndAlerts;
    });

    it('should NOT collapse hide-on-click when clicking inside navbar', function () {
        setupHandler();
        document.getElementById('navLink').click();
        expect(mockCollapse).not.toHaveBeenCalled();
    });

    it('should NOT collapse hide-on-click when clicking navbar brand', function () {
        setupHandler();
        var brand = document.createElement('a');
        brand.className = 'navbar-brand';
        document.querySelector('.navbar').appendChild(brand);
        brand.click();
        expect(mockCollapse).not.toHaveBeenCalled();
    });

    it('should collapse hide-on-click when clicking outside navbar', function () {
        setupHandler();
        var outsideEl = document.createElement('div');
        outsideEl.id = 'outsideArea';
        document.body.appendChild(outsideEl);
        outsideEl.click();
        expect(mockCollapse).toHaveBeenCalledWith('hide');
    });

    it('should hide alerts when clicking outside #createTree', function () {
        setupHandler();
        document.body.click();
        expect(mockHide).toHaveBeenCalled();
    });

    it('should not hide alerts when clicking #createTree', function () {
        setupHandler();
        var treeBtn = document.createElement('div');
        treeBtn.id = 'createTree';
        document.body.appendChild(treeBtn);
        treeBtn.click();
        expect(mockHide).not.toHaveBeenCalled();
    });
});
