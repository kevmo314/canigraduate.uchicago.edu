import bs4
import flask
import flask_cors
import json
import pyrebase
import requests
import traceback
from lib import TranscriptParser

app = flask.Flask(__name__)
firebase = pyrebase.initialize_app({
    'apiKey': 'AIzaSyCjBDyhwbXcp9kEIA2pMHLDGxmCM4Sn6Eg',
    'authDomain': 'canigraduate-43286.firebaseapp.com',
    'databaseURL': 'https://canigraduate-43286.firebaseio.com',
    'storageBucket': 'canigraduate-43286.appspot.com',
    'serviceAccount': 'service_account_key.json'
})

@app.route('/api/transcript', methods=['POST'])
@flask_cors.cross_origin()
def transcript():
    try:
        parser = TranscriptParser(
                    username=flask.request.form.get('username', flask.request.json['username']),
                    password=flask.request.form.get('password', flask.request.json['password']))
        transcript = [record.serialize() for record in parser.execute()]
        return flask.jsonify(**{'transcript': transcript})
    except ValueError as e:
        return flask.jsonify(**{'error': str(e)}), 403
    except Exception as e:
        return flask.jsonify(**{'error': 'Unknown authentication error occurred.'}), 500

@app.route('/programs', methods=['POST', 'GET'])
def programs():
    db = firebase.database()
    if flask.request.method == 'POST':
        db.child('programs').set(json.loads(flask.request.form.get('data')))
    return flask.render_template('programs.html', result=json.dumps(db.child('programs').get().val(), indent=2))

@app.route('/sequences', methods=['POST', 'GET'])
def sequences():
    db = firebase.database()
    if flask.request.method == 'POST':
        db.child('sequences').set(json.loads(flask.request.form.get('data')))
    return flask.render_template('sequences.html', result=json.dumps(db.child('sequences').get().val(), indent=2))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
