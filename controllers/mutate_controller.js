const { body, validationResult } = require('express-validator');

var async = require('async');
var MutateRequest = require('../models/MutateRequest');
const addresses = require('../addresses');

//
exports.requests_create_get = function(req, res, next) {
    async.parallel({
        mutate_requests: function(callback) {
          MutateRequest.find()
          .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); } // Error in API usage.
        // Successful, so render.
        res.render('requests', { requests: results.mutate_requests } );
    });
};

// Display mutate create form on GET.
exports.mutate_create_get = function(req, res, next) {
    async.parallel({
        requests_count: function(callback) {
            // Pass an empty object as match condition to find all documents of this collection
            MutateRequest.countDocuments({}, callback);
        }
    }, function(err, results) {
        res.render('mutate', { 
            title: 'The Card Room | Mutate', 
            data: {requests_count: results.requests_count, mint_address: addresses.mutation_mint} 
        });
    });
};

// Handle create on POST.
exports.mutate_create_post = [
    // Validate and sanitize fields.
    body('from', 'From required').trim().isLength({min: 1}).escape(),
    body('normie_asset_id', 'Normie asset id required.').trim().isLength({ min: 1 }).escape(),
    body('mutation_asset_id', 'Mutation asset id required.').trim().isLength({ min: 1 }).escape(),
    
    // Process request after validation and sanitization.
    (req, res, next) => {
        const errors = validationResult(req);
        console.log('from: ' + req.body.from);

        if (!errors.isEmpty()) {
            res.render('mutate', { title: 'The Card Room | Mutate Validate Error', error: errors.array(), data: {requests_count: 0} });
            return;
        }
        
        MutateRequest.find({mutation_asset_id: req.body.mutation_asset_id}).then(docs => {
            if (docs.length >= 1) {
                console.log('docs.length > 1');
                throw 'Mutation already requested';
            } else {
                var new_request = new MutateRequest({
                    normie_asset_id: req.body.normie_asset_id,
                    mutation_asset_id: req.body.mutation_asset_id,
                    from: req.body.from
                });
                return new_request.save();
            }
        }).then(result => {
            console.log('Success');
            res.render('mutate', { 
                title: 'The Card Room | Mutate Received', 
                success: 'Request received', 
                data: {requests_count: 0, mint_address: addresses.mutation_mint}
            });
        }).catch( error_msg => {
            console.log('Error');
            console.error(error_msg);
            res.render('mutate', { 
                title: 'The Card Room | Mutate Error', 
                error: error_msg, 
                data: {requests_count: 0, mint_address: addresses.mutation_mint} 
            });
        });
    }
];
