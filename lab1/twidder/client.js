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
        var loginresult = serverstub.signIn(email,password);
        console.log(loginresult.message);
        
        if(loginresult.success) {
//            document.getElementById("loginerrormsg").innerHTML = loginresult.message.value; //Placeholder
            localStorage.setItem("logintoken", loginresult.data);
            setCurrentView();
        } else {
            formData.password.value = "";
            document.getElementById("loginerrormsg").innerHTML = loginresult.message;
        }
    }
};

var signupForm ={ 
     
    signup: function(formData){
        var password = formData.password.value;
        var repeatpassword = formData.repeatpassword.value
        var user = {
            'email': formData.email.value,
            'password': formData.password.value,
            'firstname': formData.firstname.value,
            'familyname': formData.familyname.value,
            'gender': formData.gender.value,
            'city': formData.city.value,
            'country': formData.country.value,
        }

        if(password != repeatpassword)
        {
            formData.password.value = "";
            formData.repeatpassword.value = "";
            
            document.getElementById("signuperrormsg").innerHTML = "Passwords do not match.";
        } else if (password.length < 8) {
            formData.password.value = "";
            formData.repeatpassword.value = "";
            
            document.gteElementById("signuperrormsg").innerHTML = "Password must be at least 8 characters long.";
        } else {
            var signupresult = serverstub.signUp(user);
            console.log('signupForm: signup info sent');
            document.getElementById("signuperrormsg").innerHTML = signupresult.message;
            formData.reset();
        }
    }
};

var changePasswordForm = {
    
    changePassword: function(formData){
        var newpassword = formData.newpassword.value;
        var repeatnewpassword = formData.repeatnewpassword.value;
        
        if (newpassword.length < 8) {
            formData.newpassword = "";
            formData.repeatnewpassword = "";
            document.getElementById("changepassworderrormsg").innerHTML = "The new password is too short";
        } else if(newpassword != repeatnewpassword){
            formData.newpassword = "";
            formData.repeatnewpassword = "";
            document.getElementById("changepassworderrormsg").innerHTML = "Passwords do not match";
        } else {
            var changepasswordresult = serverstub.changePassword(localStorage.getItem("logintoken"),
                                                                formData.oldpassword.value,
                                                                newpassword);
            document.getElementById("changepassworderrormsg").innerHTML = changepasswordresult.message;
            formData.newpassword = "";
            formData.repeatnewpassword = "";                
        }
    }
};

displayView = function(){
    
};

var init = function(){
    console.log('Initializing page');
    setCurrentView();   

};

var setCurrentView = function(){
    if (localStorage.getItem("logintoken") === null) {
        initWelcomeView();
    } else {
        initProfileView();
    }
};

var initWelcomeView = function(){
    document.getElementById('currentview').innerHTML = document.getElementById('welcomeview').innerHTML;
    attachHandlersWelcomeView();
}

