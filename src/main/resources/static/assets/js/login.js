async function sendRegisterRequest(login, password) {
    const response = await fetch("/accounts", {
        method: "POST",
        headers: {
                'Content-Type': 'application/json'
            },
        body: JSON.stringify({
            login: login,
            pass: password
        })
    });
    if (response.status === 200)
        return;
    throw response.status;

}
function register() {
    let login = document.getElementById("usernameRegisterLine").value;
    let password = document.getElementById("passwordRegisterLine").value;
    sendRegisterRequest(login, password).then(() => registerSuccessful(login), (status) => registerFailed(login, status));
}
async function login() {
    let username = document.getElementById("usernameLoginLine").value;
    let password = document.getElementById("passwordLoginLine").value;
    const response = await fetch("/login", {
        method: "POST",
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            login: username,
            pass: password})
    })
    if (response.status === 200) {
        window.location.href = "/static/index.html";
    } else if (response.status == 401)
                   document.getElementById("msg").innerHTML = "Wrong login and/or a password";
    else {
        document.getElementById("messagesWindow").innerHTML = response.status;
    }
}
async function logoff() {
    const response = await fetch("/login", {
        method: "DELETE",
    })
    if (response.status === 200) {
        document.getElementById("msg").innerHTML = response.status;
    }
    else {
        document.getElementById("msg").innerHTML = response.status;
    }
}


async function registerSuccessful(login) {
    const response = await fetch("/login", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            login: login,
            pass: document.getElementById("passwordRegisterLine").value})
    })
    if (response.status === 200) {
        window.location.href = "/static/index.html";
    } else if (response.status == 401)
                   document.getElementById("msg").innerHTML = "Wrong login and/or a password";
    window.location.href = "/static/index.html";
}
function registerFailed(login, status) {
    if (status == 409)
        document.getElementById("msg").innerHTML = "User already exists. Try another login";
}
async function checkAuth() {
    const response = await fetch("/auth", {
        method: "GET",
    })
    if (response.redirected)
        return;
    else if (response.status === 200) {
        window.location.href = "/static/index.html";
    }
}
checkAuth();