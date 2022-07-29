const { body, validationResult } = require('express-validator');
var async = require('async');
const fetch = require('isomorphic-fetch');
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

exports.mutate_create_post = [
    // Validate & Sanitize
    body('token', 'Token required').isLength({min: 1}),
    body('wallet', 'Wallet required').trim().isLength({min: 4}).escape(),
    body('from', 'From required').trim().isLength({min: 20}).escape(),
    body('normie_asset_id', 'Normie asset id required.').trim().isLength({ min: 30 }).escape(),
    body('mutation_asset_id', 'Mutation asset id required.').trim().isLength({ min: 30 }).escape(),

    // Process
    (req, res) => {
        const validation_errors = validationResult(req);
        if (!validation_errors.isEmpty()) {
            return res.json({success: false, address: '', error: validation_errors});
        }

        if (!req.body.normie_asset_id.startsWith('asset')) {
            return res.json({success: false, address: '', error: 'invalid asset id'});
        }

        if (!req.body.mutation_asset_id.startsWith('asset')) {
            return res.json({success: false, address: '', error: 'invalid asset id'});
        }

        if (!req.body.from.startsWith('addr')) {
            return res.json({success: false, address: '', error: 'invalid address'});
        }

        const secret_key = addresses.recaptcha;
        const token = req.body.token;
        const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${token}`;

        fetch(url, {
            method: 'post'
        }).then(response => {
            return response.json();
        }).then(gresponse => {
            if (!gresponse.success || gresponse.score < 0.88) {
                console.log(gresponse)
                throw 'Failed captcha, reload page';
            }

            if (gresponse.action != 'mutate') {
                throw 'Invalid captcha action';
            }

            var cooldown_date = new Date();
            cooldown_date.setDate(cooldown_date.getDate() - 45);
            return MutateRequest.find({mutation_asset_id: req.body.mutation_asset_id, date: {"$gte": cooldown_date}});
        }).then(docs => {
            if (docs.length >= 1) {
                throw 'Mutation already requested.  Wait for 45 day cooldown to finish. Last requested: ' + docs[0].date;
            } else {
                var new_request = new MutateRequest({
                    normie_asset_id: req.body.normie_asset_id,
                    mutation_asset_id: req.body.mutation_asset_id,
                    from: req.body.from,
                    processed: false
                });
                return new_request.save();
            }
        }).then(result => {
            if (!result) {
                return res.json({success: false, error: 'Failed to save request'})
            }

            return res.json({success: true, address: addresses.mutation_mint, error: null})
        }).catch(error => {
            return res.json({success: false, address: '', error: error});
        });
    }
];
