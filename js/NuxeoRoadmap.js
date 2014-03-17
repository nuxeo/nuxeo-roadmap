	 //remove from the JSON structure the versions that have archived=true or that doesn't start by LTS or FT
	function filterOutUselessVersions(jSONData) {
	    var filteredData = new Array();
	    var j = 0;
	    for (i = 0; i < jSONData.length; i++) {

	        if (!jSONData[i].archived && (jSONData[i].name.indexOf("LTS") == 0 || jSONData[i].name.indexOf("FT") == 0)) {

	            if (!jSONData[i].name.s)
	                filteredData[j] = jSONData[i];
	            j++

	        }

	    }
	    return filteredData;

	}

	function reverseArrayOrder(jSONData) {
	    var reversedOrder = new Array();
	    var j = 0;
	    for (i = jSONData.length; i > 1; i--) {
	        reversedOrder[j] = jSONData[i - 1];
	        j++;

	    }
	    return reversedOrder;
	}

	function getListOfVersionIds(jSONData) {
	    var listOfIds = new Array();
	    for (i = 0; i < jSONData.length; i++) {

	        listOfIds[i] = jSONData[i].id;

	    }
	    return listOfIds;

	}



	function formatDate(dateToFormat) {
	    var theDate = new Date(dateToFormat);
	    return theDate.toDateString();

	}

	function formatVersions(jSONVersions) {

	    var htmlOutput = "<ul id=\"myTab\" class=\"nav nav-tabs\">";
	    var currentVersion = true;
	    var nextCurrentVersion = false;
	    var currentReleaseIndex;
	    for (i = 0; i < jSONVersions.length; i++) {
	        var panelClass = "alert alert-warning";
	        var classAttribute = "";
	        if (nextCurrentVersion) {
	            panelClass = "alert alert-info";
	            nextCurrentVersion = false;
                    currentReleaseIndex = i;
	        }
	        if (jSONVersions[i].released) {
	            currentVersion = false;
	            nextCurrentVersion = true;
	            panelClass = "alert alert-success";
	        }
	        classAttribute = "class=\"" + panelClass + "\"";
                var icon ="";
                if (jSONVersions[i].name.indexOf("LTS") == 0 ) {
                   icon = "<img src='img/lts.png'/>";
	        } else if (jSONVersions[i].name.indexOf("FT") == 0 ) {
                    icon = "<img src='img/ft.png'/>";
                }
	        htmlOutput = htmlOutput + "\
            <li " + classAttribute + " ><a href=\"#version-" + jSONVersions[i].id + "\" data-toggle=\"tab\">" + icon + jSONVersions[i].name + " <br/>(" + formatDate(jSONVersions[i].releaseDate) + ")</a>";
            }
	    htmlOutput = htmlOutput + "</li></ul>";
	    htmlOutput += "<div id=\"myTabContent\"class=\"tab-content \">";

	    for (i = 0; i < jSONVersions.length; i++) {
	        if (i == currentReleaseIndex) {
	            htmlOutput = htmlOutput + " <div class=\"tab-pane fade in active\" id=\"version-" + jSONVersions[i].id + "\"></div>"
	        } else {
	            htmlOutput = htmlOutput + " <div class=\"tab-pane fade \" id=\"version-" + jSONVersions[i].id + "\"></div>"
	        }
	    }


	    htmlOutput += "</div>";
	    console.log(htmlOutput);

	    return htmlOutput;

	}

	function formatRoadmapItemsList(roadmapItemsList) {
	    var result = "";


	    //summary
	    result = "<div class=\"panel-group\" id=\"accordion\">";
	    for (i = 0; i < roadmapItemsList.length; i++) {


	        var roadmapItem;
	        var roadmapItemState;
	        roadmapItem = roadmapItemsList[i];
	        isRoadmapItemResolved = false;
	        if (roadmapItem.fields.resolution !== null && roadmapItem.fields.resolution.name == "Fixed") {
	            isRoadmapItemResolved = true;
	        };

	        menuItem = "<div class=\"panel panel-default\"> <div class=\"panel-heading\"> <h4 class=\"panel-title\">";
	        if (isRoadmapItemResolved) {
	            menuItem += "<span class=\"glyphicon glyphicon-check\"></span> ";
	        } else {
	            menuItem += "<span class=\"glyphicon glyphicon-unchecked\"></span> ";
	        };
	        //menuItem+= "<a data-toggle=\"\" data-parent=\"#accordion\" href=\"#item-"+roadmapItem.id+"\">";
	        menuItem += roadmapItem.fields.summary;
	        menuItem += generateAvailabeIcons(roadmapItem);
	        menuItem += "</div>";
	        menuItem += "<div class=\"panel-body\">";

	        menuItem += "<p>";
	        menuItem += roadmapItem.fields.description;
	        menuItem += "</p></div></div>";
	        result = result + menuItem;
	    }
	    result = result + "</div>";
	    return result;
	}

	function generateAvailabeIcons(roadmapItem) {

	    var blogpost = roadmapItem.fields.customfield_10904;
	    var sources = roadmapItem.fields.customfield_10902;
	    var install = roadmapItem.fields.customfield_10901;
	    var dev = roadmapItem.fields.customfield_10899;
	    var user_doc = roadmapItem.fields.customfield_10900;
	    var video = roadmapItem.fields.customfield_10903;
	    var jira = "http://jira.nuxeo.com/browse/" + roadmapItem.key;
	    console.log(roadmapItem);



	    icons = "<div class=\"btn-group pull-right\">";
	    icons += sources != null ? "<a target =\"_blank\" title=\"Link to sources\" href=\"" + sources + "\"><span class=\"glyphicon glyphicon-eye-open\"></span></a>" : "";
	    icons += video != null ? "<a target =\"_blank\" title=\"Link to a video\" href=\"" + video + "\"><span class=\"glyphicon glyphicon-film\"></span></a>" : "";
	    icons += dev != null ? "<a target =\"_blank\" title=\"Link to the developper documentation\" href=\"" + dev + "\"><span class=\"glyphicon glyphicon-book\"></span></a>" : "";
	    icons += user_doc != null ? "<a target =\"_blank\" title=\"Link to the user documentation\" href=\"" + user_doc + "\"><span class=\"glyphicon glyphicon-book\"></span></a>" : "";
	    icons += install != null ? "<a target =\"_blank\" title=\"Link to the install/setup documentation\" href=\"" + install + "\"><span class=\"glyphicon glyphicon-book\"></span></a>" : "";
	    icons += blogpost != null ? "<a target =\"_blank\" title=\"Link to a related blogpost\" href=\"" + dev + "\"><span class=\"glyphicon glyphicon-align-left\"></span></a>" : "";
	    icons += "<a target =\"_blank\" title=\"View/Edit on JIRA\" href=\"" + jira + "\"><span class=\"glyphicon glyphicon-edit\"></span></a>";


	    icons += "</div>";
	    return icons;


	}
