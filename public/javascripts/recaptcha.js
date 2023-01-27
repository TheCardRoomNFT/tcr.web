
function show_result(response) {
    success_para = document.getElementById('success-response-message');
    error_para = document.getElementById('error-response-message');

    if (response.success) {
        success_para.innerHTML = 'Request Received.  Please send 12 ADA to: ' + response.address;
        success_para.style.display = 'block';
        error_para.style.display = 'none';
    } else {
        error_para.innerHTML = 'Error: ' + response.error;
        success_para.style.display = 'none';
        error_para.style.display = 'block';
    }

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

        if (!accept || accept.checked === false) {
            error_para = document.getElementById('error-response-message');
            error_para.innerHTML = 'Please accept Terms & Conditions';
            error_para.style.display = 'block';
            return;
        }

        if (!wallet || wallet === 'Connect') {
            error_para = document.getElementById('error-response-message');
            error_para.innerHTML = 'Error: Wallet not connected';
            error_para.style.display = 'block';
            return;
        }

        if (!normie || !normie.startsWith('asset')) {
            error_para = document.getElementById('error-response-message');
            error_para.innerHTML = 'Error: Invalid normie';
            error_para.style.display = 'block';
            return;
        }

        if (!mutation || !mutation.startsWith('asset')) {
            error_para = document.getElementById('error-response-message');
            error_para.innerHTML = 'Error: Invalid mutation';
            error_para.style.display = 'block';
            return;
        }

        if (!algorithm || (algorithm !== 'VQGAN+CLIP' && algorithm !== 'StableDiffusion')) {
            error_para = document.getElementById('error-response-message');
            error_para.innerHTML = 'Error: Invalid algorithm';
            error_para.style.display = 'block';
            return;
        }

        if (!from || !from.startsWith('addr')) {
            error_para = document.getElementById('error-response-message');
            error_para.innerHTML = 'Error: Invalid address';
            error_para.style.display = 'block';
            return;
        }

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
            return show_result(data)
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
