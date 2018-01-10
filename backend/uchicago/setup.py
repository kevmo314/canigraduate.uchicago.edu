from setuptools import setup, find_packages

setup(
    name="canigraduate_backend_uchicago",
    version="1.0",
    packages=find_packages(),
    entry_points={
        'console_scripts': [
            'canigraduate_backend_uchicago = canigraduate_backend_uchicago.__main__:main'
        ]
    })
