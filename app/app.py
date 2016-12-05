import bs4
import flask
import requests
app = flask.Flask(__name__)

@app.route('/transcript')
def transcript():
    return 'Hello World!'

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
