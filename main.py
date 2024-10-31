import requests
from time import sleep
from urllib.parse import urljoin
import logging

class TripAdvisorScraper:
    def __init__(self, base_url='https://www.tripadvisor.com'):
        self.base_url = base_url
        self.session = requests.Session()
        # Using a realistic user agent
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        }
        self.session.headers.update(self.headers)
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger('TripAdvisorScraper')

    def get_page_content(self, url_path, retry_count=3, delay=2):
        """
        Get HTML content from TripAdvisor pages with retry mechanism and rate limiting
        
        Args:
            url_path (str): The path or full URL to scrape
            retry_count (int): Number of retry attempts
            delay (int): Delay between requests in seconds
            
        Returns:
            str: HTML content of the page or None if failed
        """
        full_url = urljoin(self.base_url, url_path) if not url_path.startswith('http') else url_path
        
        for attempt in range(retry_count):
            try:
                # Respect rate limiting
                sleep(delay)
                
                response = self.session.get(full_url, timeout=10)
                response.raise_for_status()
                
                self.logger.info(f"Successfully retrieved content from {full_url}")
                return response.text

            except requests.exceptions.RequestException as e:
                self.logger.warning(f"Attempt {attempt + 1} failed: {str(e)}")
                if attempt == retry_count - 1:
                    self.logger.error(f"Failed to retrieve {full_url} after {retry_count} attempts")
                    return None
                sleep(delay * (attempt + 1))  # Exponential backoff

    def close(self):
        """Close the session"""
        self.session.close()

def main():
    # Example usage
    scraper = TripAdvisorScraper()
    try:
        # Example: Get a hotel page
        content = scraper.get_page_content('/Hotels-g186338-a_travelersChoice.1-London_England-Hotels.html')
        if content:
            print(content)
            # Process the content as needed
    finally:
        scraper.close()

if __name__ == '__main__':
    main()