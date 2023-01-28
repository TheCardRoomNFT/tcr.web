
const TIMEOUT_ERROR = Symbol();
const timeout = (prom, seconds) => {
	let timer;
	return Promise.race([
		prom,
		new Promise((_r, rej) => timer = setTimeout(rej, seconds*1000, TIMEOUT_ERROR))
	]).finally(() => clearTimeout(timer));
}

async function show_result(response) {
    success_para = document.getElementById('success-response-message');
    error_para = document.getElementById('error-response-message');
    var progress = document.getElementById('request-progress')

    if (response.success) {
        try {
            const txid = await timeout(send_payment(response.address, 12000000), 300);
            if (txid === null) {
                success_para.innerHTML = 'Request Received, payment failed.  Please send 12 ADA to: ' + response.address + ' to complete the request.';
                success_para.style.display = 'block';
                error_para.style.display = 'none';

                progress.ariaValueNow = 100;
                progress.style.width = '100%';
                progress.classList.add('bg-warning');
                progress.classList.remove('bg-success');
            } else {
                success_para.innerHTML = 'Success!  Your mutant will arrive within 1 to 3 days.  TXID = ' + txid;
                success_para.style.display = 'block';
                error_para.style.display = 'none';

                progress.ariaValueNow = 100;
                progress.style.width = '100%';
            }
        } catch (e) {
            if (e === TIMEOUT_ERROR) {
                success_para.innerHTML = 'Request Received, payment timeout.  Please send 12 ADA to: ' + response.address + ' to complete the request.';
                success_para.style.display = 'block';
                error_para.style.display = 'none';

                progress.ariaValueNow = 100;
                progress.style.width = '100%';
                progress.classList.add('bg-warning');
                progress.classList.remove('bg-success');
            }
        }
    } else {
        error_para.innerHTML = 'Error: ' + response.error;
        success_para.style.display = 'none';
        error_para.style.display = 'block';

        progress.ariaValueNow = 100;
        progress.style.width = '100%';
        progress.classList.add('bg-danger');
        progress.classList.remove('bg-success');
    }

    document.getElementById('submit-button').disabled = false;

    document.getElementById('normie-select').value = '';
    document.getElementById('mutation-select').value = '';
    document.getElementById('algorithm-select').value = '';
    document.getElementById('accept-tc').checked = false;

    // Update it again
    grecaptcha.ready(function() {
        grecaptcha.execute('6Lc5C4AgAAAAAMYR3Q2xYdMERDJlrOHNml7QO3mA', {action: 'mutate'}).then(function(token) {
                document.getElementById('grecaptcha-token').value = token;
            });
    });
}

function handle_click() {
    return function() {
        const normie = document.getElementById('normie-select').value;
        const mutation = document.getElementById('mutation-select').value;
        const algorithm = document.getElementById('algorithm-select').value;
        const from = document.getElementById('from').value;
        const accept = document.getElementById('accept-tc');
        const wallet = document.getElementById('button-wallet-connect').innerText
        const token = document.getElementById('grecaptcha-token').value;

        document.getElementById('submit-button').disabled = true;

        var progress = document.getElementById('request-progress')
        var progress_parent = document.getElementById('request-progress-parent')

        progress.classList.remove('bg-danger');
        progress.classList.remove('bg-warning');
        progress.classList.add('bg-success');

        progress_parent.hidden = false;
        progress.ariaValueNow = 0;
        progress.style.width = '0%';

        var success_para = document.getElementById('success-response-message');
        var error_para = document.getElementById('error-response-message');
        error_para.innerHTML = '';
        success_para.innerHTML = '';

        if (!accept || accept.checked === false) {
            error_para.innerHTML = 'Please accept Terms & Conditions';
            error_para.style.display = 'block';
            document.getElementById('submit-button').disabled = false;
            return;
        }

        if (!wallet || wallet === 'Connect') {
            error_para.innerHTML = 'Error: Wallet not connected';
            error_para.style.display = 'block';
            document.getElementById('submit-button').disabled = false;
            return;
        }

        if (!normie || !normie.startsWith('asset')) {
            error_para = document.getElementById('error-response-message');
            error_para.innerHTML = 'Error: Invalid normie';
            error_para.style.display = 'block';
            document.getElementById('submit-button').disabled = false;
            return;
        }

        if (!mutation || !mutation.startsWith('asset')) {
            error_para.innerHTML = 'Error: Invalid mutation';
            error_para.style.display = 'block';
            document.getElementById('submit-button').disabled = false;
            return;
        }

        if (!algorithm || (algorithm !== 'VQGAN+CLIP' && algorithm !== 'StableDiffusion')) {
            error_para.innerHTML = 'Error: Invalid algorithm';
            error_para.style.display = 'block';
            document.getElementById('submit-button').disabled = false;
            return;
        }

        if (!from || !from.startsWith('addr')) {
            error_para.innerHTML = 'Error: Invalid address';
            error_para.style.display = 'block';
            document.getElementById('submit-button').disabled = false;
            return;
        }

        progress.ariaValueNow = 5;
        progress.style.width = '5%';

        var data = {
            normie_asset_id: normie,
            mutation_asset_id: mutation,
            algorithm: algorithm,
            from: from,
            wallet: wallet,
            accept:accept.checked,
            token: token
        };

        fetch('/mutate', {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(response => {
            return response.json();
        }).then(data => {
            return show_result(data);
        }).then(result => {
            console.log('complete');
        }).catch(error => {
            return show_result({success: false, error: error});
        });
    }
}

// Configure the initial recaptcha token
grecaptcha.ready(function() {
    grecaptcha.execute('6Lc5C4AgAAAAAMYR3Q2xYdMERDJlrOHNml7QO3mA', {action: 'mutate'}).then(function(token) {
            document.getElementById('grecaptcha-token').value = token;
            document.getElementById('submit-button').addEventListener('click', handle_click());
        });
});

// Update it every 90 seconds since it expires after 2 minutes
setInterval(function () {
    grecaptcha.ready(function () {
        grecaptcha.execute('6Lc5C4AgAAAAAMYR3Q2xYdMERDJlrOHNml7QO3mA', { action: 'mutate' }).then(function (token) {
            document.getElementById('grecaptcha-token').value = token;
        });
    });
}, 90 * 1000);
