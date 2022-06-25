
function show_result(response) {
    console.log('response = ')
    console.log(response)
    success_para = document.getElementById('success-response-message');
    error_para = document.getElementById('error-response-message');

    if (response.success) {
        success_para.innerHTML = 'Thank you for your message.  We will respond soon.';
        success_para.style.display = 'block';
        error_para.style.display = 'none';
        document.getElementById('name').value = '';
        document.getElementById('email').value = '';
        document.getElementById('subject').value = '';
        document.getElementById('message').value = '';
    } else {
        error_para.innerHTML = 'Error: ' + response.error.errors[0].msg;
        success_para.style.display = 'none';
        error_para.style.display = 'block';
    }

    // Update it again
    grecaptcha.ready(function() {
        grecaptcha.execute('6Lc5C4AgAAAAAMYR3Q2xYdMERDJlrOHNml7QO3mA', {action: 'collab'}).then(function(token) {
                document.getElementById('grecaptcha-token').value = token;
            });
    });
}

function handle_click() {
    return function() {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value;
        const token = document.getElementById('grecaptcha-token').value;

        var data = {
            name: name,
            email: email,
            subject: subject,
            message: message,
            token: token
        };

        fetch('/collab', {
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
    grecaptcha.execute('6Lc5C4AgAAAAAMYR3Q2xYdMERDJlrOHNml7QO3mA', {action: 'collab'}).then(function(token) {
            document.getElementById('grecaptcha-token').value = token;
            document.getElementById('submit-button').addEventListener('click', handle_click());
        });
});

// Update it every 90 seconds since it expires after 2 minutes
setInterval(function () {
    grecaptcha.ready(function () {
        grecaptcha.execute('6Lc5C4AgAAAAAMYR3Q2xYdMERDJlrOHNml7QO3mA', { action: 'collab' }).then(function (token) {
            document.getElementById('grecaptcha-token').value = token;
            console.log('updated token');
        });
    });
}, 90 * 1000);
