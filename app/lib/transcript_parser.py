import bs4
import requests

from course import Course
from grade import Grade
from section import Section
from term import Term
from transcript_record import TranscriptRecord

class TranscriptParser(object):
    def __init__(self, username, password):
        self.username = username
        self.password = password

    def _get_transcript_page(self):
        session = requests.Session()
        session.get('https://aisweb.uchicago.edu/psp/ihprd/EMPLOYEE/EMPL/s/WEBLIB_REDIRECT.ISCRIPT2.FieldFormula.IScript_redirect').text
        secondary_page = bs4.BeautifulSoup(session.post('https://shibboleth2.uchicago.edu/idp/profile/SAML2/Redirect/SSO?execution=e1s1', {
            'j_username': self.username,
            'j_password': self.password,
            '_eventId_proceed': ''
        }).text, 'lxml')
        relay_state = secondary_page.find('input', {'name': 'RelayState'})['value']
        saml_response = secondary_page.find('input', {'name': 'SAMLResponse'})['value']
        session.post('https://aisweb.uchicago.edu/Shibboleth.sso/SAML2/POST', {'RelayState': relay_state, 'SAMLResponse': saml_response})
        return bs4.BeautifulSoup(session.get('https://aisweb.uchicago.edu/psp/ihprd/EMPLOYEE/EMPL/h/?tab=UC_STUDENT_TAB').text, 'lxml')

    def _get_gyear_map(self, page):
        results = {}
        for option in page.find('select', {'id': 'gyear_id'}).find_all('option'):
            results[option['value']] = Term(id=option.getText())
        return results

    def execute(self):
        page = self._get_transcript_page()
        gyear_map = self._get_gyear_map(page)
        for table in page.find_all('table', {'class': 'gyear'}):
            term = gyear_map[table['id'][5:]]
            for row in table.find_all('tr'):
                cells = row.find_all('td')
                course = cells[0].getText()[:10]
                section = cells[0].getText()[11:]
                grade = cells[2].getText()
                yield TranscriptRecord(
                        section=Section(id=section, course=Course(id=course)),
                        grade=Grade(grade) if grade.find('In Progress') == -1 else None,
                        term=term)
