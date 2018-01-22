from pyspark import SparkConf, SparkContext
from src import timeschedules, coursesearch, Term, Course
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import google.cloud.exceptions


def init():
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(
            credentials.Certificate('service_account_key.json'))
    return firestore.client()


def upload(x):
    key, data = x
    term, dept, course = key
    assert isinstance(term, Term)
    assert isinstance(course, Course)
    assert isinstance(dept, str)
    db = init()
    doc = db.collection('institutions').document('uchicago') \
        .collection('courses').document(course.id) \
        .collection('terms').document(str(term))
    batch = db.batch()
    # Clear all data, including section listings.
    batch.delete(doc)
    # Set the fields.
    batch.set(
        doc, {
            'period': term.period,
            'year': term.year,
            'department': dept.encode('ascii', 'ignore'),
            'course': course.id
        })
    # Then set the sections.
    sections = doc.collection('sections')
    for section_id, section in data.items():
        section_ref = sections.document(section_id)
        batch.set(section_ref, section.to_dict())
    batch.commit()


def main():
    courses = [
        course.id for course in init().collection('institutions') \
            .document('uchicago').collection('courses').get()
    ]
    sc = SparkContext(conf=SparkConf() \
        .setMaster("local[32]") \
        .setAppName("Can I Graduate? - Scraper"))
    sc.setLogLevel("WARN")
    records = sc.union([
        sc.parallelize(list(source.get_terms())[:2]) \
            .repartition(32) \
            .flatMap(lambda x: [(x[0], dept, uri) for dept, uri in source.get_department_urls(x[1])]) \
            .repartition(32) \
            .flatMap(lambda x: [((x[0], x[1], course), data) for course, data in source.parse_department(x[2])]) \
            .reduceByKey(lambda a, b: {**a, **b}) for source in [ timeschedules]])
    records.foreach(upload)
    sc.parallelize(courses) \
        .flatMap(lambda course: [(course, offering.id) for offering in init().collection('institutions').document('uchicago').collection('courses').document(course).collection('terms').get()]) \
        .subtract(records.map(lambda x: (x[0][2], x[0][0]))) \
        .foreach(lambda x: init().collection('institutions').document('uchicago').collection('courses').document(x[0]).collection('terms').document(x[1]).delete())
    sc.stop()


if __name__ == '__main__':
    main()