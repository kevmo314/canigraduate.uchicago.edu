from pyspark import SparkConf, SparkContext
from src import timeschedules, coursesearch, Term, Course
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore


def doc_id(x):
    key, data = x
    term, dept, course = key
    assert isinstance(term, Term)
    assert isinstance(course, Course)
    doc_id = '%s-%d-%s' % (term.period, term.year, course)


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
    db = init()
    offerings = db.collection('institutions').document('uchicago').collection(
        'offerings')
    batch = db.batch()
    doc = offerings.document(doc_id(x))
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


def main():
    sc = SparkContext("local", "Can I Graduate? - Scraper")
    records = sc.union([
        sc.parallelize(source.get_terms()) \
            .repartition(250) \
            .flatMap(lambda x: [(x[0], dept, uri) for dept, uri in source.get_department_urls(x[1])]) \
            .repartition(1000) \
            .flatMap(lambda x: [((x[0], x[1], course), data) for course, data in source.parse_department(x[2])]) \
            .reduceByKey(lambda a, b: {**a, **b}) for source in [coursesearch, timeschedules]])
    records.foreach(upload)
    sc.parallelize([offering.id for offering in init().collection('institutions') \
            .document('uchicago').collection('offerings')]) \
        .subtract(records.map(doc_id)) \
        .foreach(lambda key: init().collection('institutions').document('uchicago') \
            .collection('offerings').document(key).delete())
    sc.stop()


if __name__ == '__main__':
    main()