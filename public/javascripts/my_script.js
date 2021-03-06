// https://github.com/cardano-foundation/CIPs/tree/master/CIP-0030
// https://github.com/Emurgo/cip14-js
// https://github.com/Emurgo/cardano-serialization-lib

import Loader from "./loader";
let Buffer = require('buffer/').Buffer
import AssetFingerprint from '@emurgo/cip14-js';
var normies = require('./normies')

function getWallet(name) {
    if (!window.cardano) {
        return null;
    }

    if (name == 'Nami') {
        return window.cardano.nami;
    } else if (name == 'Eternl') {
        return window.cardano.eternl;
    } else if (name == 'Flint') {
        return window.cardano.flint;
    }

    return null;
}

function isInstalled(name) {
    if (!getWallet(name)) {
        return false;
    }

    return true;
}

async function isEnabled(name) {
    const wallet = getWallet(name);
    return wallet.isEnabled();
}

async function get_cardano_serialization_lib() {
    await Loader.load();
    return Loader.cardano_slib;
};

async function get_network_id(nami_api) {
    let network_id = await nami_api.getNetworkId();
    return {
        id: network_id,
        network: network_id === 1 ? 'mainnet' : 'testnet'
    };
}

async function get_address(nami_api, slib) {
    try {
        const addresses = await nami_api.getUsedAddresses();
        const first_address = addresses[0]
        const address = slib.Address.from_bytes(Buffer.from(first_address, "hex")).to_bech32()
        return address;
    } catch (err) {
        console.log(err)
    }

    return null;
}

async function update_wallet_contents(nami_api, slib) {
    let network_id = await get_network_id(nami_api);
    let balance_cbor = await nami_api.getBalance();
    const balance_lovelace = slib.Value.from_bytes(Buffer.from(balance_cbor, "hex"));

    let mutation_assets = [];
    let normie_assets = [];
    let wallet_address = await get_address(nami_api, slib);

    const raw_utxos = await nami_api.getUtxos();
    for (const raw_utxo of raw_utxos) {
        const utxo = slib.TransactionUnspentOutput.from_bytes(Buffer.from(raw_utxo, 'hex'));
        const input = utxo.input();
        const tx_id = Buffer.from(input.transaction_id().to_bytes(), 'utf8').toString('hex');
        const tx_idx = input.index();
        const output = utxo.output();
        const amount = output.amount().coin().to_str();
        const multiasset = output.amount().multiasset();

        if (multiasset) {
            const keys = multiasset.keys();

            for (let i = 0; i < keys.len(); i++) {
                const policy_id = keys.get(i);
                const policy_id_hex = Buffer.from(policy_id.to_bytes(), 'utf8').toString('hex');
                const assets = multiasset.get(policy_id);
                const asset_names = assets.keys();

                for (let j = 0; j < asset_names.len(); j++) {
                    const asset_name = asset_names.get(j);
                    const asset_name_str = Buffer.from(asset_name.name(), 'utf8').toString();
                    const asset_name_hex = Buffer.from(asset_name.name(), 'utf8').toString('hex');
                    const multiasset_amount = multiasset.get_asset(policy_id, asset_name);

                    // initialize class with policyId, assetName
                    const asset_fingerprint = AssetFingerprint.fromParts(
                        Buffer.from(policy_id_hex, 'hex'),
                        Buffer.from(asset_name_hex, 'hex'),
                    );

                    const fingerprint_bech32 = asset_fingerprint.fingerprint();
                    const asset_object = {
                        tx_id: tx_id,
                        tx_idx: tx_idx,
                        policy_id: policy_id_hex,
                        name: asset_name_str,
                        fingerprint: fingerprint_bech32
                    };

                    if (policy_id_hex === '7135025a3c23035cdcff4ef8ae3849248afd369466ea1abef61a4157') {
                        mutation_assets.push(asset_object);
                    } 

                    // mutations can also be mutated
                    if (policy_id_hex in normies.whitelist) {
                        normie_assets.push(asset_object);
                    }
                }
            }
        }
    }

    return {
        mutations: mutation_assets,
        normies: normie_assets,
        address: wallet_address
    };
}

function remove_all_options(element) {
    let count = element.options.length - 1;
    for (let i = count; i >= 0; i--) {
        element.remove(i);
    }
}

function add_option(element, name, value) {
    let opt = document.createElement('option');
    opt.value = value;
    opt.text = name;
    element.appendChild(opt);
}

window.connect_to_wallet = async function connect_to_wallet(button, name) {
    if (!isInstalled(name)) {
        console.log(name + ' not installed');
        return false;
    }

    var msel = document.getElementById('mutation-select');
    remove_all_options(msel);
    add_option(msel, 'Select a Mutation', '');

    var nsel = document.getElementById('normie-select');
    remove_all_options(nsel);
    add_option(nsel, 'Select a Normie', '');

    const wallet = getWallet(name);
    const slib = await get_cardano_serialization_lib();
    wallet.enable().then( nami_api => {
        button.innerText = name;
        window.localStorage.setItem('tcr-enabled-wallet', name);
        return update_wallet_contents(nami_api, slib);
    }).then( assets => {
        // Build a list of mutations
        for (const mutation of assets.mutations) {       
            add_option(msel, mutation.name, mutation.fingerprint);
        }

        // Build a list of normies
        for (const normie of assets.normies) {
            add_option(nsel, normie.name, normie.fingerprint);
        }

        let from_field = document.getElementById('from');
        from_field.value = assets.address;

        document.getElementById('submit-button').disabled = false;
    }).catch( error => {
        console.error(error);
        console.error(`Request Denied`);
        button.innerText='Connect';
    });
}

window.check_wallet_connection = async function check_wallet_connection(button) {
    if (!button) {
        return;
    }

    var enabled_wallet = window.localStorage.getItem('tcr-enabled-wallet');
    var wallet = getWallet(enabled_wallet);
    if (wallet != null) {
        var enabled = await isEnabled(enabled_wallet);
        if (enabled) {
            connect_to_wallet(button, enabled_wallet);
        }
    }
}
