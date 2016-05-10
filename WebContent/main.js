//INIT

var setUp = function() {
	$("#my_dir").jstree({
		"core" : {
			"check_callback" : true,
			"data" : loadUserDir()
		},
		"contextmenu": {
			"items": function (o, cb) {
				var defaultItems = $.jstree.defaults.contextmenu.items(o, cb);

				//Change icon
				defaultItems.changeIcon = makeNormalItem("ChangeIcon", false);
				defaultItems.changeIcon.submenu = makeIconChangeSubmenu(iconsData);

				//Create item with icon
				defaultItems.create.submenu = makeIconSubmenu(iconsData);

				//Change link
				if(o.a_attr.href == "#") {
					//Make it Link
					defaultItems.link = makeNormalItem("Link", function (data) {
						makeItLink(data);
					});
				} else {
					//Make it Unlink
					defaultItems.unlink = makeNormalItem("Unlink", function (data) {
						makeItUnlink(data);
					});
				}

				//If I can have undo and redo then auto save should be better
				//Save
				defaultItems.save = makeNormalItem("Save", function (data) {
					saveJsTreeData();
				});

				//Publish
				defaultItems.publish = makeNormalItem("Publish", function (data) {
					publishJsTree(data);
				});

				//To prevent some action to a root
				if (o.id == "root") {
					delete defaultItems.rename;
					delete defaultItems.remove;
					delete defaultItems.ccp.submenu.cut;
					delete defaultItems.ccp.submenu.copy;
					delete defaultItems.publish;
					delete defaultItems.changeIcon;
				}

				return defaultItems;
			}
		},
		"plugins" : [ "contextmenu", "state", "dnd", "types"]
	}).bind("changed.jstree", function (e, data) {
		if(data.node) {
			var href = data.node.a_attr.href;
			if(href !== "#") {
				window.open(href, '_blank');
			}
		}
	});
}

var loadUserDir = function() {
	var jsonString = localStorage.getItem('userDirectory');
	var jsonData = JSON.parse(jsonString);
	if (jsonData == null) {
		jsonData = [{id: "root", text:"root"}];
	}
	return jsonData;
}

var setUpHandlebars = function() {
	Handlebars.registerPartial( "tree-template", $( "#tree-template" ).html() );
}

//OUTPUT

var makeTrimmedObject = function(root, nodeId, prefix) {
	var obj = {};
	obj.id = prefix + "_" + nodeId;
	obj.text = root.text;
	if(root.icon !== true) {
		obj.icon = root.icon;
	}

	if(root.state.opened === true) {
		obj.state = {"opened" : true};
	}

	var useLink = false;
	if(root.a_attr.href !== "#") {
		useLink = true;
		obj.a_attr = {"href" : root.a_attr.href};
	}

	var size = 1;
	if(root.children.length > 0) {
		obj.children = [];
		for(var i = 0; i < root.children.length; i++) {
			var v = makeTrimmedObject(root.children[i], nodeId + size, prefix);
			size += v.size;
			obj.children[i] = v.obj;
			useLink = useLink || v.useLink;
		}
	}

	return {"size" : size, "obj" : obj, "useLink" : useLink};
}

var makeJsTree = function(treeId, trimmedData) {
	var obj = {
			"core" : {
				"data" : [trimmedData]
			}
	};
	return obj;
}

var snippetMaker = function(treeId, htmlForm, jsonForm, useLink) {
	var treeDiv = "<div id='" + treeId + "'>" + htmlForm + "</div>\n";
	var jsTreeCommand = 
		"$('#" + treeId + "').jstree(" +
		jsonForm +
		")";

	if(useLink) {
		jsTreeCommand += '.bind("changed.jstree", function (e, data)' +
		'{if(data.node) {var href = data.node.a_attr.href;' + 
		'if(href !== "#") {window.open(href, "_blank");}}})';
	}
	
	var treeScript = 
		"<script>" +
		jsTreeCommand + ";" +
		"</script>\n";
	return treeDiv + treeScript;
}

var makeJsTreeHTML = function(treeId, trimmedData) {
	var main = Handlebars.compile( $( "#main-template" ).html());
	var html = main( {"children": [trimmedData]} );
//	return html;
	return html.replace(/\s+</g, "<").replace(/>\s+/g, ">");
}

//MENU

var saveJsTreeData = function() {
	var v = $('#my_dir').jstree(true).get_json('#', {flat:true, no_state:true});
	var jsonForm = JSON.stringify(v);
	localStorage.setItem('userDirectory', jsonForm);
	alert("Saved");
}

var publishJsTree = function(data) {
	var inst = $.jstree.reference(data.reference),
	obj = inst.get_node(data.reference);
	var rawJson = $('#my_dir').jstree(true).get_json(obj.id);

	var treeId = $('#treeId').val();
	if(treeId == "") {
		treeId = 'tree_' + Math.floor(Math.random() * 1000);
	}

	var result = makeTrimmedObject(rawJson, 0, treeId);
	var trimmedJsTreeData = result.obj;
	var jsTree = makeJsTree(treeId, trimmedJsTreeData);

	var jsTreeJson = JSON.stringify(jsTree);
	var jsonSnippet = snippetMaker(treeId, "", jsTreeJson, result.useLink);

	$("#snippetJSON").val(jsonSnippet);

	var jsTreeHTML = makeJsTreeHTML(treeId, trimmedJsTreeData);
	var htmlSnippet = snippetMaker(treeId, jsTreeHTML, "", result.useLink);
	$("#snippetHTML").val(htmlSnippet);
}

var iconsData = {
		"directory" : {
			"label" : "Directory",
			"icon" : "icon-folder-alt"
		},
		"file" : {
			"label" : "File",
			"icon" : "icon-doc"
		},
		"image" : {
			"label" : "Image",
			"icon" : "icon-picture"
		},
		"disc" : {
			"label" : "Disc",
			"icon" : "icon-disc"
		},
		"normal" : {
			"label" : "Normal",
			"icon" : true
		}
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

var makeIconChangeSubmenu = function(items) {
	var resobj = {};
	$.each(items, function(key, value) {
		var itemFuncion = function (data) {
			var inst = $.jstree.reference(data.reference),
			obj = inst.get_node(data.reference);
			inst.set_icon(obj, value.icon);
		};
		resobj[key] = makeNormalItem(value.label, itemFuncion);
	});

	return resobj;
}

var makeItLink = function(data) {
	var href = prompt("Put URL here");
	if(href === null || href === "#") {
		return;
	}
	var inst = $.jstree.reference(data.reference),
	obj = inst.get_node(data.reference);
	obj.a_attr.href = href;
	inst.set_icon(obj, "icon-link");
}

var makeItUnlink = function(data) {
	var inst = $.jstree.reference(data.reference),
	obj = inst.get_node(data.reference);
	obj.a_attr.href = "#";
	inst.set_icon(obj, true);
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