const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

class TripAdvisorScraper {
    constructor(baseUrl = 'https://www.tripadvisor.com') {
        this.baseUrl = baseUrl;
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async getPageContent(urlPath, retryCount = 3, delayMs = 2000) {
        const fullUrl = urlPath.startsWith('http') ? urlPath : `${this.baseUrl}${urlPath}`;
        
        for (let attempt = 0; attempt < retryCount; attempt++) {
            try {
                // Respect rate limiting
                await this.delay(delayMs);

                console.log(`Fetching ${fullUrl} (Attempt ${attempt + 1}/${retryCount})`);
                const response = await fetch(fullUrl, { headers: this.headers });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const content = await response.text();
                console.log('Content retrieved successfully');
                return content;

            } catch (error) {
                console.warn(`Attempt ${attempt + 1} failed:`, error.message);
                if (attempt === retryCount - 1) {
                    console.error(`Failed to retrieve ${fullUrl} after ${retryCount} attempts`);
                    throw error;
                }
                // Exponential backoff
                await this.delay(delayMs * (attempt + 1));
            }
        }
    }

    async saveToFile(content, filepath) {
        try {
            // Ensure the directory exists
            const directory = path.dirname(filepath);
            await fs.mkdir(directory, { recursive: true });
            
            // Save the content
            await fs.writeFile(filepath, content, 'utf8');
            console.log(`Content saved successfully to ${filepath}`);
        } catch (error) {
            console.error('Error saving file:', error);
            throw error;
        }
    }
}

async function main() {
    const scraper = new TripAdvisorScraper();
    
    try {
        // Example: Get a hotel page
        const urlPath = '/Hotel_Review-g60763-d1218720-Reviews-The_Standard_High_Line-New_York_City_New_York.html';
        
        // Create filename based on current date and time
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `tripadvisor_${timestamp}.html`;
        const filepath = path.join('scraped_data', filename);

        // Get content and save it
        const content = await scraper.getPageContent(urlPath);
        await scraper.saveToFile(content, filepath);

    } catch (error) {
        console.error('Scraping failed:', error);
    }
}

// Run the scraper
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TripAdvisorScraper;