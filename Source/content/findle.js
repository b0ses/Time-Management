function doOK() {
	window.arguments[0].out = document.getElementById("find-menu").value;
	window.close();
	return true;
}

function doCancel() {
	window.close();
	return false;
}

function onLoad() {
	var myMenuPopup = document.getElementById("find-menupopup");
	let localdir = this.getLocalDirectory();
	var entries = localdir.directoryEntries;
	if (entries.hasMoreElements()==false){
		window.alert("No limiting events found.");
		window.close();
		return false;
	}
	while(entries.hasMoreElements()){
		var entry = entries.getNext();
		entry.QueryInterface(Components.interfaces.nsIFile);
		var name = entry.leafName;
		newItem = document.createElement("menuitem");
		newItem.setAttribute("label", name);
		// the value is set to the path because I had trouble when set to the nsiFile itself
		newItem.setAttribute("value", entry.path);
		myMenuPopup.appendChild(newItem);
	}
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