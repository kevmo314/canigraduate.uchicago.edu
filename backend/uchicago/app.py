import bs4
import cloudant
import config
import flask
import flask_cors
import json
import requests
from lib import TranscriptParser

app = flask.Flask(__name__)

def get_view_result(db, name, map_function, reduce_function=None):
    with cloudant.design_document.DesignDocument(db, '_design/canigraduate') as ddoc:
        view = ddoc.get_view(name)
        if view is None:
            ddoc.add_view(name, map_function, reduce_function)
        elif view.map != map_function or view.reduce != reduce_function:
            ddoc.update_view(name, map_function, reduce_function)
    return db.get_view_result('_design/canigraduate', name)


@app.route('/api/transcript', methods=['POST'])
@flask_cors.cross_origin()
def transcript():
    parser = TranscriptParser(
                username=flask.request.form.get('username', flask.request.json['username']),
                password=flask.request.form.get('password', flask.request.json['password']))
    transcript = [record.serialize() for record in parser.execute()]
    return flask.jsonify(**{'transcript': transcript})        

@app.route('/programs', methods=['POST', 'GET'])
def programs():
    client = cloudant.client.Cloudant(**config.CLOUDANT)
    client.connect()
    db = client['uchicago']
    if flask.request.method == 'POST':
        for record in json.loads(flask.request.form.get('data')):
            if '_rev' in record:
                del record['_rev']
            with cloudant.document.Document(db, record.get('_id')) as doc:
                doc.update(record)
    result = [x['key'] for x in get_view_result(db, 'program', 'function(d) { if (d.type == "program") { emit(d); } }')[:]]
    client.disconnect()
    return flask.render_template('programs.html', result=json.dumps(result, indent=2))

@app.route('/sequences', methods=['POST', 'GET'])
def sequences():
    client = cloudant.client.Cloudant(**config.CLOUDANT)
    client.connect()
    db = client['uchicago']
    if flask.request.method == 'POST':
        for record in json.loads(flask.request.form.get('data')):
            if '_rev' in record:
                del record['_rev']
            with cloudant.document.Document(db, record.get('_id')) as doc:
                doc.update(record)
    result = [x['key'] for x in get_view_result(db, 'sequence', 'function(d) { if (d.type == "sequence") { emit(d); } }')[:]]
    client.disconnect()
    return flask.render_template('sequences.html', result=json.dumps(result, indent=2))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
