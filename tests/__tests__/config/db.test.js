const mongoose = require('mongoose');

describe('db.js', () => {
    const OLD_ENV = process.env;

    afterEach(() => {
        process.env = OLD_ENV;
        jest.restoreAllMocks();
    });

    it('should connect to database successfully', async () => {
        jest.spyOn(mongoose, 'connect').mockResolvedValue();
        const connectDB = require('../../../src/config/db');
        await expect(connectDB()).resolves.toBeUndefined();
    });

    it('should exit process on connection failure', async () => {
        jest.spyOn(mongoose, 'connect').mockRejectedValue(new Error('Connection refused'));
        jest.spyOn(process, 'exit').mockImplementation(() => {});
        const connectDB = require('../../../src/config/db');
        await connectDB();
        expect(process.exit).toHaveBeenCalledWith(1);
    });
});
