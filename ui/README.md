# canigraduate.uchicago.edu Frontend

Frontend runs on an [Angular 2](http://angular.io/) stack.

## Development server

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## New institutions

Every institution is represented as a separate runtime environment. It is not possible to run multiple institutions off the same server by design.
To add a new institution, create the appropriate environment configuration file under `environments` and create a new institution under `institutions`
that satisfies the `Base` institution interface. See the requirements in the parent directory under `Data specifications` for more details.