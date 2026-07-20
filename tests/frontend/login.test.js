const fs = require('fs');
const path = require('path');

const loginCode = fs.readFileSync(path.resolve(__dirname, '../../public/login.js'), 'utf8');

let mockXHRInstance;

beforeAll(() => {
    global.$ = jest.fn().mockReturnValue({ hide: jest.fn(), show: jest.fn() });

    const mockStorage = { setItem: jest.fn(), getItem: jest.fn() };
    Object.defineProperty(global, 'localStorage', { value: mockStorage, configurable: true, writable: true });

    global.open = jest.fn();

    mockXHRInstance = {
        open: jest.fn(),
        setRequestHeader: jest.fn(),
        send: jest.fn(),
        responseType: undefined,
        readyState: 4,
        status: 200,
        response: { success: true, token: 'fake-jwt-token' }
    };
    global.XMLHttpRequest = jest.fn(() => mockXHRInstance);

    document.body.innerHTML = `<div id="bottomAlert" class="alert" style="display:none"><span id="bottomAlertMsg"></span></div>`;
    (0, eval)(loginCode);
});

beforeEach(() => {
    jest.clearAllMocks();
    mockXHRInstance.response = { success: true, token: 'fake-jwt-token' };
    mockXHRInstance.status = 200;
    document.body.innerHTML = `
        <div id="loginBox">cont</div>
        <input id="username" value="testuser" />
        <input id="password" value="password123" />
        <div id="bottomAlert" style="display:none"><span id="bottomAlertMsg"></span></div>
    `;
});

afterAll(() => {
    delete global.$;
    delete global.XMLHttpRequest;
    delete global.open;
    delete global.localStorage;
});

describe('validate()', () => {
    it('should send login request with credentials', () => {
        validate();

        expect(mockXHRInstance.open).toHaveBeenCalledWith('POST', '/auth', true);
        expect(mockXHRInstance.setRequestHeader).toHaveBeenCalledWith('Content-type', 'application/json');
        expect(mockXHRInstance.send).toHaveBeenCalledWith(
            JSON.stringify({ username: 'testuser', password: 'password123' })
        );
    });

    it('should store token and redirect on success', () => {
        validate();

        mockXHRInstance.onreadystatechange();

        expect(global.localStorage.setItem).toHaveBeenCalledWith('loginToken', 'fake-jwt-token');
        expect(global.open).toHaveBeenCalledWith('/user', '_self');
    });

    it('should show alert on failed login', () => {
        mockXHRInstance.response = { success: false };
        validate();

        mockXHRInstance.onreadystatechange();

        expect(global.localStorage.setItem).not.toHaveBeenCalled();
        const alertMsg = document.getElementById('bottomAlertMsg');
        expect(alertMsg.innerText).toBe('Wrong username or password!');
    });

    it('should not store token on network error', () => {
        mockXHRInstance.status = 500;
        validate();

        mockXHRInstance.onreadystatechange();

        expect(global.localStorage.setItem).not.toHaveBeenCalled();
    });
});

describe('hideAlert', () => {
    it('should hide all alerts', () => {
        hideAlert();
        expect(global.$).toHaveBeenCalledWith('.alert');
    });
});

describe('document.body click listener', () => {
    it('should call hideAlert on body click (via $.hide)', () => {
        document.body.click();
        expect(global.$).toHaveBeenCalledWith('.alert');
    });
});
