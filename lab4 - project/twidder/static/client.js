var currentLoggedInUsers = 0
var currentTotalUsers = 0
var currentVisitsToMyProfile = 0;
var currentTotalVisitsToProfiles = 0;
var currentMessageCount = 0;
var currentRecentMessagesCount = [];

var attachHandlersWelcomeView = function(){
    
	var login = document.getElementById("loginform");
	
	if (login != null){
		var loginLoginButton = document.getElementById("loginlogin");

		loginLoginButton.addEventListener('click', function(){
			login.setAttribute("onsubmit", "loginForm.login(this);return false;");
		});
	}

	var signup = document.getElementById("signupform");

	if (signup != null){
		var signupSignupButton = document.getElementById("signupsignup");

		signupSignupButton.addEventListener('click', function(){
			signup.setAttribute("onsubmit", "signupForm.signup(this);return false;");
		});
	}
};

var attachHandlersProfileView = function(){
    
    var passwordChange = document.getElementById("changepasswordform");
    
    if (passwordChange != null){
        var changePasswordButton = document.getElementById("changepasswordchangepassword");
        
        changePasswordButton.addEventListener('click', function(){
            passwordChange.setAttribute("onsubmit", "changePasswordForm.changePassword(this);return false;");
        });
    }
};

var ws = null

var loginForm = {
    login: function(formData) {

        var email = formData.email.value;
        var password = formData.password.value;
        var xhttp = new XMLHttpRequest();
        var loginresult = null;
        

        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {

                loginresult = JSON.parse(xhttp.responseText);
                console.log(loginresult.message);
                
                if(loginresult.success) {
                    ws = new WebSocket("ws://tddd97-labs-lordbamse.c9users.io/websocket/" + loginresult.data);
                    ws.onmessage = function (event) {
                        var socket_received = JSON.parse(event.data);
                        console.log(socket_received.message);

                        if (socket_received.messagetype == "forcedLogout") {
                            localStorage.removeItem("logintoken");
                            localStorage.removeItem("currenttab");
                            setCurrentView();
                        } else if (socket_received.messagetype == "dataUpdate_usercount") {
                            currentLoggedInUsers = socket_received.data.current;
                            currentTotalUsers = socket_received.data.total;
                            console.log("Update from server: currentLoggedInUsers = " + currentLoggedInUsers);
                            console.log("Update from server: currentTotalUsers = " + currentTotalUsers);
                            renderLoggedInGraph();
                        } else if (socket_received.messagetype == "dataUpdate_visitcount") {
                            currentVisitsToMyProfile = socket_received.data.user;
                            currentTotalVisitsToProfiles = socket_received.data.total;
                            console.log("Update from server: currentVisitsToMyProfile = " + currentVisitsToMyProfile);
                            console.log("Update from server: currentTotalVisitsToProfiles = " + currentTotalVisitsToProfiles);
                            renderVisitsGraph();
                        } else if (socket_received.messagetype == "dataUpdate_messagecount") {
                            currentMessageCount = socket_received.data.messagecount;
                            currentRecentMessagesCount = socket_received.data.recent;
                            console.log("Update from server: currentMessageCount = " + currentMessageCount);
                            console.log("Update from server: currentRecentMessagesCount = " + currentRecentMessagesCount);
                            renderMessagesGraph();
                        }
                    };
                    
                    window.onbeforeunload = function() {
                        if (ws) {
                            ws.onclose = function () {}; // disable onclose handler first
                            ws.close();    
                        }
                    };

                    localStorage.setItem("logintoken", loginresult.data);
                    setCurrentView();
                } else {
                    formData.password.value = "";
                    document.getElementById("loginerrormsg").innerHTML = loginresult.message;
                }
            }
        };
        xhttp.open("POST", "/sign_in", true);
        xhttp.send(new FormData(formData));
    }
};

