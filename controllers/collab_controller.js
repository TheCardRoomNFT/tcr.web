const { body, validationResult } = require('express-validator');

var CollabRequest = require('../models/CollabRequest');

//var async = require('async');

// Display mutate create form on GET.
exports.collab_create_get = function(req, res, next) {
    res.render('collab', { title: 'The Card Room | Collab' });
};

// Handle Author create on POST.
exports.collab_create_post = [
    // Validate and sanitize fields.
    body('name', 'Name required').trim().isLength({min: 1}).escape(),
    body('email', 'Email required').trim().isLength({min: 1}).escape(),
    body('subject', 'Subject required').trim().isLength({min: 1}).escape(),
    body('message', 'Message required').trim().isLength({min: 1}).escape(),
    
    // Process request after validation and sanitization.
    (req, res, next) => {
        const errors = validationResult(req);
        var new_request = new CollabRequest(
            {
                name: req.body.name,
                email: req.body.email,
                subject: req.body.subject,
                message: req.body.message
            }
        );

        if (!errors.isEmpty()) {
            res.render('collab', { title: 'The Card Room | Collab', errors: errors.array() });
            return;
        }

        new_request.save(function (err) {
            if (err) {
                return next(err);
            }

            res.redirect('/collab');
        })
    }
];
