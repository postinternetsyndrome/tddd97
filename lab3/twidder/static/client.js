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
                    var exampleSocket = new WebSocket("ws://tddd97-labs-lordbamse.c9users.io/websocket/" + loginresult.data);
                    exampleSocket.onmessage = function (event) {
                        var socket_received = JSON.parse(event.data);
                        console.log(socket_received.message);

                        if (socket_received.messagetype == "forcedLogout") {
                            localStorage.removeItem("logintoken")
                            localStorage.removeItem("curenttab")
                            setCurrentView();
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
        xhttp.open("GET", "sign_in/"+email+"/"+password, true);
        xhttp.send();
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
            xhttp.open('GET', 'sign_up/'+formData.email.value+'/'+
                password+'/'+
                formData.firstname.value+'/'+
                formData.familyname.value+'/'+
                formData.gender.value+'/'+
                formData.city.value+'/'+
                formData.country.value,
                true);
            xhttp.send();
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
            xhttp.open("GET", "/change_password/" + localStorage.getItem("logintoken") + "/" + formData.oldpassword.value + "/" + newpassword, true);
            xhttp.send();
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
        xhttp.open("GET", "/get_login_status/" + localStorage.getItem("logintoken"), true);
        xhttp.send();
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
        }
    };
    xhttp.open("GET", "/get_user_data_by_token/" + localStorage.getItem("logintoken"), true);
    xhttp.send();
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
    xhttp.open("GET", "/get_user_messages_by_token/" + localStorage.getItem("logintoken"), true);
    xhttp.send();
};

var browseRefreshWallMessages = function(){
    var xhttp = new XMLHttpRequest();
    var email = document.getElementById("browseemail").innerHTML;
    
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
    xhttp.open("GET", "/get_user_messages_by_email/" + localStorage.getItem("logintoken") +"/"+email, true);
    xhttp.send();
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
            setCurrentView();
        }
    };
    xhttp.open("GET", "sign_out/" + localStorage.getItem("logintoken"), true);
    xhttp.send();    
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
    xhttp.open('GET', 'post_message/'+localStorage.getItem("logintoken")+'/'+
        message+'/'+
        document.getElementById("homeemail").innerHTML,
        true);
    xhttp.send();

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
    xhttp.open('GET', 'post_message/'+localStorage.getItem("logintoken")+'/'+
        message+'/'+
        document.getElementById("browseemail").innerHTML,
        true);
    xhttp.send();
        
    } else {
        document.getElementById("browsepostmessageerrormsg").innerHTML="Can't send empty message.";
    }
};
    
    
var browseUserButton = function(){
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
    xhttp.open("GET", "/get_user_data_by_email/" + localStorage.getItem("logintoken") + "/" + document.getElementById('browseuserarea').value, true);
    xhttp.send();
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