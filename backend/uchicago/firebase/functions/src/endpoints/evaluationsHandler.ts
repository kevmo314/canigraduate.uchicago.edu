import Users from '../firestore/Users';
import getEvaluations from '../transforms/getEvaluations';

export default async function evaluationsHandler(req, res, next) {
  const host = 'https://evaluations.uchicago.edu/';
  if (!req.params.id) {
    next(new Error('Parameter "id" not specified.'));
    return;
  }
  if (!req.username || !req.password) {
    res.set('WWW-Authenticate', 'Basic realm="UChicago CNetID"');
    res.status(401);
    next(new Error('"username" and/or "password" missing in request body.'));
    return;
  }
  return getEvaluations(req.params.id, jar =>
    Users.authenticateShibboleth(req.username, req.password, jar),
  ).then(
    evaluations => {
      res.status(200);
      res.json({ evaluations });
    },
    error => {
      if (error.message === 'Either your username or password is incorrect.') {
        res.status(403);
      }
      next(error);
    },
  );
}
