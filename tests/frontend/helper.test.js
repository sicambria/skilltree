const fs = require('fs');
const path = require('path');

const helperCode = fs.readFileSync(path.resolve(__dirname, '../../public/user/src/helper.js'), 'utf8');

beforeAll(() => {
    const $mock = jest.fn().mockReturnValue({ hide: jest.fn(), show: jest.fn() });
    global.$ = $mock;
    global.window = global;
    (0, eval)(helperCode);
});

afterAll(() => {
    delete global.$;
    delete global.window;
});

describe('checkPassword', () => {
    it('should accept strong passwords', () => {
        expect(checkPassword('Abcdef1!')).toBe(true);
        expect(checkPassword('StrongP@ss1')).toBe(true);
        expect(checkPassword('aA1' + 'x'.repeat(10))).toBe(true);
    });

    it('should reject weak passwords', () => {
        expect(checkPassword('short')).toBe(false);
        expect(checkPassword('nouppercase1')).toBe(false);
        expect(checkPassword('NOLOWERCASE1')).toBe(false);
        expect(checkPassword('NoDigits!!')).toBe(false);
        expect(checkPassword('')).toBe(false);
    });
});

describe('parseJwt', () => {
    it('should parse a valid JWT payload', () => {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiYWRtaW4iOnRydWV9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        const result = parseJwt(token);
        expect(result.username).toBe('testuser');
        expect(result.admin).toBe(true);
    });

    it('should handle tokens with admin: false', () => {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIiLCJhZG1pbiI6ZmFsc2V9.xyz';
        const result = parseJwt(token);
        expect(result.username).toBe('user');
        expect(result.admin).toBe(false);
    });
});

describe('Array.prototype.sum', () => {
    it('should sum a numeric property across array elements', () => {
        const arr = [{ val: 1 }, { val: 2 }, { val: 3 }];
        expect(arr.sum('val')).toBe(6);
    });

    it('should return 0 for empty array', () => {
        expect([].sum('val')).toBe(0);
    });
});

describe('showBottomAlert', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="bottomAlert" class="alert" style="display:none">
                <span id="bottomAlertMsg"></span>
            </div>
        `;
    });

    it('should show alert with message and type', () => {
        showBottomAlert('success', 'Operation completed');
        const alertEl = document.getElementById('bottomAlert');
        expect(alertEl.className).toContain('alert-success');
        expect(document.getElementById('bottomAlertMsg').innerText).toBe('Operation completed');
    });

    it('should call setTimeout with 3000ms for non-danger types', () => {
        jest.useFakeTimers();
        const setTimeoutSpy = jest.fn();
        global.setTimeout = setTimeoutSpy;
        showBottomAlert('success', 'Hello');
        expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000);
        global.setTimeout = setTimeout;
        jest.useRealTimers();
    });

    it('should not call setTimeout for danger type', () => {
        jest.useFakeTimers();
        const setTimeoutSpy = jest.fn();
        global.setTimeout = setTimeoutSpy;
        showBottomAlert('danger', 'Error!');
        expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 3000);
        global.setTimeout = setTimeout;
        jest.useRealTimers();
    });
});
