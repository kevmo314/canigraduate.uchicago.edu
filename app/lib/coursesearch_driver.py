import atexit
import os
import pyvirtualdisplay
import selenium

from selenium import webdriver

class CourseSearchDriver(webdriver.Chrome):
    def __init__(self):
        display = pyvirtualdisplay.Display(visible=0, size=(1024, 768))
        display.start()
        super(CourseSearchDriver, self).__init__()
        self._wait = selenium.webdriver.support.ui.WebDriverWait(self, 30)
        self.get('https://coursesearch.uchicago.edu/')
        atexit.register(lambda: display.stop())

    def wait_until_loaded(self):
        self._wait.until(lambda driver: not driver.find_element_by_id('processing').is_displayed())

if __name__ == '__main__':
    print(CourseSearchDriver().page_source)
