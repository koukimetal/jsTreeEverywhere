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
				defaultItems.save = makeNormalItem("Save", function (data) {
					var v = $('#my_dir').jstree(true).get_json('#', {flat:true, no_state:true});
					var jsonForm = JSON.stringify(v);
					localStorage.setItem('userDirectory', jsonForm);
					alert("Saved");
				});

				//Publish
				defaultItems.publish = makeNormalItem("Publish", function (data) {
					var inst = $.jstree.reference(data.reference),
					obj = inst.get_node(data.reference);
					var v = $('#my_dir').jstree(true).get_json(obj.id);
					
					var treeId = $('#treeId').val();
					if(treeId == "") {
						treeId = 'tree_' + Math.floor(Math.random() * 1000);
					}
					
					v = jsTreeJsonMaker(treeId, v);
					var jsonForm = JSON.stringify(v);
					var snippet = snippetMaker(treeId, jsonForm);

					$("#snippet_result").val(snippet);
				});

				//Create item with icon
				defaultItems.create.submenu = makeIconSubmenu(
						{
							"directory" : {
								"label" : "Directory",
								"icon" : "glyphicon glyphicon-folder-open"
							},
							"file" : {
								"label" : "File",
								"icon" : "glyphicon glyphicon-file"
							},
							"image" : {
								"label" : "Image",
								"icon" : "glyphicon glyphicon-picture"
							},
							"log" : {
								"label" : "Log",
								"icon" : "glyphicon glyphicon-floppy-disk"
							}
						}	
				);

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
		"plugins" : [ "contextmenu", "state", "dnd", "types"]
	});
}

var makeIconSubmenu = function(items) {
	var resobj = {};
	$.each(items, function(key, value) {
		var itemFuncion = function (data) {
			var inst = $.jstree.reference(data.reference),
			obj = inst.get_node(data.reference);
			inst.create_node(obj, {"icon" : value.icon}, "last", function (new_node) {
				setTimeout(function () { inst.edit(new_node); },0);
			});
		};
		resobj[key] = makeNormalItem(value.label, itemFuncion);
	});

	return resobj;
}

var makeNormalItem = function(label, action) {
	var obj = {
			"separator_before"	: false,
			"separator_after"	: false,
			"label"				: label,
			"action"			: action
	};
	return obj;
}

var makeTrimmedObject = function(root, nodeId, prefix) {
	var obj = {};
	obj.id = prefix + "_" + nodeId;
	obj.text = root.text;
	obj.icon = root.icon;
	obj.state = {};
	obj.state.opened = root.state.opened;
	var size = 1;
	if(root.children.length > 0) {
		obj.children = [];
		for(var i = 0; i < root.children.length; i++) {
			var v = makeTrimmedObject(root.children[i], nodeId + size, prefix);
			size += v[0];
			obj.children[i] = v[1];
		}
	}
	
	return [size, obj];
}

var jsTreeJsonMaker = function(treeId, data) {
	var trimmedData = makeTrimmedObject(data, 0, treeId)[1];
	var obj = {
			"core" : {
				"data" : [trimmedData]
			}
	};
	return obj;
}

var snippetMaker = function(treeId, jsonForm) {
	//TODO if an user have 2 trees then, id should duplicate.
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