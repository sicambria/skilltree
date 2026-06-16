const https = require('https');

describe('wikidataService', () => {
    let WikidataService;

    beforeEach(() => {
        jest.resetModules();
        WikidataService = require('../../../src/services/wikidataService');
    });

    describe('search', () => {
        it('should parse search results from API response', async () => {
            const mockResponse = JSON.stringify({
                search: [
                    { id: 'Q1', label: 'Result 1', description: 'Desc 1' },
                    { id: 'Q2', label: 'Result 2', description: 'Desc 2' }
                ]
            });

            jest.spyOn(https, 'get').mockImplementation((url, opts, cb) => {
                if (typeof opts === 'function') {
                    cb = opts;
                }
                const res = {
                    on: (event, handler) => {
                        if (event === 'data') handler(mockResponse);
                        if (event === 'end') handler();
                    }
                };
                cb(res);
                return { on: jest.fn() };
            });

            const results = await WikidataService.search('test');
            expect(results.length).toBe(2);
            expect(results[0].id).toBe('Q1');
            jest.restoreAllMocks();
        });

        it('should return empty array when no search results', async () => {
            const mockResponse = JSON.stringify({ search: [] });

            jest.spyOn(https, 'get').mockImplementation((url, opts, cb) => {
                if (typeof opts === 'function') cb = opts;
                const res = {
                    on: (event, handler) => {
                        if (event === 'data') handler(mockResponse);
                        if (event === 'end') handler();
                    }
                };
                cb(res);
                return { on: jest.fn() };
            });

            const results = await WikidataService.search('nonexistent');
            expect(results).toEqual([]);
            jest.restoreAllMocks();
        });

        it('should return empty array when API response has no search property', async () => {
            const mockResponse = JSON.stringify({});

            jest.spyOn(https, 'get').mockImplementation((url, opts, cb) => {
                if (typeof opts === 'function') cb = opts;
                const res = {
                    on: (event, handler) => {
                        if (event === 'data') handler(mockResponse);
                        if (event === 'end') handler();
                    }
                };
                cb(res);
                return { on: jest.fn() };
            });

            const results = await WikidataService.search('test');
            expect(results).toEqual([]);
            jest.restoreAllMocks();
        });

        it('should handle JSON parse error', async () => {
            jest.spyOn(https, 'get').mockImplementation((url, opts, cb) => {
                if (typeof opts === 'function') cb = opts;
                const res = {
                    on: (event, handler) => {
                        if (event === 'data') handler('invalid json');
                        if (event === 'end') handler();
                    }
                };
                cb(res);
                return { on: jest.fn() };
            });

            await expect(WikidataService.search('test')).rejects.toThrow('Failed to parse Wikidata search response');
            jest.restoreAllMocks();
        });

        it('should reject on HTTP error', async () => {
            jest.spyOn(https, 'get').mockImplementation((url, opts, cb) => {
                if (typeof opts === 'function') cb = opts;
                return { on: (event, handler) => { if (event === 'error') handler(new Error('Network error')); } };
            });

            await expect(WikidataService.search('test')).rejects.toThrow('Network error');
            jest.restoreAllMocks();
        });
    });

    describe('getEntityDetails', () => {
        it('should parse entity details from API response', async () => {
            const mockResponse = JSON.stringify({
                entities: {
                    Q42: {
                        labels: { en: { value: 'Test Entity' } },
                        descriptions: { en: { value: 'A test entity' } },
                        sitelinks: { enwiki: { url: 'https://en.wikipedia.org/wiki/Test' } }
                    }
                }
            });

            jest.spyOn(https, 'get').mockImplementation((url, opts, cb) => {
                if (typeof opts === 'function') cb = opts;
                const res = {
                    on: (event, handler) => {
                        if (event === 'data') handler(mockResponse);
                        if (event === 'end') handler();
                    }
                };
                cb(res);
                return { on: jest.fn() };
            });

            const details = await WikidataService.getEntityDetails('Q42');
            expect(details).not.toBeNull();
            expect(details.qid).toBe('Q42');
            expect(details.name).toBe('Test Entity');
            expect(details.description).toBe('A test entity');
            expect(details.wikipediaURL).toBe('https://en.wikipedia.org/wiki/Test');
            jest.restoreAllMocks();
        });

        it('should return null when entity not found', async () => {
            const mockResponse = JSON.stringify({ entities: {} });

            jest.spyOn(https, 'get').mockImplementation((url, opts, cb) => {
                if (typeof opts === 'function') cb = opts;
                const res = {
                    on: (event, handler) => {
                        if (event === 'data') handler(mockResponse);
                        if (event === 'end') handler();
                    }
                };
                cb(res);
                return { on: jest.fn() };
            });

            const details = await WikidataService.getEntityDetails('Q999');
            expect(details).toBeNull();
            jest.restoreAllMocks();
        });

        it('should construct Wikipedia URL from sitelink title', async () => {
            const mockResponse = JSON.stringify({
                entities: {
                    Q1: {
                        labels: { en: { value: 'Entity' } },
                        descriptions: { en: { value: '' } },
                        sitelinks: { enwiki: { url: 'Entity_Name' } }
                    }
                }
            });

            jest.spyOn(https, 'get').mockImplementation((url, opts, cb) => {
                if (typeof opts === 'function') cb = opts;
                const res = {
                    on: (event, handler) => {
                        if (event === 'data') handler(mockResponse);
                        if (event === 'end') handler();
                    }
                };
                cb(res);
                return { on: jest.fn() };
            });

            const details = await WikidataService.getEntityDetails('Q1');
            expect(details.wikipediaURL).toBe('https://en.wikipedia.org/wiki/Entity_Name');
            jest.restoreAllMocks();
        });

        it('should handle missing labels gracefully', async () => {
            const mockResponse = JSON.stringify({
                entities: {
                    Q1: { labels: {}, descriptions: {}, sitelinks: {} }
                }
            });

            jest.spyOn(https, 'get').mockImplementation((url, opts, cb) => {
                if (typeof opts === 'function') cb = opts;
                const res = {
                    on: (event, handler) => {
                        if (event === 'data') handler(mockResponse);
                        if (event === 'end') handler();
                    }
                };
                cb(res);
                return { on: jest.fn() };
            });

            const details = await WikidataService.getEntityDetails('Q1');
            expect(details.name).toBe('Unknown');
            expect(details.description).toBe('');
            expect(details.wikipediaURL).toBe('');
            jest.restoreAllMocks();
        });

        it('should reject on HTTP error', async () => {
            jest.spyOn(https, 'get').mockImplementation((url, opts, cb) => {
                if (typeof opts === 'function') cb = opts;
                return { on: (event, handler) => { if (event === 'error') handler(new Error('Network error')); } };
            });

            await expect(WikidataService.getEntityDetails('Q1')).rejects.toThrow('Network error');
            jest.restoreAllMocks();
        });

        it('should reject on parse error', async () => {
            jest.spyOn(https, 'get').mockImplementation((url, opts, cb) => {
                if (typeof opts === 'function') cb = opts;
                const res = {
                    on: (event, handler) => {
                        if (event === 'data') handler('invalid json');
                        if (event === 'end') handler();
                    }
                };
                cb(res);
                return { on: jest.fn() };
            });

            await expect(WikidataService.getEntityDetails('Q1')).rejects.toThrow('Failed to parse Wikidata entity details for Q1');
            jest.restoreAllMocks();
        });
    });
});
