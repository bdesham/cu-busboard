/* 
 This file was generated by Dashcode and is covered by the 
 license.txt included in the project.  You may edit this file, 
 however it is recommended to first turn off the Dashcode 
 code generator otherwise the changes will be lost.
 */
var dashcodePartSpecs = {
    "arrival_time_text": { "text": "12 min", "view": "DC.Text" },
    "button_look_up_code": { "creationFunction": "CreateButton", "leftImageWidth": 5, "onclick": "button_look_up_code_handler", "rightImageWidth": 5, "text": "Look up my stop code" },
    "button_look_up_code1": { "creationFunction": "CreateButton", "leftImageWidth": 5, "onclick": "animate_back_to_routes", "rightImageWidth": 5, "text": "Choose…" },
    "button_update": { "creationFunction": "CreateButton", "leftImageWidth": 5, "onclick": "button_update_handler", "rightImageWidth": 5, "text": "Get the latest version" },
    "done": { "creationFunction": "CreateGlassButton", "onclick": "animate_back_to_front", "text": "Done" },
    "glassButton": { "creationFunction": "CreateGlassButton", "onclick": "animate_routes_to_back", "text": "Back" },
    "info": { "backgroundStyle": "black", "creationFunction": "CreateInfoButton", "foregroundStyle": "white", "frontID": "front", "onclick": "animate_front_to_back" },
    "list": { "allowsEmptySelection": true, "dataArray": ["Item 8"], "dataSourceName": "test_data", "labelElementId": "route_text", "listStyle": "List.DESKTOP_LIST", "sampleRows": 3, "view": "DC.List" },
    "route_text": { "text": "Item", "view": "DC.Text" },
    "scrollArea": { "autoHideScrollbars": true, "creationFunction": "CreateScrollArea", "hasVerticalScrollbar": true, "scrollbarDivSize": 18, "scrollbarMargin": 6, "spacing": 4 },
    "status_text": { "text": "Data provided by CUMTD", "view": "DC.Text" },
    "text_author": { "text": "Benjamin Esham, © 2011", "view": "DC.Text" },
    "text_code_explanation": { "text": "Enter the four-digit code for your stop.", "view": "DC.Text" },
    "text_lookahead": { "text": "Look ahead:", "view": "DC.Text" },
    "text_lookahead1": { "text": "Show only certain routes:", "view": "DC.Text" },
    "text_message": { "text": "Loading…", "view": "DC.Text" },
    "text_stop_label": { "text": "Your bus stop:", "view": "DC.Text" },
    "text_stop_label1": { "text": "Routes to show:", "view": "DC.Text" },
    "text_thanks": { "text": "Data provided by CUMTD", "view": "DC.Text" },
    "text_version": { "text": "CU Buses <version>", "view": "DC.Text" },
    "top_text": { "text": "CU Buses", "view": "DC.Text" }
};














