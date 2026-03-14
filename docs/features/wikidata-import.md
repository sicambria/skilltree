# Wikidata Skill Import

The Wikidata Skill Import feature allows administrators to quickly expand the skill database by importing entities from Wikidata.

## How to use

1.  **Login as Admin**: Only administrators have access to this feature.
2.  **Open the Admin Menu**: Click on the "Admin" dropdown in the navigation bar.
3.  **Select "Wikidata Import"**: This will open the import modal.
4.  **Search for Skills**:
    *   Type a skill name (e.g., "JavaScript", "Project Management") in the search box.
    *   Click the "Search" button.
    *   Search results from Wikidata will appear below.
5.  **Build your batch**:
    *   Click the "+" icon next to a search result to add it to your batch list on the right.
    *   You can add multiple skills to import them all at once.
    *   Click the trash icon in the batch list to remove a skill.
6.  **Select Category**: Choose the target category for the imported skills.
7.  **Import**: Click "Import Selected Skills".
    *   The system will fetch detailed descriptions and Wikipedia links for each skill and save them to the database.
    *   Duplicate skills (by name) will be automatically skipped.

## Data Mapping

The following information is retrieved from Wikidata:

*   **Name**: From the Wikidata label (English).
*   **Description**: From the Wikidata description (English).
*   **Wikipedia Link**: From the English Wikipedia sitelink.

Additional default values:
*   **Skill Icon**: Set to a default icon.
*   **Levels**: Pre-populated with 5 standard levels (Novice to Expert).
*   **Max Points**: Set to 5.

## Technical Details

The import process uses the following Wikidata API actions:
*   `wbsearchentities`: For finding relevant items.
*   `wbgetentities`: For retrieving full labels, descriptions, and sitelinks.

The backend implementation can be found in:
*   `src/services/wikidataService.js`
*   `src/controllers/adminController.js` (methods `wikidataSearch` and `wikidataImport`)
