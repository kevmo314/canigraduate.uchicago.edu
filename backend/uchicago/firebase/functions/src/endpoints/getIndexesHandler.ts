import * as storage from '@google-cloud/storage';

export default async function getIndexesHandler(req, res, next) {
  if (!req.params.type) {
    next(new Error('Parameter "type" not specified.'));
    return;
  }
  if (!req.params.key) {
    next(new Error('Parameter "key" not specified.'));
    return;
  }
  res.status(200);
  if (req.params.type === 'cardinalities' && req.params.key !== 'cardinality') {
    res.setHeader('Content-Type', 'application/json');
  } else {
    res.setHeader('Content-Type', 'application/octet-stream');
  }
  storage()
    .bucket('uchicago')
    .file(`indexes/${req.params.type}/${req.params.key}`)
    .createReadStream()
    .on('error', next)
    .on('end', () => res.end())
    .pipe(res);
}
