import flask
import flask_cors
import requests
import urllib

app = flask.Flask(__name__)

@app.route('/api/<path:method>', methods=['POST', 'GET'])
@flask_cors.cross_origin()
def _proxy(*args, **kwargs):
    resp = requests.request(
        method=flask.request.method,
        url='https://us-central1-canigraduate-43286.cloudfunctions.net' + urllib.parse.urlparse(flask.request.url).path,
        headers={key: value for (key, value) in flask.request.headers if key != 'Host'},
        data=flask.request.get_data(),
        cookies=flask.request.cookies,
        allow_redirects=False)

    excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
    headers = [(name, value) for (name, value) in resp.raw.headers.items()
               if name.lower() not in excluded_headers]

    return flask.Response(resp.content, resp.status_code, headers)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
