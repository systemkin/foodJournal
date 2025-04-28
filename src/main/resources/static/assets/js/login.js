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
    throw response;

}
let theme = "TANK";
let x = document.cookie;
if (getCookie("teme") == "NONTANK") changeTheme();
function register() {
    let login = document.getElementById("usernameRegisterLine").value;
    let password = document.getElementById("passwordRegisterLine").value;
        if (password != document.getElementById("passwordRegisterLine2").value) {
            document.getElementById("msg").innerHTML = "Passwords does not match";
            return;
        }
    sendRegisterRequest(login, password).then(() => registerSuccessful(login), (response) => registerFailed(login, response));
}
async function login() {
    let username = document.getElementById("usernameLoginLine").value;
    let password = document.getElementById("passwordLoginLine").value;

    const response = await fetch("/login", {
        method: "POST",
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
    else if (response.status == 400){
        document.getElementById("msg").innerHTML = "Login is too long  (max - 20 characters)";
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
function registerFailed(login, resp) {
    if (resp.status == 409)
        document.getElementById("msg").innerHTML = "User already exists. Try another login";
    else if (resp.status == 400){
           resp.text().then((value) => { document.getElementById("msg").innerHTML = value;
           })
        }
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

async function changeTheme() {
    if (theme == "TANK") {
        var oldlink = document.getElementsByTagName("link").item(0);
        document.cookie = "teme=NONTANK; path=/";
        document.getElementById("themeimg").src = "assets/images/Hank.png";
        var newlink = document.createElement("link");
        newlink.setAttribute("rel", "stylesheet");
        newlink.setAttribute("type", "text/css");
        newlink.setAttribute("href", "/static/assets/css/Berry.css");
        document.getElementsByTagName("head").item(0).appendChild(newlink);
        document.getElementsByTagName("head").item(0).removeChild(oldlink);
        //document.getElementsByTagName("head").item(0).replaceChild(newlink, oldlink);
        theme = "NON TANK";
    } else {
        debugger;
        document.cookie = "teme=TANK; path=/";
        let x = document.cookie;
        var oldlink = document.getElementsByTagName("link").item(0);
        document.getElementById("themeimg").src = "assets/images/Berry.png";

        var newlink = document.createElement("link");
        newlink.setAttribute("rel", "stylesheet");
        newlink.setAttribute("type", "text/css");
        newlink.setAttribute("href", "/static/assets/css/index.css");
        document.getElementsByTagName("head").item(0).appendChild(newlink);
                document.getElementsByTagName("head").item(0).removeChild(oldlink);
        theme = "TANK";
    }
}


function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}


