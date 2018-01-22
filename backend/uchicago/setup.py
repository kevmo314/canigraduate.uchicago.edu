from setuptools import setup, find_packages

setup(
    name="canigraduate_backend_uchicago",
    version="1.0",
    install_requires=['beautifulsoup4', 'lxml', 'requests', 'firebase-admin'],
    packages=find_packages())
