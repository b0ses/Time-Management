/**
 * TimeManagement namespace.
 */
if ("undefined" == typeof(TimeManagement)) {
  var TimeManagement = {};
};
  
/**
 * Controls the browser overlay for the Hello World extension.
 */
TimeManagement.Browser = {
  
  updateles: function(){
	  //Read files and store urls
	  
	  let localdir = TimeManagement.Browser.getLocalDirectory();
	  var entries = localdir.directoryEntries;
	  
	  
	//Get urls from tabs
	  var num = gBrowser.browsers.length;
	  var openTabList = new Array();
	  for (var i=0; i<num; i++){
		var b = gBrowser.getBrowserAtIndex(i);
		try{
			var website = b.currentURI.spec; //dump URLs of all open tabs to console
			var splitweb = website.split("/"); 
			openTabList[i] = splitweb[2]; 
		}catch(e){
			Components.utils.reportError(e);
		}
	  }
	  
		//For every limiting event...
	    var test = {out:null};
		while(entries.hasMoreElements()){
			var file = entries.getNext();
			file.QueryInterface(Components.interfaces.nsILocalFile);
			//Read file:
			// open an input stream from file  
			var istream = Components.classes["@mozilla.org/network/file-input-stream;1"].  
			              createInstance(Components.interfaces.nsIFileInputStream);  
			istream.init(file, 0x01, 0444, 0);  
			istream.QueryInterface(Components.interfaces.nsILineInputStream);  
			  
			// read line of file
			var data = "";  
			var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].  
			              createInstance(Components.interfaces.nsIFileInputStream);  
			var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].  
			              createInstance(Components.interfaces.nsIConverterInputStream);  
			fstream.init(file, -1, 0, 0);  
			cstream.init(fstream, "UTF-8", 0, 0); // you can use another encoding here if you wish  
			  
			let (str = {}) {  
			  let read = 0;  
			  do {   
			    read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value  
			    data += str.value;  
			  } while (read != 0);  
			}  
			cstream.close(); // this closes fstream  
			
			var settings = data.split("|");
			var le = {path:file.path, 
			  		  name:file.leafName, 
			   		  deadline:settings[0], 
			   		  duration:settings[1], 
			   		  allocation:settings[2], 
			   		  restrictive:settings[3], 
			   		  websites:settings[4]}; 
		    
			//Check to see if we are within the duration time
			var currdate = new Date();
			var deadlinesplit = le.deadline.split("-"); //month,day,year
			var parsedeadline = [parseInt(deadlinesplit[0]), parseInt(deadlinesplit[1]), parseInt(deadlinesplit[2])];
			var deadlinedate = new Date(parsedeadline[0], parsedeadline[1]-1, parsedeadline[2]); //year,month(0-11),day
			var numdays = le.duration;
			while (numdays > 0){
				monthdays = [31,28,31,30,31,30,31,31,30,31,30,31];
				//if it is a leap year, change February days
				if ((parsedeadline[0]%100 == 0 && parsedeadline[0]%400 == 0) ||
						(parsedeadline[0]%4 == 0 && parsedeadline[0]%100 != 0)){
					monthdays[1] = 29;
				}
				//subtract one day and fix month and year if necessary
				parsedeadline[2] -= 1;
				if (parsedeadline[2] < 1){
					parsedeadline[1] -= 1;
					parsedeadline[2] = monthdays[parsedeadline[0]-1];
					if (parsedeadline[1] < 1)
						parsedeadline[1] = 12;
						parsedeadline[0] -= 1;
				}
				numdays -= 1;
			}
			//Create the actual start date of limiting event
			var startdate =  new Date(parsedeadline[0], parsedeadline[1]-1, parsedeadline[2]); //year,month(0-11),day
			
			if((currdate.getYear() > deadlinedate.getYear()) || 
			  ((currdate.getYear() >= deadlinedate.getYear()) && (currdate.getMonth() > deadlinedate.getMonth())) ||
			  (((currdate.getYear() >= deadlinedate.getYear()) && (currdate.getMonth() >= deadlinedate.getMonth())) && (currdate.getDate() >= deadlinedate.getDate()))){
				alert("You have reached the deadline on '" + le.name + "'.\nPlease remove it or extend the deadline.");
				continue;
			}
			
			//Check if years and months match, and the day is in the right place
			if((startdate.getFullYear() == currdate.getFullYear()) && 
					(startdate.getMonth() == currdate.getMonth()) && 
					(currdate.getDay() <= deadlinedate.getDay()) &&
					(startdate.getDay() <= currdate.getDay())){
			
				//if there is no allocation left, close the right sites
				//else update the limiting event    
				var lewebs = le.websites.split(",");
		      
				if(le.restrictive == "false"){
					for(var j=0; j<lewebs.length; j++){
						for(var k=0; k<num; k++){
							if(openTabList[k]==lewebs[j].trim()){
								var iallocation = parseInt(le.allocation);
								iallocation -= 5;
								if (iallocation < 0){
									gBrowser.removeTab(gBrowser.mTabs[k]);
									alert(le.name + "has expired");
								}
								le.allocation = iallocation.toString();
				//				alert("Limiting Event: " + le.name + "\n Allocation:" + le.allocation);
							}
						}
					}
				}
				else{
					var restrictivesites = new Array();
					for(var j=0; j<lewebs.length; j++){
						restrictivesites[lewebs[j].trim()] = j;
					}
					
					for(var j=0; j<lewebs.length; j++){
						for(var k=0; k<num; k++){
							if(!(openTabList[k] in restrictivesites)){
								var iallocation = parseInt(le.allocation);
								iallocation -= 5;
								if (iallocation < 0){
									gBrowser.removeTab(gBrowser.mTabs[k]);
									alert(le.name + "has expired");
								}
								le.allocation = iallocation.toString();
								//alert("Limiting Event: " + le.name + "\n Allocation:" + le.allocation);
							}
						}
					}
				}
			
				let info = le.deadline + "|" + le.duration + "|" + le.allocation + "|" + le.restrictive +
							"|" + le.websites;
			
				// file is nsIFile, info is a string  
				var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].  
								createInstance(Components.interfaces.nsIFileOutputStream);  
		      
				// use 0x02 | 0x10 to open file for appending.  
				foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);   
				// write, create, truncate  
				// In a c file operation, we have no need to set file mode with or operation,  
				// directly using "r" or "w" usually.  
		      
				// if you are sure there will never ever be any non-ascii text in data you can   
				// also call foStream.write(data, data.length) directly  
				var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].  
									createInstance(Components.interfaces.nsIConverterOutputStream);  
				converter.init(foStream, "UTF-8", 0, 0);  
				converter.writeString(info);  
				converter.close(); // this closes foStream
			}
	  }
  },
  
  login : function(aEvent) {
    //Create password manager
	var passwordManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
	// For testing purposes, you can use the next line to see what it would look like for the first time user. Simply open it, go to the register screen, close out, comment the line out, and do it again.
	//	passwordManager.removeAllLogins();
	var register = passwordManager.countLogins("chrome://timemanagement", "", "") == 0;
	if(register) 
		window.alert("Please provide a username and password.\nYou will be required to provide this in the future.");
	//Prompt user for username and password
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]  
    .getService(Components.interfaces.nsIPromptService);  
    var username = {value: ""};              // default the username to user     
    var password = {value: ""};              // default the password to pass   
    var check = {value: false};               // default the checkbox to true   
    var result = prompts.promptUsernameAndPassword(null, "Login", "Enter username and password:",  
                           username, password, null, check);
    //If cancel was pressed, then return false
    if (result == false){
    	return result;
    }
    if(register){
    	var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",Components.interfaces.nsILoginInfo,"init");  
    	var loginInfo = new nsLoginInfo("chrome://timemanagement", null, 'User Registration', username.value, password.value,"", "");
        //Store username and password in login manager
    	passwordManager.addLogin(loginInfo);
    	return true;
    }
    else{
    	//Check to see if info matches with password in password manager
        var hostname = 'chrome://timemanagement';  
    	var formSubmitURL = null;  
    	var httprealm = 'User Registration'; 
    	var found_password;
    	try {   
    	   // Find users for the given parameters  
    	   var logins = passwordManager.findLogins({}, hostname, formSubmitURL, httprealm);  
    	   // Find user from returned array of nsILoginInfo objects  
    	   for (var i = 0; i < logins.length; i++) {  
    	      if (logins[i].username == username.value) {  
    	         found_password = logins[i].password;  
    	         break;  
    	      }  
    	   }  
    	}  
    	catch(ex) {  
    	   // This will only happen if there is no nsILoginManager component class
    		return false;
    	}
//    	window.alert(found_password);
    	//If the passwords do not match return false
    	if (password.value != found_password){
    		prompts.alert(null,"Time Management.","Incorrect username and password.");
    		this.login();
    	}
    	//If the passwords match return true
    	return true;
    }
 },
  
  createle : function(aEvent) {
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]  
                            .getService(Components.interfaces.nsIPromptService); 
	if(this.login(aEvent) == true){
		window.openDialog(  
			"chrome://timemanagement/content/createLimitingEvent.xul",  
			"createlimitingevent-dialog", "chrome,centerscreen", null);
	}
  },
  
  editle : function(aEvent) {
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]  
                            .getService(Components.interfaces.nsIPromptService); 
	if(this.login(aEvent) == true){
		var lepath = this.findle(aEvent);
		var file = Components.classes["@mozilla.org/file/local;1"].  
        createInstance(Components.interfaces.nsILocalFile); 
		file.initWithPath(lepath);
		
	    Components.utils.import("resource://gre/modules/NetUtil.jsm");  
	      
	    NetUtil.asyncFetch(file, function(inputStream, status) {  
	      if (!Components.isSuccessCode(status)) {  
	        // Handle error!  
	        return;  
	      }  
	      
	      // The file data is contained within inputStream.  
	      // You can read it into a string with  
	      var data = NetUtil.readInputStreamToString(inputStream, inputStream.available());
	      var settings = data.split("|");
	      var le = {path:lepath, 
	    		    name:file.leafName, 
	    		    deadline:settings[0], 
	    		    duration:settings[1], 
	    		    allocation:settings[2], 
	    		    restrictive:settings[3], 
	    		    websites:settings[4]};
	      window.openDialog(  
					"chrome://timemanagement/content/createLimitingEvent.xul",  
					"createlimitingevent-dialog", "chrome,centerscreen", le);
	    });
	}
  },
  
  deletele : function(aEvent) {
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]  
                            .getService(Components.interfaces.nsIPromptService);
	if(prompts.confirm(null,"Confirmation", "Are you sure you want to delete?") == false || this.login(aEvent) == false) return;
	else {
		var path = this.findle(aEvent);
	    var file = Components.classes["@mozilla.org/file/local;1"].  
        createInstance(Components.interfaces.nsILocalFile);  
	    file.initWithPath(path);
	    file.remove(false);
	}
  },
  
  findle : function(aEvent) {
		var le = {out:null};
		window.openDialog(  
			"chrome://timemanagement/content/findLimitingEvent.xul",  
			"findlimitingevent-dialog", "chrome,centerscreen, dialog, modal", le).focus();
		if (le.out != null){
			return le.out;
		}
		return false;
  },
  
  getLocalDirectory : function() { 
	  let directoryService =  
		Components.classes["@mozilla.org/file/directory_service;1"].  
		  getService(Components.interfaces.nsIProperties);  
	  // this is a reference to the profile dir (ProfD) now.  
	  let localDir = directoryService.get("ProfD", Components.interfaces.nsIFile);  
	  
	  localDir.append("TimeManagement");  
	  
	  if (!localDir.exists() || !localDir.isDirectory()) {  
		// read and write permissions to owner and group, read-only for others.  
		localDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0774);  
	  }  
	  
	  return localDir;  
  }
};

window.setInterval(TimeManagement.Browser.updateles, 300000); //was 300000