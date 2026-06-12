const { hashPassword, verifyPassword } = require('../../../src/utils/security');

describe('security.js', () => {
    describe('hashPassword', () => {
        it('should return a Buffer', () => {
            const result = hashPassword('testPassword123');
            expect(result).toBeInstanceOf(Buffer);
        });

        it('should produce different hashes for the same password (different salt)', () => {
            const hash1 = hashPassword('samePassword');
            const hash2 = hashPassword('samePassword');
            expect(hash1.equals(hash2)).toBe(false);
        });

        it('should produce different hashes for different passwords', () => {
            const hash1 = hashPassword('password1');
            const hash2 = hashPassword('password2');
            expect(hash1.equals(hash2)).toBe(false);
        });

        it('should handle empty string password', () => {
            const result = hashPassword('');
            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(0);
        });

        it('should handle special characters in password', () => {
            const result = hashPassword('!@#$%^&*()_+-=[]{}|;:,.<>?~`©®');
            expect(result).toBeInstanceOf(Buffer);
        });

        it('should handle very long password', () => {
            const longPw = 'a'.repeat(1000);
            const result = hashPassword(longPw);
            expect(result).toBeInstanceOf(Buffer);
        });
    });

    describe('verifyPassword', () => {
        it('should return true for correct password', () => {
            const hash = hashPassword('myPassword');
            const result = verifyPassword('myPassword', hash);
            expect(result).toBe(true);
        });

        it('should return false for incorrect password', () => {
            const hash = hashPassword('myPassword');
            const result = verifyPassword('wrongPassword', hash);
            expect(result).toBe(false);
        });

        it('should round-trip correctly for multiple passwords', () => {
            const passwords = ['abc', '123456', 'P@ssw0rd!', 'a', ''];
            for (const pw of passwords) {
                const hash = hashPassword(pw);
                expect(verifyPassword(pw, hash)).toBe(true);
                expect(verifyPassword(pw + 'x', hash)).toBe(false);
            }
        });

        it('should throw or return false for corrupted hash data', () => {
            const hash = hashPassword('test');
            const corrupted = Buffer.from(hash);
            corrupted[0] = corrupted[0] + 1;
            expect(() => verifyPassword('test', corrupted)).toThrow();
        });
    });
});