var signupForm ={ 
     
    signup: function(formData){
        var password = formData.password.value;
        var repeatpassword = formData.repeatpassword.value;

        if(password != repeatpassword)
        {
            formData.password.value = "";
            formData.repeatpassword.value = "";
            
            document.getElementById("signuperrormsg").innerHTML = "Passwords do not match.";
        } else if (password.length < 8) {
            formData.password.value = "";
            formData.repeatpassword.value = "";
            
            document.getElementById("signuperrormsg").innerHTML = "Password must be at least 8 characters long.";
        } else {
            var xhttp = new XMLHttpRequest();
            var signupresult = null;
        
            xhttp.onreadystatechange = function() {
                if (xhttp.readyState == 4 && xhttp.status == 200) {
                    
                    signupresult = JSON.parse(xhttp.responseText);
                    console.log(signupresult.message);
                    document.getElementById("signuperrormsg").innerHTML = signupresult.message;
                    formData.reset();
                }
            };
            xhttp.open("POST", "/sign_up", true);
            xhttp.send(new FormData(formData));
        }
    }
};

var changePasswordForm = {
    
    changePassword: function(formData){
        var newpassword = formData.newpassword.value;
        var repeatnewpassword = formData.repeatnewpassword.value;
        
        if (newpassword.length < 8) {
            document.getElementById("changepassworderrormsg").innerHTML = "The new password is too short";
        } else if(newpassword != repeatnewpassword){
            document.getElementById("changepassworderrormsg").innerHTML = "Passwords do not match";
        } else {
            var xhttp = new XMLHttpRequest();
            
            xhttp.onreadystatechange = function() {
                if (xhttp.readyState == 4 && xhttp.status == 200) {
                    document.getElementById("changepassworderrormsg").innerHTML = JSON.parse(xhttp.responseText).message;
                }
            };
            xhttp.open("POST", "/change_password", true);
            form = new FormData(formData);
            form.append("token", localStorage.getItem("logintoken"));
            xhttp.send(form);
        }
        formData.oldpassword.value = "";
        formData.newpassword.value = "";
        formData.repeatnewpassword.value = ""; 
    }
};

var init = function(){
    console.log('Initializing page');
    setCurrentView();
};

var setCurrentView = function(){
    if (localStorage.getItem("logintoken") === null) {
        console.log('No logintoken found, showing Welcome view.');
        initWelcomeView();
    } else {
        console.log('Logintoken found, showing Profile view.');
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                var response = JSON.parse(xhttp.responseText);
                if (response.success) {
                    console.log(response.message);
                    initProfileView();
                } else {
                    console.log(response.message);
                    localStorage.removeItem("logintoken");
                    initWelcomeView();
                }
            }
        };
        xhttp.open("POST", "/get_login_status", true);
        form = new FormData();
        form.append("token", localStorage.getItem("logintoken"));
        xhttp.send(form);
    }
};

var initWelcomeView = function(){
    document.getElementById('currentview').innerHTML = document.getElementById('welcomeview').innerHTML;
    attachHandlersWelcomeView();
};

var initProfileView = function(){
    document.getElementById('currentview').innerHTML = document.getElementById('profileview').innerHTML;
    attachHandlersProfileView();
    
    var xhttp = new XMLHttpRequest();
    
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            
            console.log(JSON.parse(xhttp.responseText).message);
            
            var userdata = JSON.parse(xhttp.responseText).data;

            document.getElementById("homeemail").innerHTML=userdata.email;
            document.getElementById("homefirstname").innerHTML=userdata.firstname;
            document.getElementById("homefamilyname").innerHTML=userdata.familyname;
            document.getElementById("homegender").innerHTML=userdata.gender;
            document.getElementById("homecity").innerHTML=userdata.city;
            document.getElementById("homecountry").innerHTML=userdata.country;
            
            homeRefreshWallMessages();
            
            var current_tab = localStorage.getItem("currenttab");
            
            if (current_tab == "home") {
                console.log("Refresh: Loading home");
                displayHometab();
            } else if (current_tab == "browse") {
                displayBrowsetab();
                console.log("Refresh: Loading browse");
            } else if (current_tab == "account"){
                displayAccounttab();
                console.log("Refresh: Loading account");
            }
            
            var xhttp_graph = new XMLHttpRequest();
            xhttp_graph.onreadystatechange = function() {
                if (xhttp_graph.readyState == 4 && xhttp_graph.status == 200) {
                    response = JSON.parse(xhttp_graph.responseText)
                    if (response.success) {
                        currentLoggedInUsers = response.data.users.current;
                        currentTotalUsers = response.data.users.total;
                        currentVisitsToMyProfile = response.data.visits.user;
                        currentTotalVisitsToProfiles = response.data.visits.total;
                        currentMessageCount = response.data.messages.messagecount;
                        currentRecentMessagesCount = response.data.messages.recent;
                        renderGraphs();
                    }
                }
            };
            xhttp_graph.open("POST", "/get_graph_data", true);
            form = new FormData();
            form.append("token", localStorage.getItem("logintoken"));
            xhttp_graph.send(form);
        }
    };
    xhttp.open("POST", "/get_user_data_by_token", true);
    form = new FormData();
    form.append("token", localStorage.getItem("logintoken"));
    xhttp.send(form);
};


