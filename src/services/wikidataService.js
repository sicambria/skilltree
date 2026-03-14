const https = require('https');

/**
 * Service to interact with Wikidata API
 */
const WikidataService = {
    /**
     * Search for entities on Wikidata
     * @param {string} query Search terms
     * @returns {Promise<Array>} List of search results
     */
    search: (query) => {
        return new Promise((resolve, reject) => {
            const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&limit=10`;
            
            https.get(url, { headers: { 'User-Agent': 'SkillTreeApp/1.0 (https://github.com/skilltree)' } }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        resolve(json.search || []);
                    } catch (e) {
                        reject(new Error('Failed to parse Wikidata search response'));
                    }
                });
            }).on('error', (err) => {
                reject(err);
            });
        });
    },

    /**
     * Get detailed information for a specific Wikidata entity
     * @param {string} qid Wikidata item ID (e.g., Q28865)
     * @returns {Promise<Object>} Entity details
     */
    getEntityDetails: (qid) => {
        return new Promise((resolve, reject) => {
            const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&languages=en&props=labels|descriptions|sitelinks&sitefilter=enwiki&format=json`;
            
            https.get(url, { headers: { 'User-Agent': 'SkillTreeApp/1.0 (https://github.com/skilltree)' } }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const entity = json.entities[qid];
                        
                        if (!entity) return resolve(null);

                        const result = {
                            qid: qid,
                            name: entity.labels?.en?.value || 'Unknown',
                            description: entity.descriptions?.en?.value || '',
                            wikipediaURL: entity.sitelinks?.enwiki?.url || ''
                        };

                        // If it's just a regular sitelink title, construct the full URL
                        if (result.wikipediaURL && !result.wikipediaURL.startsWith('http')) {
                            result.wikipediaURL = `https://en.wikipedia.org/wiki/${result.wikipediaURL.replace(/ /g, '_')}`;
                        }

                        resolve(result);
                    } catch (e) {
                        reject(new Error(`Failed to parse Wikidata entity details for ${qid}`));
                    }
                });
            }).on('error', (err) => {
                reject(err);
            });
        });
    }
};

module.exports = WikidataService;
