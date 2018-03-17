import * as storage from '@google-cloud/storage';

export default async function listIndexesHandler(req, res, next) {
  if (!req.params.type) {
    next(new Error('Parameter "type" not specified.'));
    return;
  }
  const prefix = `indexes/${req.params.type}/`;
  storage()
    .bucket('uchicago')
    .getFiles({ prefix })
    .then(results => {
      res.json(results[0].map(file => file.name.replace(prefix, '')));
    })
    .catch(next);
}
