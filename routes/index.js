var express = require('express');
var router = express.Router();
var mutate_controller = require('../controllers/mutate_controller');
var collab_controller = require('../controllers/collab_controller');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'The Card Room' });
});

/* GET about page. */
router.get('/about', function(req, res, next) {
  res.render('about', { title: 'The Card Room | About' });
});

/* GET nft/kingcharles page. */
router.get('/nft/kingcharles', function(req, res, next) {
  res.render('kingcharles', { title: 'The Card Room | King Charles' });
});

/* GET nft/kingcharles/charlesi page. */
router.get('/nft/kingcharles/charlesi', function(req, res, next) {
  res.render('charlesi', { title: 'The Card Room | King Charles I' });
});

/* GET nft/kingcharles/charlesi page. */
router.get('/nft/kingcharles/hula', function(req, res, next) {
  res.render('hula', { title: 'The Card Room | Hula Hosky' });
});

/* GET nft/kingcharles/rats page. */
router.get('/nft/kingcharles/rats', function(req, res, next) {
  res.render('rats', { title: 'The Card Room | King of Rats' });
});

/* GET nft/kingcharles/emperor page. */
router.get('/nft/kingcharles/emperor', function(req, res, next) {
  res.render('emperor', { title: 'The Card Room | Emperor Charles' });
});

/* GET nft/mutation page. */
router.get('/nft/mutation', function(req, res, next) {
  res.render('mutation', { title: 'The Card Room | Mutation' });
});

/* GET nft/mutants page. */
router.get('/nft/mutants', function(req, res, next) {
  res.render('mutants', { title: 'The Card Room | Mutants' });
});

/* GET mutate page. */
router.get('/mutate', mutate_controller.mutate_create_get);

/* POST mutate request page. */
router.post('/mutate', mutate_controller.mutate_create_post);

/* GET mutate_faq page. */
router.get('/mutate_faq', function(req, res, next) {
  res.render('mutate_faq', { title: 'The Card Room | Mutate FAQ' });
});


/* GET mint page. */
router.get('/mint', function(req, res, next) {
  res.render('mint', { title: 'The Card Room | Mint' });
});

/* GET community page. */
router.get('/community', function(req, res, next) {
  res.render('community', { title: 'The Card Room | Community' });
});

/* GET collab page. */
router.get('/collab', collab_controller.collab_create_get);

/* POST collab request page. */
router.post('/collab', collab_controller.collab_create_post);

/* GET terms page. */
router.get('/terms', function(req, res, next) {
  res.render('terms', { title: 'The Card Room | Terms' });
});

/* GET requests page. */
// not needed anymore.  handled by the node software
// router.get('/requests', mutate_controller.requests_create_get);

module.exports = router;
