define(["jquery", 
		"qlik",
		"text!./action-button.css", 
		"text!./template/confirm-template.html",
		"text!./template/notify-template.html"
		//"text!./template/dialog-template.html"
],
function (  $, 
			qlik, 
			cssContent,
			confirmTemplate,
			notifyTemplate
			//dialogTemplate
){
	$("<style>").html(cssContent).appendTo("head");
	function createBtn(cmd, text) {
		return '<button class="lui-button" x-variant="success" data-cmd="' + cmd + '">' + text + '</button>';
	}
	
	function executeSeq(actionSeq){
		if(actionSeq.length < 1){
			return;
		}
		
		var action = actionSeq.shift();
		
		action().then(function(){
			executeSeq(actionSeq);
		});
		/*
		var chain = $.when();
		
		actionSeq.forEach(function(action){
			chain = chain.then(action());
		})
		
		return chain;
		*/
	}
	
	function doReload(app, isPartialReload){
		var deferred = $.Deferred();
			
	  	app.doReload(0, isPartialReload, false).then(function(){
			app.doSave().then(function(){
		  		deferred.resolve();
				showNotify("Reload Complete", "App has been reloaded.");
			}, function(){
		  		deferred.reject("ERR_SAVE_APP_FAILED");
				showNotify("Reload failed", "Problem has occurred during saving, please check system log.");
			});
	  	}, function(){
			deferred.reject("ERR_RELOAD_FAILED");
			showNotify("Reload failed", "Problem has occurred during reload, please check script log");
	  	});
		
		return deferred;
	}
	
	function reloadApp(app, isPartialReload, hasReloadConfirm, reloadConfirmHeader, reloadConfirmMessage){
		var deferred = $.Deferred();
			
		if(hasReloadConfirm){
		  	showConfirm(reloadConfirmHeader, reloadConfirmMessage).then(function(){
				doReload(app, isPartialReload).then(function(){
					deferred.resolve();
				},function(err){
					deferred.reject(err);
				});
		  	});
		} else {
		  	doReload(app, isPartialReload).then(function(){
				deferred.resolve();
			},function(err){
				deferred.reject(err);
			});
		}
		
		return deferred;
	}
	
	function setVariable(app, varName, varValue){
		var deferred = $.Deferred();
		
		app.variable.getByName(varName).then(
			function(){
				app.variable.setStringValue(varName, varValue).then(
					function(){
						deferred.resolve();
					},
					function(){
						deferred.reject("ERR_CANNOT_SET");
						showNotify("Set Varialbe Failed", "Variable cannot be set, please check system log.");
					});
			}, function(){
				deferred.reject("ERR_VAR_NOT_EXIST");
				showNotify("Set Varialbe Failed", "Variable '" + varName + "' does not exist.");
			});
		
		return deferred;
	}
	
	/*
	function showDialog(header, message, loadingImg){
		var dialogDg = $(dialogTemplate);
		dialogDg.find("header.dm-header").text(header);
		dialogDg.find("p.dm-p").text(message);
		
		$("body").append(dialogDg);
	}*/
	
	function showNotify(header, message){
		var notifyDg = $(notifyTemplate);
		notifyDg.find("header.dm-header").text(header);
		notifyDg.find("p.dm-p").text(message);
		notifyDg.find("button.close-button").on('qv-activate', function(){
			notifyDg.remove();
		});
		
		$("body").append(notifyDg);
	}
	
	function showConfirm(header, message){
		var deferred = $.Deferred();
		var confirmDg = $(confirmTemplate);
		confirmDg.find("header.dm-header").text(header);
		confirmDg.find("p.dm-p").text(message);

		confirmDg.find("button.ok-button").on('qv-activate', function(){
			deferred.resolve();
		  	confirmDg.remove();
		});

		confirmDg.find("button.cancel-button").on('qv-activate', function(){
			deferred.reject();
		  	confirmDg.remove();
		});

		$("body").append(confirmDg);
		
		return deferred;
	}
	
	//Color Pick List
	var palette = [
        "#b0afae",
        "#7b7a78",
        "#545352",
        "#4477aa",
        "#7db8da",
        "#b6d7ea",
        "#46c646",
        "#f93f17",
        "#ffcf02",
        "#276e27",
        "#ffffff",
        "#000000"
    ];
	
	var ActionSection = {
	  type: "items",
	  label: "Actions",
	  items:{
		MyList: {
		  type: "array",
		  ref: "actionList",
		  label: "Action",
		  itemTitleRef: "label",
		  allowAdd: true,
		  allowRemove: true,
		  addTranslation: "Add Action",
		  items: {
			actionList: {
			  type: "string",
			  component:"dropdown",
			  ref: "label",
			  label: "Action",
			  options:[
				{
				  value: "Set Variable",
				  label: "Set Variable"
				},
				{
				  value: "Reload App",
				  label: "Reload App"
				}
			  ]
			},

			//************** Set Variable properties *************
			varName:{
			  ref: "varName",
			  label: "Variable",
			  type: "string",
			  expression: "optional",
			  show: function(data){
				//console.log(data);

				return data.label == "Set Variable";
			  }
			},

			varValue:{
			  ref: "varValue",
			  label: "Value",
			  type: "string",
			  expression: "optional",
			  show: function(data){
				return data.label == "Set Variable";
			  }
			},

			//************** Load App properties *************
			partialReload: {
			  type: "boolean",
			  component: "switch",
			  label: "Do Partial Reload",
			  ref: "isPartialReload",
			  options: [{
				value: true,
				label: "Yes"
			  }, {
				value: false,
				label: "No"
			  }],
			  defaultValue: false,
			  show: function(data){
				return data.label == "Reload App";
			  }
			},

			hasReloadConfirm: {
			  type: "boolean",
			  component: "switch",
			  label: "Confirm Before Reload",
			  ref: "hasReloadConfirm",
			  options: [{
				value: true,
				label: "Yes"
			  }, {
				value: false,
				label: "No"
			  }],
			  defaultValue: true,
			  show: function(data){
				return data.label == "Reload App";
			  }
			},
			
			reloadConfirmHeader: {
				ref: "reloadConfirmHeader",
				label: "Confirmation Header",
				type: "string",
				expression: "optional",
				defaultValue: "Confirmation",
				show: function(data){
					return data.label == "Reload App" && data.hasReloadConfirm;
			  	}
			},
			
			reloadConfirmMessage: {
				ref: "reloadConfirmMessage",
				label: "Confirmation Message",
				type: "string",
				expression: "optional",
				defaultValue: "App will be reloaded, press OK to continue.",
				show: function(data){
					return data.label == "Reload App" && data.hasReloadConfirm;
			  	}
			}
		  }
		}
	  }
	};
	
	var AppearanceSection = {
		type: "items",
		label: "Appearance",
		component: "expandable-items",
		items:{
			labelProps: {
				type: "items",
				label: "Label",
				items: {
					lbText: {
						ref: "lbText",
						label: "Text",
						type: "string",
						expression: "optional"
					},
					
					lbColor:{
						ref: "lbColor",
						label: "Color",
						component: "color-picker",
						type: "integer",
						defaultValue: 2
					}
				}
			},
			
			ButtonProps: {
				type: "items",
				label: "Button",
				items: {
					btnColor:{
						ref: "btnColor",
						label: "Color",
						component: "color-picker",
						type: "integer",
						defaultValue: 10
					}
				}
			}
		}
	};
	
	return {
		initialProperties: {
            listItems: [],
			lbText: "Run"
        },
		support : {
			snapshot: true,
			export: true,
			exportData : false
		},
		
		definition : {
			type : "items",
			component : "accordion",
			items: {
				Actions: ActionSection,
				Appearance: AppearanceSection
			}
		},
		paint: function ($element, layout) {
			var html = '', app = qlik.currApp(this);
			var that = this;
			
			html += '<div class="action-btn-frame">';
			html += createBtn("actionBtn", layout.lbText);
			html += '</div>'
			$element.html(html);
			
			var btnInstance = $($element).find("button");
			
			btnInstance.css("color", palette[layout.lbColor]);
			btnInstance.css("background-color", palette[layout.btnColor]);
			
			if($("button.lui-active").length  > 0 || layout.actionList.length < 1){
				btnInstance.attr('disabled','disabled');
			}
			
			//console.log(layout);
			btnInstance.on('qv-activate', function() {
				var actionSeq = [];
			
				layout.actionList.forEach(function(v){
					switch (v.label) {
						case "Set Variable": {
							actionSeq.push(function(){
								return setVariable(app, v.varName, v.varValue);
							});
							return;
						}
						
						case "Reload App": {	
							actionSeq.push(function(){
								return reloadApp(app, v.isPartialReload, v.hasReloadConfirm, v.reloadConfirmHeader, v.reloadConfirmMessage);
							});
							return;
						}
					}
				});
				
				executeSeq(actionSeq);
			});
			
			//needed for export
			return qlik.Promise.resolve();
		}
	};

} );

