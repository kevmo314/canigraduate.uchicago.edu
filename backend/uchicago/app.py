import json
import requests
import urllib

import flask
import flask_cors

app = flask.Flask(__name__)

CLOUD_FUNCTIONS = 'https://us-central1-canigraduate-43286.cloudfunctions.net'
FIREBASE = 'https://canigraduate-43286.firebaseio.com'


@app.route('/api/transcript', methods=['GET'])
@flask_cors.cross_origin()
def transcript():
    resp = requests.get(
        url=CLOUD_FUNCTIONS + '/api/transcript',
        headers={
            key: value
            for (key, value) in flask.request.headers if key != 'Host'
        },
        data=flask.request.get_data(),
        cookies=flask.request.cookies,
        allow_redirects=False)

    excluded_headers = [
        'content-encoding', 'content-length', 'transfer-encoding', 'connection'
    ]
    headers = [(name, value) for (name, value) in resp.raw.headers.items()
               if name.lower() not in excluded_headers]
    return flask.Response(resp.content, resp.status_code, headers)


@app.route('/api/course-info/<course>')
@flask_cors.cross_origin()
def course_info(course):
    return flask.Response(
        requests.get('%s/course-info/%s.json' % (FIREBASE, course)).content,
        content_type='application/json')


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

    if department:
        candidates = requests.get('%s/indexes/department/%s.json' %
                                  (FIREBASE, department)).json()
    else:
        candidates = requests.get(FIREBASE + '/indexes/all.json').json()
    if course and candidates:
        candidates &= [course]
    if period and candidates:
        candidates &= requests.get('%s/indexes/period/%s.json' %
                                   (FIREBASE, period)).json()
    if year and candidates:
        candidates &= requests.get('%s/indexes/year/%s.json' % (FIREBASE,
                                                                year)).json()
    if not candidates:
        return flask.jsonify({'results': []}, 200)

    def transform(a):
        return dict([(i, j) for i, j in enumerate(a) if j is not None])

    def generate():
        count = 0
        yield '{"response": ['
        for candidate in candidates:
            # We could optimize here, however the paylods are so small it doesn't matter.
            data = requests.get('%s/schedules/%s.json' % (FIREBASE,
                                                          candidate)).json()
            if isinstance(data, list):
                data = transform(data)
            for candidate_period, value in data.items():
                if period and candidate_period != period:
                    continue
                for candidate_year, sections in value.items():
                    if year and candidate_year != year:
                        continue
                    for section_id, section in sections.items():
                        section['section'] = section_id
                        section['course'] = candidate
                        section['year'] = year
                        section['period'] = period
                        if count > 0:
                            yield ','
                        yield json.dumps(section)
        yield ']}'

    return flask.Response(generate(), content_type='application/json')


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
