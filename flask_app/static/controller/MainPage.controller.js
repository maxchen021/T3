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
	var current_text_template_data_from_url = "";
	var busy_dialog = new sap.m.BusyDialog('busy_dialog', { text: "Please wait ....", title: 'Loading', showCancelButton: true, cancelButtonText: 'Close this dialog' });
	var busy_dialog_opened = false;

	var PageController = Controller.extend("maxchen021.T3.controller.MainPage", {
		onInit: function () {	
			$("#splash-screen").remove();
		},

		onBeforeRendering: function () {
            this.updateDataFromUrl();
        },

		openBusyDialog: function() {
			if (!busy_dialog_opened) {
				busy_dialog.setText("Please wait ....");
				busy_dialog.open();
				busy_dialog_opened = true;
			}
		},

		closeBusyDialog: function() {
			if (busy_dialog_opened) {
				busy_dialog.close();
				busy_dialog_opened = false;
			}
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
			this.closeBusyDialog();
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
			Step 1. Enter your data in the "Text Template" section or enter the url containing the data (You can adjust the "Input Name Pattern" and "Input Default Value Pattern" per your need).\n
			Step 2. Click the "Generate User Input" button to generate the "User Input" section.\n
			Step 3. Complete the "User Input" section or click the "Get Link To Share" button to share it with your user to complete it.\n
			Step 4. Click the "Generate Final Output" button to get the final output in the "Final Output" section (You can also click the "Get Link To Share" button to share all the data).\n
			`;
			this.displaySuccessMessageBox(msg, "How-To");
		},

		doesEmptyUserInputDataExist: function() {
			var oTable = this.getView().byId('idUserInputTable');
            var oModel = oTable.getModel();
            var input_list_data = oModel.oData.input_list;
			for (let i in input_list_data) {
                var current_input = input_list_data[i];
                if (!current_input["input_value"]){
					return true;
				}
            }
			return false;
		},

		compressData: function(data) {
			let u8 = new TextEncoder("utf-8").encode(data);
			const compressedData = pako.deflate(u8);
			let b64 = Base64.fromUint8Array(compressedData, true);
			//console.log(b64);
			return b64;
		},

		decompressData: function(data) {
			let compressedBytes = Base64.toUint8Array(data);
			let result = pako.inflate(compressedBytes);
			let decompressedStr = new TextDecoder("utf-8").decode(result);
			//console.log(decompressedStr);
			return decompressedStr;
		},

		updateCurrentUrl: function() {
			var text_template = this.getView().byId('idTextTemplateTextArea').getValue();
			if (text_template) {
				text_template = this.compressData(text_template);
			}
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
			if (user_input_data) {
				user_input_data = this.compressData(user_input_data);
			}
			var allow_empty_input_value = "false";
			if (this.getView().byId('idAllowEmptyInputValueCheckBox').getSelected()) {
				allow_empty_input_value = "true";
			}
			var url_param = "textTemplate=" + encodeURIComponent(text_template) + '&inputNamePattern=' + encodeURIComponent(input_name_pattern) + '&inputDefaultValuePattern=' + encodeURIComponent(input_default_value_pattern) + '&userInputData=' + encodeURIComponent(user_input_data) + '&finalOutputGenerated=' + final_output_generated + '&allowEmptyInputValue=' + allow_empty_input_value + '&compression=true';
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
						this.openBusyDialog();
						var urlParams = new URLSearchParams(queryString);
						let compression = false;
						if (urlParams.get("compression") && urlParams.get("compression") == "true") {
							compression = true;
						}
						let textTemplate = urlParams.get("textTemplate");
						if (compression && textTemplate) {
							textTemplate = this.decompressData(textTemplate);
						}
						if (textTemplate) {
							this.getView().byId("idTextTemplateTextArea").setValue(textTemplate);
						}
						this.setValueFromUrlParams(urlParams, "inputNamePattern", "idInputNamePattern");
						this.setValueFromUrlParams(urlParams, "inputDefaultValuePattern", "idInputDefaultValuePattern");
						if (urlParams.get("allowEmptyInputValue") && urlParams.get("allowEmptyInputValue") == "true") {
							this.getView().byId('idAllowEmptyInputValueCheckBox').setSelected(true);
						}

						if (textTemplate && textTemplate.startsWith("http")) {
							if (window.location.hostname == "maxchen021.github.io") {
								this.displayErrorMessageBox("Getting data from url is not supported here. Please deploy your own local instance via docker")
								return;
							}
							this.generateUserInput();
						}
						else if (urlParams.get("userInputData")) {
							let userInputData = urlParams.get("userInputData");
							if (compression) {
								userInputData = this.decompressData(userInputData);
							}
							var oModel = new JSONModel();
							oModel.setData(JSON.parse(userInputData));
							var oTable = this.getView().byId('idUserInputTable');
							oTable.setModel(oModel);
							this.parseInputNameAndValuePattern();
							if (urlParams.get("finalOutputGenerated") && urlParams.get("finalOutputGenerated") == "true") {
								this.generateFinalOutput();
							}
						}
						load_data_from_url = true;
						this.closeBusyDialog();
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
            var regex = new RegExp(input_name_begin_char + "([\\s\\S]*?)" + input_name_end_char, "g");
            var matches = text_template.match(regex);
            for (let i in matches) {
                var input_name = matches[i].replace(input_name_begin_char, "").replace(input_name_end_char, "");
                if (parsed_input_list.includes(input_name) == false) {
                    parsed_input_list.push(input_name);
                }
            }
            return parsed_input_list;

        },

		get_text_template_data_from_url: async function (url) {
            let myObject = await fetch("/api/get-data-from-url?url=" + encodeURIComponent(url.trim()));
            let text_template_data = await myObject.text();
			return text_template_data;
		},

		generateUserInput: async function() {
			this.openBusyDialog();
			this.parseInputNameAndValuePattern();
			var text_template_data = this.getView().byId('idTextTemplateTextArea').getValue();
			if (!text_template_data) {
				this.displayErrorMessageBox("'Text Template' section is empty!");
				return;
			}
			if (text_template_data && text_template_data.startsWith("http")) {
				if (window.location.hostname == "maxchen021.github.io") {
					this.displayErrorMessageBox("Getting data from url is not supported here. Please deploy your own local instance via docker")
					return;
				}
				current_text_template_data_from_url	= await this.get_text_template_data_from_url(text_template_data);
				text_template_data = current_text_template_data_from_url;
				if (!text_template_data) {
					this.displayErrorMessageBox("No text template data fetched from url!");
					return;
				}
			}
            var parsed_input_list = this.parseInputList(text_template_data);
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
			this.closeBusyDialog();
        },

		

		generateFinalOutput: function() {
			this.openBusyDialog();
			if (!this.getView().byId('idAllowEmptyInputValueCheckBox').getSelected()) {
				if (this.doesEmptyUserInputDataExist()) {
					this.displayErrorMessageBox("Empty Input Value!");
					this.getView().byId('idFinalOutputTextArea').setValue("");
					return;
				}
			}
            var oTable = this.getView().byId('idUserInputTable');
            var oModel = oTable.getModel();
            var input_list_data = oModel.oData.input_list;
            var final_output = this.getView().byId('idTextTemplateTextArea').getValue();
			if (final_output && final_output.startsWith("http") && current_text_template_data_from_url) {
				final_output = current_text_template_data_from_url;
			}
			if (!final_output) {
				this.displayErrorMessageBox("'Text Template' section is empty!");
				return;
			}
            for (let i in input_list_data) {
                var current_input = input_list_data[i];
                final_output = final_output.replaceAll(input_name_begin_char + current_input["original_input_name"] + input_name_end_char, current_input["input_value"]);
            }
            this.getView().byId('idFinalOutputTextArea').setValue(final_output);
			final_output_generated = "true";
			this.closeBusyDialog();
        },
		
	});

    return PageController;

});
