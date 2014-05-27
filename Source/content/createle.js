/**
 * TimeManagement namespace.
 */
if ("undefined" == typeof(TimeManagement)) {
  var TimeManagement = {};
};

function onLoad(){
	//Load the data if Edit Limiting Event
	if (window.arguments[0] != null){
		var le = window.arguments[0];
		document.getElementById("le-name").value = le.name;
		document.getElementById("le-deadline").value = le.deadline;
		document.getElementById("le-duration").value = le.duration;
		document.getElementById("le-allocation").value = (le.allocation)/60;
		if (le.restrictive == "true")document.getElementById("le-restrictive").checked = true;
		else document.getElementById("le-restrictive").checked = false;
		document.getElementById("le-websites").value = le.websites;
	}
	else{
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.timemanagement.");
		var default_duration = prefs.getIntPref('default.duration');
		var default_allocation = prefs.getIntPref('default.allocation');
		var default_restrictive = prefs.getBoolPref('default.restrictive');
		var default_favorites = prefs.getCharPref('default.favorites');
		document.getElementById("le-duration").value = default_duration;
		document.getElementById("le-allocation").value = default_allocation;
		document.getElementById("le-restrictive").checked = default_restrictive;
		document.getElementById("le-websites").value = default_favorites;
	}
}

function doOK() {
	//Remove the old file, if Edit Limiting Event
	
	let name = document.getElementById("le-name").value;
	if (name == "" || document.getElementById("le-websites").value == ""){
		alert("Please enter a name and a domain.");
		return false;
	}
	
	if (window.arguments[0] != null){
		var file = Components.classes["@mozilla.org/file/local;1"].  
        createInstance(Components.interfaces.nsILocalFile); 
		file.initWithPath(window.arguments[0].path);
		file.remove(false);
	}
	let info = document.getElementById("le-deadline").value + 
				 "|" + document.getElementById("le-duration").value +
				 "|" + (document.getElementById("le-allocation").value)*60 +
				 "|" + document.getElementById("le-restrictive").checked +
				 "|" + document.getElementById("le-websites").value;
	let limitingEvent = this.getLocalDirectory();
	limitingEvent.append(name);
	//Permissions can be changed to UNIX style:  read/write for user only, read only otherwise
	limitingEvent.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0644);
	
	Components.utils.import("resource://gre/modules/NetUtil.jsm");  
    Components.utils.import("resource://gre/modules/FileUtils.jsm");  
      
    // file is nsIFile, data is a string  
      
    // You can also optionally pass a flags parameter here. It defaults to  
    // FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_TRUNCATE;  
    var ostream = FileUtils.openSafeFileOutputStream(limitingEvent);  
      
    var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].  
                    createInstance(Components.interfaces.nsIScriptableUnicodeConverter);  
    converter.charset = "UTF-8";  
    var istream = converter.convertToInputStream(info);  
      
    // The last argument (the callback) is optional.  
    NetUtil.asyncCopy(istream, ostream, function(status) {  
      if (!Components.isSuccessCode(status)) {  
        // Handle error!  
        return;  
      }  
      
      // Data has been written to the file.  
    });
	window.close();
	return true;
}

function doCancel() {
	window.close();
	return false;
}

function getLocalDirectory() { 
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