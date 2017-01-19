# canigraduate.uchicago.edu

This directory contains backends for various schools. Each school should surface a web application that provides a `/transcript/` endpoint, accepting
a username and password as parameters. No centralized framework is provided, as each school runs on an independent backend anyways. See `uchicago` for
an implementation example.

## Course data

Course info and scheduling data is stored in a CouchDb database. The first key in the database is the school's identifier, which should match that
supplied in the frontend institution configuration file.