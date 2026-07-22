function validate() {
	var loginBox = document.getElementById("loginBox");
	var username = document.getElementById("username");
	var password = document.getElementById("password");

	var httpRequest = new XMLHttpRequest();

	httpRequest.open('POST', '/auth', true);
	httpRequest.setRequestHeader('Content-type', 'application/json');
	httpRequest.responseType = "json";

	httpRequest.onreadystatechange = function() {
		if(httpRequest.readyState == 4) {
			if(httpRequest.status == 200 && httpRequest.response.success) {
				localStorage.setItem("loginToken", httpRequest.response.token);
				window.open('/user','_self');
			} else {
				var msg = "Wrong username or password!";
				if(httpRequest.response && httpRequest.response.message) {
					msg = httpRequest.response.message;
				}
				showBottomAlert(msg);
			}
		}
	};

	httpRequest.send(
		JSON.stringify({
			username: username.value,
			password: password.value
		})
	);
}

function showBottomAlert(msg) {
	document.getElementById('bottomAlertMsg').innerText = msg;
	$('#bottomAlert').show();
}

function hideAlert (event) {
    $(".alert").hide();
}

document.body.addEventListener('click', hideAlert);
