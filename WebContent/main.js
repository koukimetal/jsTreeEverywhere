var setUp = function() {
	$("#my_dir").jstree({
		"core" : {
			"check_callback" : true,
			"data" : loadUserDir()
		},
		"contextmenu": {
			"items": function (o, cb) {
				var defaultItems = $.jstree.defaults.contextmenu.items(o, cb);
				
				//If I can have undo and redo then auto save should be better
				//Save
				defaultItems.save = {
					"separator_before"	: false,
					"separator_after"	: false,
					"label"				: "Save",
					"action"			: function (data) {
						var v = $('#my_dir').jstree(true).get_json('#', {flat:true, no_state:true});
						var jsonForm = JSON.stringify(v);
						localStorage.setItem('userDirectory', jsonForm);
						alert("Saved");
					}
				};
				
				//Publish
				defaultItems.publish = {
					"separator_before"	: false,
					"separator_after"	: false,
					"label"				: "Publish",
					"action"			: function (data) {
						var inst = $.jstree.reference(data.reference),
						obj = inst.get_node(data.reference);
						var v = $('#my_dir').jstree(true).get_json(obj.id);
						v = jsTreeJsonMaker(v);
						var jsonForm = JSON.stringify(v);
						var snippet = snippetMaker(jsonForm);

						$("#snippet_result").val(snippet);
					}
				};
				
				//To prevent some action to a root
				if (o.id == "root") {
					delete defaultItems.rename;
					delete defaultItems.remove;
					delete defaultItems.ccp.submenu.cut;
					delete defaultItems.ccp.submenu.copy;
					delete defaultItems.publish;
				}
				
				return defaultItems;
			}
		},
		"plugins" : [ "contextmenu", "state", "dnd"]
	});
}

var jsTreeJsonMaker = function(data) {
	var obj = {
			"core" : {
				"data" : [data]
			}
	};
	return obj;
}

var snippetMaker = function(jsonForm) {
	//TODO if an user have 2 trees then, id should duplicate.
	var treeId = 'tree_' + Math.floor(Math.random() * 1000);
	var treeDiv = "<div id='" + treeId + "'></div>\n";
	var jsTreeCommand = 
		"$('#" + treeId + "').jstree(" +
		jsonForm +
		")";
	var treeScript = 
			"<script>\n" +
			jsTreeCommand + ";\n" +
			"</script>";
	return treeDiv + treeScript;
}

var loadUserDir = function() {
	var jsonString = localStorage.getItem('userDirectory');
	var jsonData = JSON.parse(jsonString);
	if (jsonData == null) {
		jsonData = [{id: "root", text:"root"}];
	}
	return jsonData;
}