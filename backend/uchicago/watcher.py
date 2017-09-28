import requests
from lxml import html
import pyrebase
from difflib import Differ
import sendgrid
import os
from sendgrid.helpers.mail import *

FIREBASE = pyrebase.initialize_app({
    'apiKey':
    'AIzaSyCjBDyhwbXcp9kEIA2pMHLDGxmCM4Sn6Eg',
    'authDomain':
    'canigraduate-43286.firebaseapp.com',
    'databaseURL':
    'https://canigraduate-43286.firebaseio.com',
    'storageBucket':
    'canigraduate-43286.appspot.com',
    'serviceAccount':
    './service_account_key.json'
})

def watcher(program):
	url = db.child('programs').child(program).child('metadata').child('catalog').get().val()
	xpath = db.child('programs').child(program).child('metadata').child('source').get().val()
	stored_requirement = db.child('programs').child(program).child('page-state').get().val()
	tree = html.fromstring(requests.get(url).content)
	current_requirement = tree.xpath(xpath)[0].text_content()
	if stored_requirement == None:
		db.child('programs').child(program).child('page-state').set(current_requirement)
	elif stored_requirement != current_requirement:
		db.child('programs').child(program).child('page-state').set(current_requirement)
		emailHelper(program, stored_requirement, current_requirement)

	extensions = db.child('programs').child(program).child('extensions').get().val()
	if extensions != None:
		for e in list(extensions):
			e_url = db.child('programs').child(program).child('extensions').child(e).child('metadata').child('catalog').get().val()
			e_xpath = db.child('programs').child(program).child('extensions').child(e).child('metadata').child('source').get().val()
			e_stored_requirement = db.child('programs').child(program).child('extensions').child(e).child('page-state').get().val()
			e_tree = html.fromstring(requests.get(e_url).content)
			e_current_requirement = tree.xpath(e_xpath)[0].text_content()
			if e_stored_requirement == None:
				db.child('programs').child(program).child('extensions').child(e).child('page-state').set(e_current_requirement)
			elif e_stored_requirement != e_current_requirement:
				db.child('programs').child(program).child('extensions').child(e).child('page-state').set(e_current_requirement)
				emailHelper(e, e_stored_requirement, e_current_requirement)

def emailHelper(program, stored_requirement, current_requirement):
	l1 = stored_requirement.split(' ')
	l2 = current_requirement.split(' ')
	d = list(Differ().compare(l1, l2))
	diff = " ".join(['<b>'+i[2:]+'</b>' if i[:1] == '+' else i[2:] for i in d if not i[:1] in '-?'])

	sg = sendgrid.SendGridAPIClient(apikey=os.environ.get('SEND_GRID_API_KEY'))
	from_email = Email("opensourcefruittart@mit.edu")
	to_email = Email("kellysh@mit.edu")
	subject = program + " Degree Requirement Changed"
	content = Content("text/html", diff)
	mail = Mail(from_email, subject, to_email, content)
	response = sg.client.mail.send.post(request_body=mail.get())

if __name__ == '__main__':
    db = FIREBASE.database()
    programs = list(db.child('programs').shallow().get().val())
    for p in programs:
    	# emailHelper(p, "hello kelly kelly", "hi candy candy")
    	watcher(p)
