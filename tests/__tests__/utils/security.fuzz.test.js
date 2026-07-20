const fc = require('fast-check');
const crypto = require('crypto');
const { hashPassword, verifyPassword } = require('../../../src/utils/security');

describe('Security fuzz tests', () => {
    it('hash and verify are inverse for any string', () => {
        fc.assert(
            fc.property(fc.string(), (password) => {
                const hash = hashPassword(password);
                expect(verifyPassword(password, hash)).toBe(true);
            })
        );
    });

    it('verifyPassword rejects wrong password for any pair of different strings', () => {
        fc.assert(
            fc.property(fc.string(), fc.string(), (pw1, pw2) => {
                fc.pre(pw1 !== pw2);
                const hash = hashPassword(pw1);
                expect(verifyPassword(pw2, hash)).toBe(false);
            })
        );
    });

    it('different salts produce different hashes for same input', () => {
        fc.assert(
            fc.property(fc.string(), (password) => {
                const hash1 = hashPassword(password);
                const hash2 = hashPassword(password);
                expect(hash1.equals(hash2)).toBe(false);
            })
        );
    });

    it('hash handles long strings without crashing', () => {
        fc.assert(
            fc.property(fc.string({ minLength: 0, maxLength: 200 }), (password) => {
                const hash = hashPassword(password);
                expect(verifyPassword(password, hash)).toBe(true);
            }),
            { numRuns: 50 }
        );
    });

    it('verifyPassword handles corrupted hash without crashing process', () => {
        fc.assert(
            fc.property(fc.string({ minLength: 0, maxLength: 50 }), (password) => {
                const hash = hashPassword(password);
                const corrupted = Buffer.from(hash);
                const idx = Math.floor(Math.random() * corrupted.length);
                corrupted[idx] = (corrupted[idx] + 1) % 256;
                try {
                    const result = verifyPassword(password, corrupted);
                    expect(typeof result).toBe('boolean');
                } catch (e) {
                    expect(e).toBeDefined();
                }
            }),
            { numRuns: 20 }
        );
    });
});