var homeRefreshWallMessages = function(){
    var xhttp = new XMLHttpRequest();
    
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var response = JSON.parse(xhttp.responseText);
            document.getElementById("homepostmessageerrormsg").innerHTML = response.message;

            if (response.success) {
                var wallmessages = response.data;
                
                if (typeof wallmessages === "undefined") {
                    document.getElementById("homepostmessageerrormsg").innerHTML = "No messages.";
                } else {
                    var messagewall = document.getElementById("homemessagewall");
                    
                    while (messagewall.firstChild) {
                        messagewall.removeChild(messagewall.firstChild);
                    }
                    
                    wallmessages.forEach(function(item){
                        var node = document.createElement("DIV");
                        node.appendChild(document.createElement("BR"));
                        node.appendChild(document.createTextNode(item.sender));
                        node.appendChild(document.createElement("BR"));
                        node.appendChild(document.createTextNode(item.message));
                        node.appendChild(document.createElement("BR"));
                        messagewall.appendChild(node);
                    });
                }
            }
        }
    };
    xhttp.open("POST", "/get_user_messages_by_token", true);
    form = new FormData();
    form.append("token", localStorage.getItem("logintoken"));
    xhttp.send(form);
};

var browseRefreshWallMessages = function(){
    var xhttp = new XMLHttpRequest();
    var email = document.getElementById("browseemail").innerHTML;
    
    if (email) {
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                var response = JSON.parse(xhttp.responseText);
                document.getElementById("browsepostmessageerrormsg").innerHTML = response.message;
    
                if (response.success) {
                    var wallmessages = response.data;
                    
                    if (typeof wallmessages === "undefined") {
                        document.getElementById("browsepostmessageerrormsg").innerHTML = "No messages.";
                    } else {
                        var messagewall = document.getElementById("browsemessagewall");
                        
                        while (messagewall.firstChild) {
                                messagewall.removeChild(messagewall.firstChild);
                        }
                        
                        wallmessages.forEach(function(item){
                            var node = document.createElement("DIV");
                            node.appendChild(document.createElement("BR"));
                            node.appendChild(document.createTextNode(item.sender));
                            node.appendChild(document.createElement("BR"));
                            node.appendChild(document.createTextNode(item.message));
                            node.appendChild(document.createElement("BR"));
                            messagewall.appendChild(node);
                        });
                    }
                }
            }
        };
        xhttp.open("POST", "/get_user_messages_by_email", true);
        form = new FormData();
        form.append("token", localStorage.getItem("logintoken"));
        form.append("email", email);
        xhttp.send(form);

    }
};

window.onload = function(){
    init();
};

var logoutButton = function(){
    console.log("Logging out");

    var xhttp = new XMLHttpRequest();
    
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            localStorage.removeItem("logintoken");
            localStorage.removeItem("currenttab");
            setCurrentView();
        }
    };
    xhttp.open("POST", "sign_out", true);
    form = new FormData();
    form.append("token", localStorage.getItem("logintoken"));
    xhttp.send(form);    
    
    if(ws != null) {
        ws.close;
        ws = null;
    }
};

