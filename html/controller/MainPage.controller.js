sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
], function (Controller, JSONModel) {
	"use strict";

	var input_name_begin_char = "";
    var input_name_end_char = "";
    var input_default_value_begin_char = "";
    var input_default_value_end_char = "";
	var final_output_generated = "false";

	var PageController = Controller.extend("maxchen021.T3.controller.MainPage", {
		onInit: function () {	
		},

		onBeforeRendering: function () {
            this.updateDataFromUrl();
        },

		displaySuccessMessageBox(msg, title="Success") {
			jQuery.sap.require("sap.m.MessageBox");
			sap.m.MessageBox.show(
				msg, {
				icon: sap.m.MessageBox.Icon.SUCCESS,
				title: title
			});
		},
	
		displayErrorMessageBox(msg, title="Error") {
			jQuery.sap.require("sap.m.MessageBox");
			sap.m.MessageBox.show(
				msg, {
				icon: sap.m.MessageBox.Icon.ERROR,
				title: title
			});
		},

		displayWarningMessageBox(msg, title="Warning") {
			jQuery.sap.require("sap.m.MessageBox");
			sap.m.MessageBox.show(
				msg, {
				icon: sap.m.MessageBox.Icon.WARNING,
				title: title
			});
		},
	
		displayMessageToast(msg) {
			jQuery.sap.require("sap.m.MessageToast");
			sap.m.MessageToast.show(msg);
		},

		showHelpPage: function() {
			var msg = `
			Step 1. Enter your data in the "Text Template" section (You can adjust the "Input Name Pattern" and "Input Default Value Pattern" per your need).\n
			Step 2. Click the "Generate User Input" button to generate the "User Input" section.\n
			Step 3. Complete the "User Input" section or click the "Get Link To Share" button to share it with your user to complete it.\n
			Step 4. Click the "Generate Final Output" button to get the final output in the "Final Output" section (You can also click the "Get Link To Share" button to share all the data).\n
			`;
			this.displaySuccessMessageBox(msg, "How-To");
		},

		doesEmptyUserInputDataExist: function() {
			var oTable = this.getView().byId('idUserInputTable');
            var oModel = oTable.getModel();
            //console.log(oModel);
            var input_list_data = oModel.oData.input_list;
			for (let i in input_list_data) {
                var current_input = input_list_data[i];
                if (!current_input["input_value"]){
					return true;
				}
            }
			return false;
		},

		updateCurrentUrl: function() {
			var text_template = this.getView().byId('idTextTemplateTextArea').getValue();
			var input_name_pattern = this.getView().byId('idInputNamePattern').getValue();
			if (input_name_pattern.length % 2 != 0) {
				this.displayErrorMessageBox("Input Name Pattern must be even length!");
				return;
			}
			var input_default_value_pattern = this.getView().byId('idInputDefaultValuePattern').getValue();
			if (input_default_value_pattern.length % 2 != 0) {
				this.displayErrorMessageBox("Input Default Value Pattern must be even length!");
				return;
			}
			var user_input_data = this.getView().byId('idUserInputTable').getModel().getJSON();
			var allow_empty_input_value = "false";
			if (this.getView().byId('idAllowEmptyInputValueCheckBox').getSelected()) {
				allow_empty_input_value = "true";
			}
			var url_param = "textTemplate=" + encodeURIComponent(text_template) + '&inputNamePattern=' + encodeURIComponent(input_name_pattern) + '&inputDefaultValuePattern=' + encodeURIComponent(input_default_value_pattern) + '&userInputData=' + encodeURIComponent(user_input_data) + '&finalOutputGenerated=' + final_output_generated + '&allowEmptyInputValue=' + allow_empty_input_value;
			window.location.hash = "?" + url_param;
			if (url_param.length > 8000) {
				this.displayWarningMessageBox("This link might be too large to share depending on the browser used to load this link!\n\nPlease copy the url on your browser's address bar");
			} else {	
				this.displaySuccessMessageBox("Please copy the url on your browser's address bar");
			}
		},

		setValueFromUrlParams: function(urlParams, var_name, id_name) {
			var temp_param_value = urlParams.get(var_name);
			if (temp_param_value) {
				this.getView().byId(id_name).setValue(temp_param_value);
			} 
		},

		updateDataFromUrl: function() {
			var load_data_from_url = false;
			if (window.location.hash && window.location.hash.length > 1) {
				var temp = window.location.hash.split("?");
				if (temp && temp.length > 1) {
					var queryString = temp[1];
					if (queryString) {
						var urlParams = new URLSearchParams(queryString);
						this.setValueFromUrlParams(urlParams, "textTemplate", "idTextTemplateTextArea");
						this.setValueFromUrlParams(urlParams, "inputNamePattern", "idInputNamePattern");
						this.setValueFromUrlParams(urlParams, "inputDefaultValuePattern", "idInputDefaultValuePattern");
						if (urlParams.get("allowEmptyInputValue") && urlParams.get("allowEmptyInputValue") == "true") {
							this.getView().byId('idAllowEmptyInputValueCheckBox').setSelected(true);
						}
						if (urlParams.get("userInputData")) {
							var oModel = new JSONModel();
							//console.log(urlParams.get("userInputData"));
							//console.log(JSON.parse(urlParams.get("userInputData")));
							oModel.setData(JSON.parse(urlParams.get("userInputData")));
							var oTable = this.getView().byId('idUserInputTable');
							oTable.setModel(oModel);
							this.parseInputNameAndValuePattern();
							if (urlParams.get("finalOutputGenerated") && urlParams.get("finalOutputGenerated") == "true") {
								this.generateFinalOutput();
							}
						}
						load_data_from_url = true;
					}
				}
			}
			if (!load_data_from_url) {
				this.generateUserInput();
			}
		},

		parseInputNameAndValuePattern: function() {
			var input_name_pattern = this.getView().byId('idInputNamePattern').getValue();
			if (input_name_pattern.length % 2 != 0) {
				this.displayErrorMessageBox("Input Name Pattern must be even length!");
				return;
			}
			var length = input_name_pattern.length;
			input_name_begin_char =  input_name_pattern.substring(0, length/2);
			input_name_end_char =  input_name_pattern.substring(length/2, length);

			var input_default_value_pattern = this.getView().byId('idInputDefaultValuePattern').getValue();
			if (input_default_value_pattern.length % 2 != 0) {
				this.displayErrorMessageBox("Input Default Value Pattern must be even length!");
				return;
			}
			length = input_default_value_pattern.length;
			input_default_value_begin_char =  input_default_value_pattern.substring(0, length/2);
			input_default_value_end_char =  input_default_value_pattern.substring(length/2, length);

		},

		parseInputList: function (text_template) {
            var parsed_input_list = [];
            var regex = new RegExp(input_name_begin_char + "(.*?)" + input_name_end_char, "g");
            //console.log(regex);
            var matches = text_template.match(regex);
            //console.log(matches);
            for (let i in matches) {
                var input_name = matches[i].replace(input_name_begin_char, "").replace(input_name_end_char, "");
                if (parsed_input_list.includes(input_name) == false) {
                    parsed_input_list.push(input_name);
                }
            }
            //console.log(parsed_input_list);
            return parsed_input_list;

        },

		generateUserInput: function() {
			this.parseInputNameAndValuePattern();
            var parsed_input_list = this.parseInputList(this.getView().byId('idTextTemplateTextArea').getValue());
			//console.log(parsed_input_list);
            var data = { "input_list": [] };
            for (let i in parsed_input_list) {
                var original_input_name = parsed_input_list[i];
                var input_name = original_input_name;
                var input_value = "";
                if (original_input_name.indexOf(input_default_value_begin_char) > -1 && original_input_name.indexOf(input_default_value_end_char) > -1) {
                    input_name = original_input_name.split(input_default_value_begin_char)[0];
                    input_value = original_input_name.split(input_default_value_begin_char)[1].split(input_default_value_end_char)[0];
                }
                var item = {
                    "input_name": input_name,
                    "input_value": input_value,
                    "original_input_name": original_input_name
                };
                data["input_list"].push(item);
            }
            var oModel = new JSONModel();
            oModel.setData(data);
            var oTable = this.getView().byId('idUserInputTable');
            oTable.setModel(oModel);
			this.getView().byId('idFinalOutputTextArea').setValue("");
			final_output_generated = "false";
			
        },

		

		generateFinalOutput: function() {
			if (!this.getView().byId('idAllowEmptyInputValueCheckBox').getSelected()) {
				if (this.doesEmptyUserInputDataExist()) {
					this.displayErrorMessageBox("Empty Input Value!");
					this.getView().byId('idFinalOutputTextArea').setValue("");
					return;
				}
			}
            var oTable = this.getView().byId('idUserInputTable');
            var oModel = oTable.getModel();
            //console.log(oModel);
            var input_list_data = oModel.oData.input_list;
            //console.log(input_list_data);
            var final_output = this.getView().byId('idTextTemplateTextArea').getValue();
            //console.log(final_output);
            for (let i in input_list_data) {
                var current_input = input_list_data[i];
                final_output = final_output.replaceAll(input_name_begin_char + current_input["original_input_name"] + input_name_end_char, current_input["input_value"]);
            }
            this.getView().byId('idFinalOutputTextArea').setValue(final_output);
			final_output_generated = "true";
        },
		
	});

    return PageController;

});
