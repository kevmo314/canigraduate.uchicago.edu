from pyspark import SparkConf, SparkContext
from src import timeschedules
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

firebase_admin.initialize_app(
    credentials.Certificate('service_account_key.json'))

db = firestore.client()

sc = SparkContext("local", "My App")
timeschedules = sc.parallelize(timeschedules.get_terms()) \
    .flatMapValues(timeschedules.get_department_urls) \
    .flatMapValues(timeschedules.parse_department) \
    .collect()
sc.stop()