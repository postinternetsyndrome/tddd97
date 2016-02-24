var initStorage = function(){
	if (localStorage.getItem("contacts") == null){
		localStorage.setItem("contacts", "[]");
	}	
}

var attachHandlers = function(){

	var save = document.getElementById("saveform");

	if (save != null){
		var saveSaveButton = document.getElementById("savesave");
		var saveResetButton = document.getElementById("savereset");
		

		saveSaveButton.addEventListener('click', function(){
			save.setAttribute("onsubmit", "saveForm.save(this);return false;");


		});

		saveResetButton.addEventListener('click', function(){
			save.setAttribute("onsubmit", "saveForm.reset(this);return false;");


		});
	}

	var search = document.getElementById("searchform");

	if (search != null){
		var searchSearchButton = document.getElementById("searchsearch");
		var searchResetButton = document.getElementById("searchreset");
		

		searchSearchButton.addEventListener('click', function(){
			search.setAttribute("onsubmit", "searchForm.search(this);return false;");
		});

		searchResetButton.addEventListener('click', function(){
			search.setAttribute("onsubmit", "searchForm.reset(this);return false;");
		});
	}
	

}

var init = function(){
	initStorage();
	attachHandlers();
}

window.onload = function(){
	init();
};


//====================================================================================================================================================================================
var saveForm = {

	save: function(formData){

		initStorage();



		var contacts = JSON.parse(localStorage.getItem("contacts"));
		var newContact = {"firstname":formData.firstname.value, "familyname": formData.familyname.value, "mobile": formData.mobile.value};
		contacts.push(newContact);
		localStorage.setItem("contacts", JSON.stringify(contacts));
	},

	reset: function(formData){

		formData.firstname.value = "";
		formData.familyname.value = "";
		formData.mobile.value = "";
	}

};



var searchForm = {

	search: function(formData){

		initStorage();

		var firstname = formData.firstname.value.trim();
		var familyname = formData.familyname.value.trim();
		var result = [];

		var contacts = JSON.parse(localStorage.getItem("contacts"));

		contacts.forEach(function(c){
			if (firstname != "" &&  c.firstname != firstname ){
			}else if (familyname != "" &&  c.familyname != familyname ){
			}else{
				result.push(c);
			}
		});

		if (result.length > 0){

			document.getElementById("footercontainer").style.display = "block";
			var resultTable = document.getElementById("searchresult");
			result.forEach(function(r){
				resultTable.innerHTML += "<tr><td>"+ r.firstname + " " + r.familyname +"</td><td>"+ r.mobile +"</td></tr>";
			});
		}
		
	},

	reset: function(formData){
		formData.firstname.value = "";
		formData.familyname.value = "";
	},

	remove: function(){

	}

};