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
        console.error(name + ' not installed');
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
    if (wallet !== null) {
        var enabled = await isEnabled(enabled_wallet);
        if (enabled) {
            connect_to_wallet(button, enabled_wallet);
        }
    }
}

function set_progress(value) {
    var progress = document.getElementById('request-progress')
    if (progress !== null) {
        console.log('progress: ' + value + '%')
        progress.ariaValueNow = value;
        progress.style.width = '' + value + '%';
    }
}

const fromHex = (hex) => Buffer.from(hex, "hex");
const toHex = (bytes) => Buffer.from(bytes).toString("hex");

window.send_payment = async function send_payment(address, amount) {
    var enabled_wallet = window.localStorage.getItem('tcr-enabled-wallet');
    if (!enabled_wallet) {
        return null;
    }

    var wallet_obj = getWallet(enabled_wallet);
    if (!wallet_obj) {
        return null;
    }

    if (!wallet_obj.isEnabled()) {
        return null;
    }

    var wallet = await wallet_obj.enable();

    if (wallet.getNetworkId === undefined) {
        console.error("You did not connect your wallet!");
        return null;
    }

    const mainnet = 1
    const wallet_network = await wallet.getNetworkId();
    if (wallet_network !== mainnet) {
        console.error("Your wallet's network mode does not match the page network mode!", wallet_network, network_mode);
        return null;
    }

    // TODO: Update this dynamically at run-time from Koios (https://api.koios.rest/#get-/epoch_params)
    const protocolParameters = {
        linearFee: {
            minFeeA: "44",
            minFeeB: "155381",
        },
        minUtxo: "1000000",
        poolDeposit: "500000000",
        keyDeposit: "2000000",
        maxValSize: "5000",
        maxTxSize: 16384,
        costPerWord: "34482"
    };

    const CSL = await get_cardano_serialization_lib();
    set_progress(10);
    var tca = await wallet.getChangeAddress();
    set_progress(15);
    var tca_buffer = Buffer.from(tca, "hex");
    var tca_u8array = Uint8Array.from(tca_buffer);
    const change_addr = CSL.Address.from_bytes(tca_u8array);

    const txBuilder = CSL.TransactionBuilder.new(
        CSL.TransactionBuilderConfigBuilder.new()
            .fee_algo(
                CSL.LinearFee.new(
                    CSL.BigNum.from_str(protocolParameters.linearFee.minFeeA),
                    CSL.BigNum.from_str(protocolParameters.linearFee.minFeeB)
                )
            )
            .pool_deposit(CSL.BigNum.from_str(protocolParameters.poolDeposit))
            .key_deposit(CSL.BigNum.from_str(protocolParameters.keyDeposit))
            .coins_per_utxo_word(CSL.BigNum.from_str(protocolParameters.costPerWord))
            .max_value_size(protocolParameters.maxValSize)
            .max_tx_size(protocolParameters.maxTxSize)
            .build()
    );

    set_progress(20);
    const payment_addr = CSL.Address.from_bech32(address);
    let paymentAmt = amount;

    txBuilder.add_output(
        CSL.TransactionOutputBuilder.new().with_address(payment_addr).next().with_coin(CSL.BigNum.from_str(paymentAmt.toString())).build()
    );

    const inputs = CSL.TransactionUnspentOutputs.new();

    (await wallet.getUtxos()).map((utxo) => inputs.add(CSL.TransactionUnspentOutput.from_bytes(fromHex(utxo))));
    set_progress(50);
    try {
        txBuilder.add_inputs_from(inputs, CSL.CoinSelectionStrategyCIP2.LargestFirstMultiAsset);
    } catch (err) {
        alert("Sorry, we were not able to build a successful transaction at this time. This may be due to your wallet lacking the necessary asset(s) or token fragmentation.");
        return null;
    }

    try {
        txBuilder.add_change_if_needed(change_addr);
    } catch (err) {
        txBuilder.add_output(
            CSL.TransactionOutputBuilder.new().with_address(change_addr).next().with_coin(CSL.BigNum.from_str('1000000')).build()
        );
        txBuilder.add_inputs_from(inputs, CSL.CoinSelectionStrategyCIP2.LargestFirstMultiAsset);
        try {
            txBuilder.add_change_if_needed(change_addr);
        } catch (err) {
            alert("Sorry, we were not able to build a successful transaction at this time.");
            return null;
        }
    }

    set_progress(70);
    const transactionWitnessSet = CSL.TransactionWitnessSet.new();
    const txBody = txBuilder.build();
    const tx = CSL.Transaction.new(
        txBody,
        CSL.TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
    );

    try {
        set_progress(80);
        const txVkeyWitnesses = await wallet.signTx(toHex(tx.to_bytes()), true);
        const witnesses = CSL.TransactionWitnessSet.from_bytes(fromHex(txVkeyWitnesses));
        transactionWitnessSet.set_vkeys(witnesses.vkeys());

        const signedTx = CSL.Transaction.new(
            tx.body(),
            transactionWitnessSet
        )

        try {
            set_progress(90);
            const txData = await wallet.submitTx(toHex(signedTx.to_bytes()));
            return `${txData}`;
        } catch (err) {
            return null;
        }
    } catch (err) {
        console.log('Cancelled? ', err);
        return null;
    }
}