var homePostMessageButton = function(){
    var message = document.getElementById("homepostmessagebox").value;
    if(message){
        var xhttp = new XMLHttpRequest();
        var postresult = null;

        xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            postresult = JSON.parse(xhttp.responseText);
            console.log(postresult.message);
            document.getElementById("homepostmessagebox").value="";
            homeRefreshWallMessages();
            document.getElementById("homepostmessageerrormsg").innerHTML=postresult.message;
        }
    };
    
    xhttp.open('POST', "post_message",  true);
    form = new FormData();
    form.append("token", localStorage.getItem("logintoken"));
    form.append("message", message);
    form.append("email", document.getElementById("homeemail").innerHTML);
    xhttp.send(form);
    
    } else {
        document.getElementById("homepostmessageerrormsg").innerHTML="Can't send empty message.";
    }

};

var browsePostMessageButton = function(){
    var message = document.getElementById("browsepostmessagebox").value;
    if(message){
        var xhttp = new XMLHttpRequest();
        var postresult = null;

        xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            postresult = JSON.parse(xhttp.responseText);
            console.log(postresult.message);
            document.getElementById("browsepostmessagebox").value="";
            browseRefreshWallMessages();
            document.getElementById("browsepostmessageerrormsg").innerHTML=postresult.message;
        }
    };

    xhttp.open('POST', "post_message",  true);
    form = new FormData();
    form.append("token", localStorage.getItem("logintoken"));
    form.append("message", message);
    form.append("email", document.getElementById("browseemail").innerHTML);
    xhttp.send(form);
        
    } else {
        document.getElementById("browsepostmessageerrormsg").innerHTML="Can't send empty message.";
    }
};
    
    
var browseUserButton = function(){
    var email = document.getElementById('browseuserarea').value
    
    if (email) {
        var xhttp = new XMLHttpRequest();
        
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                var response = JSON.parse(xhttp.responseText);
                var userdata = response.data;
                document.getElementById("browseusererrormsg").innerHTML = response.message;
                
                if (response.success) {
                    document.getElementById("browseemail").innerHTML=userdata.email;
                    document.getElementById("browsefirstname").innerHTML=userdata.firstname;
                    document.getElementById("browsefamilyname").innerHTML=userdata.familyname;
                    document.getElementById("browsegender").innerHTML=userdata.gender;
                    document.getElementById("browsecity").innerHTML=userdata.city;
                    document.getElementById("browsecountry").innerHTML=userdata.country;
                    
                    browseRefreshWallMessages(userdata.email);
                    
                    document.getElementById("browseusercontent").classList.remove("hidden-content");
                } else {
                    document.getElementById("browseusercontent").classList.add("hidden-content");
                }
            }
        };
        xhttp.open("POST", "/get_user_data_by_email", true);
        form = new FormData();
        form.append("token", localStorage.getItem("logintoken"));
        form.append("email", email);
        xhttp.send(form);        
    }
};

var displayHometab = function(){
    document.getElementById("homecontent").classList.add("active");
    document.getElementById("hometab").classList.add("active");

    document.getElementById("browsecontent").classList.remove("active");
    document.getElementById("browsetab").classList.remove("active");
    
    document.getElementById("accountcontent").classList.remove("active");
    document.getElementById("accounttab").classList.remove("active");
    
    localStorage.setItem("currenttab", "home");
    homeRefreshWallMessages();
};
 
var displayBrowsetab = function(){
    document.getElementById("homecontent").classList.remove("active");
    document.getElementById("hometab").classList.remove("active");
    
    document.getElementById("browsecontent").classList.add("active");
    document.getElementById("browsetab").classList.add("active");
    
    document.getElementById("accountcontent").classList.remove("active");
    document.getElementById("accounttab").classList.remove("active");
    
    localStorage.setItem("currenttab", "browse");
    browseRefreshWallMessages();
};
 
var displayAccounttab = function(){       
    document.getElementById("homecontent").classList.remove("active");
    document.getElementById("hometab").classList.remove("active");
    
    document.getElementById("browsecontent").classList.remove("active");
    document.getElementById("browsetab").classList.remove("active");
    
    document.getElementById("accountcontent").classList.add("active");
    document.getElementById("accounttab").classList.add("active");
    
    localStorage.setItem("currenttab", "account");
};