var initProfileView = function(){
    document.getElementById('currentview').innerHTML = document.getElementById('profileview').innerHTML;
    attachHandlersProfileView();
    
    var userdata = serverstub.getUserDataByToken(localStorage.getItem("logintoken")).data;
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


var homeRefreshWallMessages = function(){
    
    var wallmessages = serverstub.getUserMessagesByToken(localStorage.getItem("logintoken"));
    var messagewall = document.getElementById("homemessagewall");
    
    while (messagewall.firstChild) {
            messagewall.removeChild(messagewall.firstChild);
    }
    
    document.getElementById("homepostmessageerrormsg").innerHTML = wallmessages.message;
    
    wallmessages.data.forEach(function(item){
        var node = document.createElement("DIV");
        node.appendChild(document.createElement("BR"));
        node.appendChild(document.createTextNode(item.writer));
        node.appendChild(document.createElement("BR"));
        node.appendChild(document.createTextNode(item.content));
        node.appendChild(document.createElement("BR"));
        
        messagewall.appendChild(node);
    });
}

var browseRefreshWallMessages = function(){
    var email = document.getElementById("browseuserarea").value;
    var wallmessages = serverstub.getUserMessagesByEmail(localStorage.getItem("logintoken"), email);
    var messagewall = document.getElementById("browsemessagewall");

    document.getElementById("browsepostmessageerrormsg").innerHTML = wallmessages.message;
    
    while (messagewall.firstChild) {
            messagewall.removeChild(messagewall.firstChild);
    }
    
    wallmessages.data.forEach(function(item){
        var node = document.createElement("DIV");
        node.appendChild(document.createElement("BR"));
        node.appendChild(document.createTextNode(item.writer));
        node.appendChild(document.createElement("BR"));
        node.appendChild(document.createTextNode(item.content));
        node.appendChild(document.createElement("BR"));
        
        messagewall.appendChild(node);
    });
}

window.onload = function(){
    init();
};

var logoutButton = function(){
    console.log("Logging out");
    serverstub.signOut(localStorage.getItem("logintoken"));
    localStorage.removeItem("logintoken");
    setCurrentView();
};

var homePostMessageButton = function(){
    var message = document.getElementById("homepostmessagebox").value;
    if(message){
        var postresult = serverstub.postMessage(
            localStorage.getItem("logintoken"),
            message,
            document.getElementById("homeemail").innerHTML
        );
        document.getElementById("homepostmessagebox").value="";
        homeRefreshWallMessages();
        
        document.getElementById("homepostmessageerrormsg").innerHTML=postresult.message;
    } else {
        document.getElementById("homepostmessageerrormsg").innerHTML="Can't send empty message.";
    }

}

var browsePostMessageButton = function(){
    var message = document.getElementById("browsepostmessagebox").value;
    if(message){
        var postresult = serverstub.postMessage(
            localStorage.getItem("logintoken"),
            document.getElementById("browsepostmessagebox").value,
            document.getElementById("browseemail").innerHTML
        );
        
        document.getElementById("browsepostmessageerrormsg").innerHTML=postresult.messa;g
        document.getElementById("browsepostmessagebox").value="";
        browseRefreshWallMessages();
    } else {
        document.getElementById("browsepostmessageerrormsg").innerHTML="Can't send empty message.";
    }
}
    
    
var browseUserButton = function(){
    var userdata = serverstub.getUserDataByEmail(localStorage.getItem("logintoken"),
                                                document.getElementById('browseuserarea').value);
    
    document.getElementById("browseusererrormsg").innerHTML = userdata.message;
    
    if (userdata.success) {
        document.getElementById("browseemail").innerHTML=userdata.data.email;
        document.getElementById("browsefirstname").innerHTML=userdata.data.firstname;
        document.getElementById("browsefamilyname").innerHTML=userdata.data.familyname;
        document.getElementById("browsegender").innerHTML=userdata.data.gender;
        document.getElementById("browsecity").innerHTML=userdata.data.city;
        document.getElementById("browsecountry").innerHTML=userdata.data.country;

        browseRefreshWallMessages(userdata.data.email);
        
        document.getElementById("browseusercontent").classList.remove("hidden-content");
    } else {
        document.getElementById("browseusercontent").classList.add("hidden-content");
    }
}

var displayHometab = function(){
    document.getElementById("homecontent").classList.add("active");
    document.getElementById("hometab").classList.add("active");

    document.getElementById("browsecontent").classList.remove("active");
    document.getElementById("browsetab").classList.remove("active");
    
    document.getElementById("accountcontent").classList.remove("active");
    document.getElementById("accounttab").classList.remove("active");
    
    localStorage.setItem("currenttab", "home");
};
 
var displayBrowsetab = function(){
    document.getElementById("homecontent").classList.remove("active");
    document.getElementById("hometab").classList.remove("active");
    
    document.getElementById("browsecontent").classList.add("active");
    document.getElementById("browsetab").classList.add("active");
    
    document.getElementById("accountcontent").classList.remove("active");
    document.getElementById("accounttab").classList.remove("active");
    
    localStorage.setItem("currenttab", "browse");
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