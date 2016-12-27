import bs4
import flask
import flask_cors
import requests
from lib import TranscriptParser

app = flask.Flask(__name__)

@app.route('/api/transcript', methods=['POST'])
@flask_cors.cross_origin()
def transcript():
    parser = TranscriptParser(
                username=flask.request.form.get('username', flask.request.json['username']),
                password=flask.request.form.get('password', flask.request.json['password']))
    transcript = [record.serialize() for record in parser.execute()]
    return flask.jsonify(**{'transcript': transcript})        

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
