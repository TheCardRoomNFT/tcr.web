
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const addresses = require('../addresses');

var MutateRequestSchema = new Schema({
    date: {type: Date, default: Date.now()},
    normie_asset_id: {type: String, required: true},
    mutation_asset_id: {type: String, required: true},
    from: {type: String, required: true, maxLength: 128},
    processed: {type: Boolean, required: true}
});

module.exports = mongoose.model(addresses.mutate_request_collection, MutateRequestSchema);
