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
        var email = formData.email.value.trim();
        var password = formData.password.value.trim();
        var loginresult = serverstub.signIn(email,password);
        console.log(loginresult.success);
        
        if(loginresult.success) {
            console.log('loginForm: Successful login');
//            document.getElementById("loginerrormsg").innerHTML = loginresult.message.value; //Placeholder
            localStorage.setItem("logintoken", loginresult.data);
            setCurrentView();
        } else {
            console.log('loginForm: Login error');
            formData.password.value = "";
            document.getElementById("loginerrormsg").innerHTML = loginresult.message;
        }
    }
};

var signupForm = {
     
    signup: function(formData){
        var password = formData.password.value.trim();
        var repeatpassword = formData.repeatpassword.value.trim();
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
            
            document.getElementById("signuperrormsg").innerHTML = "Password mismatch.";
        } else {
            var signupresult = serverstub.signUp(user);
            console.log('signupForm: signup info sent');
            document.getElementById("signuperrormsg").innerHTML = signupresult.message;
        }
        formData.reset();
    }
};

var changePasswordForm = {
    
    changePassword: function(formData){
        var newpassword = formData.newpassword;
        var repeatnewpassword = formData.repeatnewpassword;
        
        if (newpassword != repeatnewpassword) {
            formData.newpassword = "";
            formData.repeatnewpassword = "";
        } else {
            var changepasswordresult = serverstub.changePassword(localStorage.getItem("logintoken"),
                                                                formData.oldpassword,
                                                                newpassword);
        }
    }
};

displayView = function(){
    
};

var init = function(){
    console.log('initializing');
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
}

var initBrowseView = function(){
    document.getElementById('currentview').innerHTML = document.getElementById('browseview').innerHTML;
    /*attachHandlersBrowseView();*/
    
    
    //browseRefreshWallMessages();
}

var homeRefreshWallMessages = function(){
    
    var wallmessages = serverstub.getUserMessagesByToken(localStorage.getItem("logintoken")).data;
    var messagewall = document.getElementById("homemessagewall");

    wallmessages.forEach(function(item){
        var node = document.createElement("DIV");
        node.appendChild(document.createElement("BR"));
        node.appendChild(document.createTextNode(item.writer));
        node.appendChild(document.createElement("BR"));
        node.appendChild(document.createTextNode(item.content));
        node.appendChild(document.createElement("BR"));

        messagewall.appendChild(node);
    });
}

var browseRefreshWallMessages = function(email){
    
    var wallmessages = serverstub.getUserMessagesByEmail(localStorage.getItem("logintoken"), email).data;
    var messagewall = document.getElementById("browsemessagewall");

    wallmessages.forEach(function(item){
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
    var postresult = serverstub.postMessage(localStorage.getItem("logintoken"),
        document.getElementById("homepostmessagebox").value,
        document.getElementById("homeemail").innerHTML
    );
    console.log(postresult.message);
    
    document.getElementById("homepostmessagebox").value="";
    homeRefreshWallMessages();
}

var browsePostMessageButton = function(){
    var postresult = serverstub.postMessage(localStorage.getItem("logintoken"),
        document.getElementById("browsepostmessagebox").value,
        document.getElementById("browseemail").innerHTML
    );
    console.log(postresult.message);
    
    document.getElementById("browsepostmessagebox").value="";
    browseRefreshWallMessages();
}
    
    
var browseUserButton = function(){
    var userdata = serverstub.getUserDataByEmail(localStorage.getItem("logintoken"),
                                                document.getElementById('browseuserarea').value);
    console.log(userdata.message);
    document.getElementById("browseemail").innerHTML=userdata.data.email;
    document.getElementById("browsefirstname").innerHTML=userdata.data.firstname;
    document.getElementById("browsefamilyname").innerHTML=userdata.data.familyname;
    document.getElementById("browsegender").innerHTML=userdata.data.gender;
    document.getElementById("browsecity").innerHTML=userdata.data.city;
    document.getElementById("browsecountry").innerHTML=userdata.data.country;
    
    browseRefreshWallMessages(userdata.data.email);
}

var hometabButton = function(){
    document.getElementById("homecontent").classList.add("active");
    document.getElementById("hometab").classList.add("active");

    document.getElementById("browsecontent").classList.remove("active");
    document.getElementById("browsetab").classList.remove("active");
    
    document.getElementById("accountcontent").classList.remove("active");
    document.getElementById("accounttab").classList.remove("active");
};
 
var browsetabButton = function(){
    document.getElementById("homecontent").classList.remove("active");
    document.getElementById("hometab").classList.remove("active");
    
    document.getElementById("browsecontent").classList.add("active");
    document.getElementById("browsetab").classList.add("active");
    
    document.getElementById("accountcontent").classList.remove("active");
    document.getElementById("accounttab").classList.remove("active");
};
 
var accounttabButton = function(){       
    document.getElementById("homecontent").classList.remove("active");
    document.getElementById("hometab").classList.remove("active");
    
    document.getElementById("browsecontent").classList.remove("active");
    document.getElementById("browsetab").classList.remove("active");
    
    document.getElementById("accountcontent").classList.add("active");
    document.getElementById("accounttab").classList.add("active");
};