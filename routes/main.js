var router = require('express').Router();
var Product = require('../models/product');

// map between product database and elasticsearch
Product.createMapping(function(err, mapping) {
  if (err) {
    console.log('error creating mapping', err);
  } else {
    console.log('mapping created', mapping);
  }
});

// synchronize product in elasticsearch replica set
var stream = Product.synchronize();
var count = 0;

// run three different sets of methods
// count documents
stream.on('data', function() {
  count++;
});

// once close synchronize it will count all the documents
stream.on('close', function() {
  console.log('Indexed ' + count + ' documents');
});

// show error if error
stream.on('error', function(err) {
  console.log(err);
});

// search routes
router.post('/search', function(req, res, next) {
  res.redirect('/search?q=' + req.body.q);
});

router.get('/search', function(req, res, next) {
  if (req.query.q) {
    // search value we receive from post
    // search elasticsearch replica set
    Product.search({
      query_string: { query: req.query.q }
    }, function(err, results) {
      // if err give error
      if (err) return next(err);

      // otherwise return results
      var data = results.hits.hits.map(function(hit) {
        return hit;
      });

      // render data
      res.render('main/search-result', {
        query: req.query.q,
        data: data
      });
    });
  }
});

// home route
router.get('/', function(req, res) {
  res.render('main/home');
});

// about page route
router.get('/about', function(req, res) {
  res.render('main/about');
});

// view all products
router.get('/products/:id', function(req, res, next) {
  Product
    .find({ category: req.params.id })
    .populate('category')
    .exec(function(err, products) {
      if (err) return next(err);

      res.render('main/category', { products: products });
    })
});

// view specific product
router.get('/product/:id', function(req, res, next) {
  Product.findById({ _id: req.params.id }, function(err, product) {
    if (err) return next(err);

    res.render('main/product', {
      product: product
    });
  });
});


module.exports = router;