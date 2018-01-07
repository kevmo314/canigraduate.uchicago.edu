from pyspark import SparkConf, SparkContext
from src import timeschedules, Term, Course
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore


def upload(x):
    term, dept, course, data = x
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(
            credentials.Certificate('service_account_key.json'))
    db = firestore.client()
    offerings = db.collection('institutions').document('uchicago').collection(
        'offerings')

    assert isinstance(term, Term)
    assert isinstance(course, Course)
    doc_id = '%s-%d-%s' % (term.period, term.year, course)
    batch = db.batch()
    doc = offerings.document(doc_id)
    # Clear all data, including section listings.
    batch.delete(doc)
    # Set the fields.
    batch.set(doc, {
        'period': term.period,
        'year': term.year,
        'department': dept,
        'course': course.id
    })
    # Then set the sections.
    sections = doc.collection('sections')
    for section_id, section in data.items():
        section_ref = sections.document(section_id)
        batch.set(section_ref, section.to_dict())
    batch.commit()


sc = SparkContext("local", "My App")
timeschedules = sc.parallelize(timeschedules.get_terms()) \
    .flatMap(lambda x: [(x[0], dept, uri) for dept, uri in timeschedules.get_department_urls(x[1])]) \
    .flatMap(lambda x: [(x[0], x[1], course, data) for course, data in timeschedules.parse_department(x[2])]) \
    .foreach(upload)
sc.stop()