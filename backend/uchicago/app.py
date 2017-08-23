import json
import requests
import sqlite3
import urllib

import flask
import flask_cors

app = flask.Flask(__name__)

CLOUD_FUNCTIONS = 'https://us-central1-canigraduate-43286.cloudfunctions.net'
FIREBASE = 'https://canigraduate-43286.firebaseio.com'

def get_course_info():
    return requests.get(FIREBASE + '/course-info.json').json()

def get_schedules(course):
    return requests.get(FIREBASE + '/schedules/' + course + '.json').json()

def get_indexes():
    return requests.get(FIREBASE + '/indexes.json').json()

@app.route('/api/transcript', methods=['GET'])
@flask_cors.cross_origin()
def transcript():
    resp = requests.get(
        CLOUD_FUNCTIONS + '/api/transcript',
        headers={
            'Authorization': flask.request.headers.get('Authorization')
        })
    excluded_headers = [
        'content-encoding', 'content-length', 'transfer-encoding', 'connection'
    ]
    headers = [(name, value) for (name, value) in resp.raw.headers.items()
               if name.lower() not in excluded_headers]
    return flask.Response(resp.content, resp.status_code, headers)


@app.route('/api/course-info/<course>')
@flask_cors.cross_origin()
def course_info(course):
    content = requests.get(FIREBASE + '/course-info/' + course + '.json').content
    if content == 'null':
        return flask.jsonify({'error': 'Course not found.'}, 404)
    return flask.Response(content, content_type='application/json')


@app.route('/api/schedules', methods=['GET'])
@flask_cors.cross_origin()
def schedules():
    department = flask.request.args.get('department')
    course = flask.request.args.get('course')
    period = flask.request.args.get("period")
    year = flask.request.args.get('year')

    if not department and not course and not period and not year:
        return flask.jsonify({
            'error':
            'At least one query parameter of "department", ' +
            '"course", "period", or "year" must be specified'
        }, 400)

    conn = sqlite3.connect('cache.db')
    cursor = conn.cursor()

    condition = []
    params = []
    if department:
        condition.append('department=?')
        params.append(department)
    if course:
        condition.append('course=?')
        params.append(course)
    if period:
        condition.append('period=?')
        params.append(period)
    if year:
        condition.append('year=?')
        try:
            params.append(int(year))
        except ValueError:
            return flask.jsonify({'error': 'Dude wtf kind of year is "%s" it\'s not even an integer.' % year}, 400)

    def generate():
        yield '{"results":['
        for index, row in enumerate(cursor.execute('SELECT record FROM courses WHERE {c}'.format(c=' AND '.join(condition)), params)):
            if index > 0:
                yield ','
            yield row[0]
        yield ']}'

    return flask.Response(generate(), content_type='application/json')


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
