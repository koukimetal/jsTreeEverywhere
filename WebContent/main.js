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
					v = jsTreeJsonMaker(v);
					var jsonForm = JSON.stringify(v);
					var snippet = snippetMaker(jsonForm);

					$("#snippet_result").val(snippet);
				});

				//Create item with icon
				defaultItems.create.submenu = {
						"directory" : makeNormalItem("Directory", function (data) {
							var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
							inst.create_node(obj, {"icon" : "glyphicon glyphicon-folder-open"}, "last", function (new_node) {
								setTimeout(function () { inst.edit(new_node); },0);
							});
						}),
						"file" : makeNormalItem("File", function (data) {
							var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
							inst.create_node(obj, {"icon" : "glyphicon glyphicon-file"}, "last", function (new_node) {
								setTimeout(function () { inst.edit(new_node); },0);
							});
						}),
						"image" : makeNormalItem("Image", function (data) {
							var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
							inst.create_node(obj, {"icon" : "glyphicon glyphicon-picture"}, "last", function (new_node) {
								setTimeout(function () { inst.edit(new_node); },0);
							});
						}),
						"log" : makeNormalItem("Log", function (data) {
							var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
							inst.create_node(obj, {"icon" : "glyphicon glyphicon-floppy-disk"}, "last", function (new_node) {
								setTimeout(function () { inst.edit(new_node); },0);
							});
						})
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
		"plugins" : [ "contextmenu", "state", "dnd", "types"]
	});
}

//TODO implement what I want! In progress
//I want to minify where I make icon items.
//var makeIconSubmenu = function() {
//	list = [
//		["directory", "Directory", "glyphicon glyphicon-folder-open"],
//		["directory", "Directory", "glyphicon glyphicon-folder-open"]
//	];
//	console.log(list[1][2]);
//	var obj = {};
//	console.log(list.length);
//	for(var i = 0; i < list.length; i++) {
//		console.log(i);
//		console.log(list[i][1]);
//		obj[list[i][0]] = makeNormalItem(list[i][1], function (data) {
//			var inst = $.jstree.reference(data.reference),
//			obj = inst.get_node(data.reference);
//			console.log(list[i]);
//			inst.create_node(obj, {"icon" : list[i][2]}, "last", function (new_node) {
//				setTimeout(function () { inst.edit(new_node); },0);
//			});
//		})
//	}
//	return obj;
//}

var makeNormalItem = function(label, action) {
	var obj = {
			"separator_before"	: false,
			"separator_after"	: false,
			"label"				: label,
			"action"			: action
	};
	return obj;
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