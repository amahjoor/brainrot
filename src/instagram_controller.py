import os
import warnings
warnings.filterwarnings("ignore")
os.environ['WDM_LOG_LEVEL'] = '0'
os.environ['WDM_PRINT_FIRST_LINE'] = 'False'

# Suppress macOS warnings
os.environ['PYTHONWARNINGS'] = 'ignore::DeprecationWarning'
os.environ['OBJC_DISABLE_INITIALIZE_FORK_SAFETY'] = 'YES'

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
        self.setup_driver()
        self.is_logged_in = False
        self.username = None
        self.password = None
        
        # Try to load existing session
        try:
            self.driver.get("https://www.instagram.com")
            time.sleep(2)
            self.load_cookies()
            self.driver.refresh()  # Refresh to apply cookies
            time.sleep(2)
        except Exception as e:
            print(f"Failed to load existing session: {e}")
    
    def setup_driver(self):
        """Initialize or reinitialize the Chrome driver"""
        chrome_options = Options()
        chrome_options.binary_location = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        
        # Add these options to make Chrome more stable
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--disable-features=VizDisplayCompositor')
        chrome_options.add_argument('--disable-features=IsolateOrigins,site-per-process')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        
        # Add memory and performance related options
        chrome_options.add_argument('--memory-pressure-off')
        chrome_options.add_argument('--disable-background-networking')
        chrome_options.add_argument('--disk-cache-size=102400')
        
        # Add user agent to look more like a real browser
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')
        
        try:
            self.driver = webdriver.Chrome(
                service=Service(ChromeDriverManager().install()),
                options=chrome_options
            )
            # Increase timeouts
            self.driver.set_page_load_timeout(60)
            self.driver.implicitly_wait(30)
            return True
        except Exception as e:
            print(f"Failed to initialize driver: {e}")
            return False
    
    def check_session(self):
        """Check if the session is still valid"""
        try:
            # Try to access a simple property
            self.driver.current_url
            return True
        except:
            print("Session invalid, attempting to reconnect...")
            try:
                self.setup_driver()
                if self.is_logged_in and self.username and self.password:
                    self.login(self.username, self.password)
                return True
            except Exception as e:
                print(f"Failed to restore session: {e}")
                return False
    
    def login(self, username, password):
        """Login to Instagram and go directly to reels"""
        try:
            print("Starting login process...")
            self.username = username
            self.password = password
            
            # Clear existing cookies and cache
            print("Clearing previous session data...")
            self.driver.delete_all_cookies()
            if os.path.exists('cookies.pkl'):
                os.remove('cookies.pkl')
            
            # Execute JavaScript to clear localStorage and sessionStorage
            self.driver.execute_script("window.localStorage.clear();")
            self.driver.execute_script("window.sessionStorage.clear();")
            
            # Close and quit the current driver
            self.driver.quit()
            
            # Reinitialize the driver
            print("Reinitializing browser...")
            self.setup_driver()
            
            # Load Instagram with reduced initial wait
            self.driver.get("https://www.instagram.com")
            time.sleep(2)
            
            wait = WebDriverWait(self.driver, 10)
            
            # Enter credentials
            print("Entering credentials...")
            username_input = wait.until(
                EC.presence_of_element_located((By.NAME, "username"))
            )
            password_input = wait.until(
                EC.presence_of_element_located((By.NAME, "password"))
            )
            
            username_input.send_keys(username)
            password_input.send_keys(password)
            
            # Click login
            print("Clicking login button...")
            login_button = wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
            )
            login_button.click()
            time.sleep(3)
            
            # Check if we're on the onetap page and immediately redirect to reels
            if "accounts/onetap" in self.driver.current_url:
                print("Detected onetap page, redirecting to reels...")
                self.driver.get("https://www.instagram.com/reels/")
                time.sleep(3)
            
            # Verify login success and reels content
            try:
                print("Verifying login state...")
                wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "span._aa8h"))
                )
                print("Login verified!")
                self.is_logged_in = True
                
                # Save cookies after confirmed login
                print("Saving session cookies...")
                self.save_cookies()
                
                # Verify reels loaded properly
                if self.wait_for_reel_content(timeout=15):
                    print("Successfully loaded reels page!")
                    return True
                else:
                    print("Failed to load reels content")
                    return False
                    
            except Exception as e:
                print(f"Failed to verify login: {e}")
                return False
                
        except Exception as e:
            print(f"Login process failed: {e}")
            return False
    
    def _handle_popups(self, wait):
        """Handle various Instagram popups with reduced timeouts"""
        try:
            # Save login info popup - quick check
            try:
                save_info_button = wait.until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, "button._acan._acap._acas")),
                    timeout=3
                )
                save_info_button.click()
            except:
                pass

            # Notifications popup - quick check
            try:
                not_now_button = wait.until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, "button._a9--._a9_1")),
                    timeout=3
                )
                not_now_button.click()
            except:
                pass
        except Exception:
            pass  # Ignore popup handling errors
    
    def scroll_to_next_reel(self):
        """Scroll to the next reel"""
        if not self.check_session():
            print("Cannot scroll - invalid session")
            return False
            
        try:
            self.driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ARROW_DOWN)
            time.sleep(2)  # Increased wait for animation
            return True
        except Exception as e:
            print(f"Error scrolling to next reel: {str(e)}")
            return False
        
    def like_current_reel(self):
        """Like the current reel with session checking"""
        if not self.check_session():
            print("Cannot like reel - invalid session")
            return False
            
        try:
            like_button = self.driver.find_element(
                By.CSS_SELECTOR, 
                "span.xp7jhwk [aria-label='Like']"
            )
            like_button.click()
            print("Liked reel")
            time.sleep(1)
            return True
        except Exception as e:
            print(f"Error liking reel: {e}")
            return False
        
    def save_current_reel(self):
        """Save the current reel"""
        if not self.check_session():
            print("Cannot save reel - invalid session")
            return False
            
        try:
            save_button = self.driver.find_element(By.CSS_SELECTOR, "[aria-label='Save']")
            save_button.click()
            time.sleep(1)
            return True
        except Exception as e:
            print(f"Error saving reel: {str(e)}")
            return False
        
    def save_cookies(self):
        """Save session cookies"""
        try:
            cookies = self.driver.get_cookies()
            with open('cookies.pkl', 'wb') as f:
                pickle.dump(cookies, f)
            print("Cookies saved successfully")
            return True
        except Exception as e:
            print(f"Error saving cookies: {e}")
            return False

    def load_cookies(self):
        """Load saved session cookies"""
        try:
            with open('cookies.pkl', 'rb') as f:
                cookies = pickle.load(f)
                for cookie in cookies:
                    self.driver.add_cookie(cookie)
            print("Cookies loaded successfully")
            return True
        except Exception as e:
            print(f"Error loading cookies: {e}")
            return False
    
    def wait_for_reel_content(self, timeout=20):
        """Enhanced wait for reel content"""
        try:
            wait = WebDriverWait(self.driver, timeout)
            # Wait for either video element or reel container
            wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "video, div._aagv"))
            )
            # Additional wait for video to be ready
            time.sleep(2)
            return True
        except Exception as e:
            print(f"Timeout waiting for reel content: {e}")
            return False