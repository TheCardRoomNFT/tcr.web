const { body, validationResult } = require('express-validator');
var async = require('async');
const fetch = require('isomorphic-fetch');
const addresses = require('../addresses');
var CollabRequest = require('../models/CollabRequest');

// Display mutate create form on GET.
exports.collab_create_get = function(req, res, next) {
    res.render('collab', { title: 'The Card Room | Collab' });
};

// Handle Collab create on POST.
exports.collab_create_post = [
    // Validate and sanitize fields.
    body('token', 'Token required').isLength({min: 1}),
    body('name', 'Name required').trim().isLength({min: 2}).escape(),
    body('email', 'Email required').trim().isLength({min: 6}).escape().isEmail(),
    body('subject', 'Subject required').trim().isLength({min: 2}).escape(),
    body('message', 'Message required').trim().isLength({min: 10}).escape(),
    
    // Process request after validation and sanitization.
    (req, res, next) => {
        const validation_errors = validationResult(req);
        if (!validation_errors.isEmpty()) {
            return res.json({success: false, error: validation_errors});
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

            if (gresponse.action != 'collab') {
                throw 'Invalid captcha action';
            }

            var new_request = new CollabRequest(
                {
                    name: req.body.name,
                    email: req.body.email,
                    subject: req.body.subject,
                    message: req.body.message
                }
            );
    
            return new_request.save();            
        }).then(result => {
            if (!result) {
                throw 'Failed to save request';
            }

            return res.json({success: true, error: {errors: [{msg: 'Success'}]}});
        }).catch(error => {
            return res.json({success: false, error: {errors: [{msg: error}]}});
        });
    }
];

// 45459