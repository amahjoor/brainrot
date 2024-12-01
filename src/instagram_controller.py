from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import pickle

class InstagramController:
    def __init__(self):
        chrome_options = Options()
        chrome_options.binary_location = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        
        # Add these options to make Chrome more stable
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--disable-features=VizDisplayCompositor')
        chrome_options.add_argument('--disable-features=IsolateOrigins,site-per-process')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        
        # Add user agent to look more like a real browser
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(
            service=service,
            options=chrome_options
        )
        
        # Set page load timeout
        self.driver.set_page_load_timeout(30)
        
    def login(self, username, password):
        try:
            print("Starting login process...")
            self.driver.get("https://www.instagram.com/")
            time.sleep(2)
            
            wait = WebDriverWait(self.driver, 10)
            
            # Login process
            print("Waiting for login fields...")
            username_input = wait.until(
                EC.presence_of_element_located((By.NAME, "username"))
            )
            password_input = self.driver.find_element(By.NAME, "password")
            
            username_input.send_keys(username)
            password_input.send_keys(password)
            
            print("Clicking login button...")
            login_button = wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
            )
            login_button.click()
            
            # Verify login success
            print("Verifying login...")
            try:
                # Wait for either the profile icon or the "Save Login Info" popup
                wait.until(
                    EC.any_of(
                        EC.presence_of_element_located((By.CSS_SELECTOR, "span._aaav")),  # Profile icon
                        EC.presence_of_element_located((By.CSS_SELECTOR, "button._acan._acap._acas")),  # Save login popup
                        EC.presence_of_element_located((By.CSS_SELECTOR, "a[href='/direct/inbox/']"))  # DM icon
                    )
                )
                print("Login successful!")
            except Exception as e:
                print("Login verification failed!")
                print(f"Error: {str(e)}")
                return False
            
            # Handle popups
            self._handle_popups(wait)
            
            # After login, go to the main feed first
            print("Going to main feed...")
            self.driver.get("https://www.instagram.com/")
            time.sleep(3)
            
            # Try to find and click the reels button
            print("Looking for reels button...")
            try:
                reels_button = wait.until(
                    EC.element_to_be_clickable((
                        By.CSS_SELECTOR, 
                        "a[href='/reels/']"
                    ))
                )
                print("Found reels button, clicking...")
                reels_button.click()
                time.sleep(3)
            except Exception as e:
                print(f"Couldn't find reels button: {str(e)}")
                print("Trying direct navigation...")
                self.driver.get("https://www.instagram.com/reels/")
                time.sleep(3)
            
            # Verify we're on the reels page
            current_url = self.driver.current_url
            print(f"Current URL: {current_url}")
            
            # Wait for any reel content
            print("Waiting for reels content...")
            try:
                wait.until(
                    EC.presence_of_element_located((
                        By.CSS_SELECTOR, 
                        "div[role='presentation'], div._aagv, video"
                    ))
                )
                print("Reels loaded successfully!")
                return True
            except Exception as e:
                print(f"Error waiting for reels: {str(e)}")
                return False
            
        except Exception as e:
            print(f"Error during login/navigation: {str(e)}")
            try:
                print(f"Current URL: {self.driver.current_url}")
            except:
                print("Could not get current URL")
            return False
            
    def _handle_popups(self, wait):
        """Handle various Instagram popups"""
        try:
            # Save Login Info popup
            save_info_button = wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button._acan._acap._acas"))
            )
            save_info_button.click()
            print("Handled 'Save Login Info' popup")
        except:
            print("No 'Save Login Info' popup found")
            
        try:
            # Notifications popup
            notifications_button = wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button._a9_1"))
            )
            notifications_button.click()
            print("Handled notifications popup")
        except:
            print("No notifications popup found")
        
    def scroll_to_next_reel(self):
        """Scroll to the next reel"""
        try:
            self.driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ARROW_DOWN)
            time.sleep(1)  # Wait for animation
        except Exception as e:
            print(f"Error scrolling to next reel: {str(e)}")
        
    def like_current_reel(self):
        """Like the current reel"""
        try:
            like_button = self.driver.find_element(By.CSS_SELECTOR, "[aria-label='Like']")
            like_button.click()
        except Exception as e:
            print(f"Error liking reel: {str(e)}")
        
    def save_current_reel(self):
        """Save the current reel"""
        try:
            save_button = self.driver.find_element(By.CSS_SELECTOR, "[aria-label='Save']")
            save_button.click()
        except Exception as e:
            print(f"Error saving reel: {str(e)}")
        
    def save_cookies(self):
        cookies = self.driver.get_cookies()
        with open('cookies.pkl', 'wb') as f:
            pickle.dump(cookies, f)

    def load_cookies(self):
        try:
            with open('cookies.pkl', 'rb') as f:
                cookies = pickle.load(f)
                for cookie in cookies:
                    self.driver.add_cookie(cookie)
            return True
        except:
            return False