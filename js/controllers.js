/**
 * controller
 */

angular.module("DPFMA.controllers", [])

///////////////////////////////
// Global controller

.controller("DPFMAcontroller", ["$scope", "$location", "$apiConnector", "$global", "$db", function($scope, $location, $apiConnector, $global, $db){
	/////////////////////////////
	//// DB
	$db.init($scope);
	$db.tbl = $db.dbInfo().tables;
	
	///////////////////////////////
	//// init App DATA

	// get Label info
	$apiConnector.getData($scope,
		"GET",
		"labels",
		{}, 
		function(response){
			$__DATA.labels = {};
			response = response.Labels.Label;
			for(var i = 0; i < response.length; i++){
				var pattern = response[i].refLabel.replace(/ /g, "_");
				eval("\
					$__DATA.labels." + pattern + "_en = '" + response[i].langLabel + "';\
					$__DATA.labels." + pattern + " = '" + response[i].refLabel + "';\
				");
			/*	eval("\
					$__DATA.labels." + pattern + " = '" + response[i].langLabel + "';\
					$__DATA.labels." + pattern + "_en = '" + response[i].refLabel + "';\
				");*/
			}

			$scope.labels = $__DATA.labels;
			return;
		}
	);

	// get Clinical info
	$apiConnector.getData($scope,
		"GET",
		"clinical",
		{}, 
		function(response){
			$scope.ClinicalCodes = response.ClinicalCodes;
			return;
		}
	);

	// get Patients info
	$apiConnector.getData($scope,
		"GET",
		"patients",
		{}, 
		function(response){
			$scope.Patients = [];
			angular.forEach(response.Patients.Patient, function(p){
				p.ID = $global.createID();
				if(p.birthDate){
					p.birthDate_l = p.birthDate;
					p.birthDate_v = moment(p.birthDate, "DD/MM/YYYY").format("YYYY-MM-DD");
				} else {
					p.birthDate_v = "";
					p.birthDate_l = "";
				}
				$scope.Patients.push(p);
			});

			return;
		}
	);

	// get Settings info
	$apiConnector.getData($scope,
		"GET",
		"settings",
		{}, 
		function(response){
			$__DATA.prescriber = response.Settings.Prescriber;
			return;
		}
	);

	// get Analyses info
	$apiConnector.getData($scope,
		"GET",
		"analyses",
		{}, 
		function(response){
			$__DATA.analyses = response.Daf;
			return;
		}
	);


	//////////////////////////////////
	//// Global Actions

	// Sign Out
	$scope.signOut = function(){
		$global.messageBox("Are you sure you want to Sign Out?", "confirm", function(){
			$scope.$apply(function(){
				$scope.SigninUserName = "";
				$scope.SigninUserOrganization = "";

				$location.path("/");
			});
		});
	};

	// init clinical array
	$scope.initClinical = function(currentClinical){
		if(currentClinical){
			var fixedClinicalCodes = [];
			angular.forEach($scope.ClinicalCodes, function(p_c){
				var addedFlag = false;
				angular.forEach(currentClinical, function(c_c){
					if(p_c.cliCode == c_c.cliCode){
						addedFlag = true;
					}
				});

				if(!addedFlag){
					fixedClinicalCodes.push(p_c);
				}
			});
			return fixedClinicalCodes;
		} else {
			return $scope.ClinicalCodes;
		};
	};

	//////
}])

// Sign in Page Controller
.controller("SigninController", ["$scope", "$route", "$location", "$apiConnector", "$global", function($scope, $route, $location, $apiConnector, $global){	
	
	/////////////////////////////////////
	//// Actions
	
	// check UserName field by "Enter" keyup event
	$scope.enterUserName = function(e){
		if(e && e.keyCode == 13){
			if($scope.UserName){
				$scope.Password = "";
				$scope.focusPassword = true;
			}
		}
	};
	
	// check Password field by "Enter" keyup event
	$scope.enterPassword = function(e){
		if(e && e.keyCode == 13){
			$scope.focusPassword = false;
			$scope.SignIn();
		}
	};

	// Sign in
	$scope.SignIn = function(){
		// confirm UserName field
		if(!$scope.UserName || $__DATA.prescriber.user != $scope.UserName){
			$global.messageBox("Please enter " + $scope.labels.UserName + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$scope.UserName = "";
					$scope.focusUserName = true;
				});
			});
			return;
		}

		// confirm Password field
		if(!$scope.Password || $__DATA.prescriber.password != $scope.Password){
			$global.messageBox("Please enter " + $scope.labels.Password + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$scope.Password = "";
					$scope.focusPassword = true;
				});
			});
			return;
		}
		
		// buffering User Detail info
		angular.forEach($__DATA.prescriber.Accounts.Account, function(a){
			if(a.default == "YES"){
				$__DATA.prescriber.Accounts.default = a;
			}
		});
		
		// setup header text
		$scope.$parent.SigninUserName = $__DATA.prescriber.name + " " + $__DATA.prescriber.fName.substring(0, 1);
		$scope.$parent.SigninUserOrganization = $__DATA.prescriber.Accounts.default.organisation;

		// redirect first work page(Welcome page)
		$location.path("/welcome");
	};

	//////
}])

// Welcome Page Controller
.controller("WelcomeController", ["$scope", "$route", "$location", "$apiConnector", "$global", function($scope, $route, $location, $apiConnector, $global){
}])

// Patient List Page Controller
.controller("PatientListController", ["$scope", "$route", "$location", "$apiConnector", "$global", "$db", function($scope, $route, $location, $apiConnector, $global, $db){
	
	/////////////////////////////////////
	//// init form
	
	// init datepicker fields
	$global.datePicker("patBirthDate", $scope);
	
	// create pageination
	$scope.currentPage = 1;
	$scope.maxSize = 3;
	$scope.itemsPerPage = 10;	
	
	///////////////////////////////
	///// Actions

	// init selected info
	$scope.initPatient = function(){
		$scope.focus = {};
		$scope.newPatientFlag = true;

		$scope.selPatient = {
			ID:					"",
			name:				"",
			fName:				"",
			rrn:				"",
			socialSecurityNbr:	"",
			gender:				"",
			birthDate:			"",
			street:				"",
			zip:				"",
			city:				"",
			tel:				"",
			gcm:				"",
			email:				"",
			clinicals:			[],
			addtionalRemarks:	""
		};

		$scope.view_ClinicalCodes = $scope.$parent.initClinical();
	};
	$scope.initPatient();

	// select patient from patients list
	$scope.selectPatient = function(pID){
		angular.forEach($scope.$parent.Patients, function(p){
			if(p.ID == pID){
				// get selected patient info
				$scope.selPatient = p;
				$scope.selPatient.clinicals = $scope.selPatient.clinicals? $scope.selPatient.clinicals: [];
				$scope.selPatient.birthDate_v = $scope.selPatient.birthDate? moment($scope.selPatient.birthDate).format("YYYY-MM-DD"): "";
				
				// init form by selected patient info
				$scope.newPatientFlag = false;
				$scope.view_ClinicalCodes = $scope.$parent.initClinical($scope.selPatient.clinicals);
			}
		});
	};

	// add new clinical to clinical list of selected Patient
	$scope.addClinical = function(){
		if($scope.newClinical){			
			$scope.selPatient.clinicals.push($scope.newClinical);
			$scope.view_ClinicalCodes = $scope.$parent.initClinical($scope.selPatient.clinicals);
		} else {
			$global.messageBox("Please select " + $scope.labels.Clinical_Patients + ".", "alert", function(){
				$scope.$apply(function(){
					$scope.focus.newClinical = true;
				});
			});
		}		
		$scope.newClinical = "";
	};
	
	// remove selected clinical from clinical list of selected Patient
	$scope.deleteClinical = function(i){
		$scope.selPatient.clinicals.splice(i, 1);
		$scope.view_ClinicalCodes = $scope.$parent.initClinical($scope.selPatient.clinicals);
	}
	
	// clean up form for creating new patient
	$scope.createNewForm = function(i){
		$scope.initPatient();
	};

	////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////
	// validate form
	var validation = function(){
		// validation name field
		if(!$scope.selPatient.name){
			$global.messageBox("Please enter " + $scope.labels.Name + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$scope.focus.name = true;
				});
			});
			return;
		}

		// validation first name field
		if(!$scope.selPatient.fName){
			$global.messageBox("Please enter " + $scope.labels.FirstName + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$scope.focus.fName = true;
				});
			});
			return;
		}

		// validation RRN field
		if(!$scope.selPatient.rrn){
			$global.messageBox("Please enter " + $scope.labels.RRN + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$scope.focus.rrn = true;
				});
			});
			return;
		}

		// validation security number field
		if(!$scope.selPatient.socialSecurityNbr){
			$global.messageBox("Please enter " + $scope.labels.Social_Sec_Number + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$scope.focus.socialSecurityNbr = true;
				});
			});
			return;
		}

		// validation gender field
		if(!$scope.selPatient.gender){
			$global.messageBox("Please enter " + $scope.labels.Gender + " correctly.");
			return;
		}

		// validation birthday field
		if(!$scope.selPatient.birthDate || moment($scope.selPatient.birthDate).format() >= moment(new Date()).format()){
			$global.messageBox("Please enter " + $scope.labels.Birthday + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$scope.focus.birthDate = true;
				});
			});
			return;
		}

		// validation Street field
		if(!$scope.selPatient.street){
			$global.messageBox("Please enter " + $scope.labels.Street + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$scope.focus.street = true;
				});
			});
			return;
		}

		// validation Zip field
		if(!$scope.selPatient.zip){
			$global.messageBox("Please enter " + $scope.labels.Zip + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$scope.focus.zip = true;
				});
			});
			return;
		}

		// validation City field
		if(!$scope.selPatient.city){
			$global.messageBox("Please enter " + $scope.labels.City + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$scope.focus.city = true;
				});
			});
			return;
		}

		// validation Phone field
		if(!$scope.selPatient.tel || isNaN($scope.selPatient.tel)){
			$global.messageBox("Please enter " + $scope.labels.Phone + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$scope.selPatient.tel = "";
					$scope.focus.tel = true;
				});
			});
			return;
		}

		// validation Mobile Phone field
		if(!$scope.selPatient.gcm || isNaN($scope.selPatient.gcm)){
			$global.messageBox("Please enter " + $scope.labels.Mobile + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$scope.selPatient.gcm = "";
					$scope.focus.gcm = true;
				});
			});
			return;
		}

		// validation eMail field
		if(!$scope.selPatient.email){
			$global.messageBox("Please enter " + $scope.labels.eMail + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$scope.selPatient.email = "";
					$scope.focus.email = true;
				});
			});
			return;
		}
		
		// return validated data
		return {
			ID:					$scope.selPatient.ID? $scope.selPatient.ID: $global.createID(),
			name:				$scope.selPatient.name,
			fName:				$scope.selPatient.fName,
			rrn:				$scope.selPatient.rrn,
			socialSecurityNbr:	$scope.selPatient.socialSecurityNbr,
			gender:				$scope.selPatient.gender,
			birthDate:			moment($scope.selPatient.birthDate).format(),
			birthDate_v:		moment($scope.selPatient.birthDate).format("YYYY-MM-DD"),
			birthDate_l:		moment($scope.selPatient.birthDate).format("DD/MM/YYYY"),
			street:				$scope.selPatient.street,
			zip:				$scope.selPatient.zip,
			city:				$scope.selPatient.city,
			tel:				$scope.selPatient.tel,
			gcm:				$scope.selPatient.gcm,
			email:				$scope.selPatient.email,
			clinicals:			$scope.selPatient.clinicals,
			addtionalRemarks:	$scope.selPatient.addtionalRemarks
		};
	};
	
	// save new Patient
	$scope.createNewPatient = function(){
		var newP = validation();
		if(!newP){
			return;
		}

		$global.messageBox("Are you sure you want to create this patient?", "confirm", function(){
			$scope.$apply(function(){
				// add new patient to DB
				var db_field = $db.tbl.patient.fields;			
				console.log("INSERT INTO " + $db.tbl.patient.name + " (" + db_field.id + ", " + db_field.data + ", " + db_field.date + ") VALUES ('" + $global.createID() + "', '" + JSON.stringify(newP) + "', '" + moment().format() + "');");
				
				// add new patient to $scope array
				$scope.$parent.Patients.push(newP);
				
				// init form
				$scope.initPatient();
				
				// alert message
				$global.messageBox("Created new Patient info successfully!");
			});
		});
		return;
	};
	
	// update Patient
	$scope.updateSelectedPatient = function(){
		var updateP = validation();
		if(!updateP){
			return;
		}
		
		/////
		var db_field = $db.tbl.patient.fields;			
		console.log("UPDATE " + $db.tbl.patient.name + " SET " + db_field.data + " = '" + JSON.stringify(updateP) + "', " + db_field.date + " = '" + moment().format() + "' WHERE " + db_field.id + " = '" + $scope.selPatient.ID + "';");

		angular.forEach($scope.$parent.Patients, function(p, $index){
			if(p.ID == $scope.selPatient.ID){
				$scope.$parent.Patients[$index] = updateP;
				
				// alert message
				$global.messageBox("Updated selected Patient info successfully!");
			}
		});
		return;
	};
	
	// delete selected patient from patients list
	$scope.deleteSelectedPatient = function(){
		angular.forEach($scope.$parent.Patients, function(p, $index){
			if(p.ID == $scope.selPatient.ID){
				$global.messageBox("Are you sure you want to delete selected Patient.", "confirm", function(){
					$scope.$apply(function(){

						// delete patient from DB
						var db_field = $db.tbl.patient.fields;
						console.log("DELETE FROM " + $db.tbl.patient.name + " WHERE " + db_field.id + " = '" + $scope.selPatient.ID + "';");

						// delte patient from array
						$scope.$parent.Patients.splice($index, 1);

						// init form
						$scope.initPatient();
						
						// alert message
						$global.messageBox("Deleted selected Patient info successfully!");
					});
				});
			}
		});		
	};
}])

// Requested analyses Page Controller
.controller("RequestController", ["$scope", "$route", "$location", "$apiConnector", "$global", function($scope, $route, $location, $apiConnector, $global){
	// init form
	$global.datePicker("patBirthday", $scope);
	$global.datePicker("reqRequest_Date", $scope);
	$global.datePicker("reqSample_Date", $scope);

	////////
	$scope.patClinicals = [];
	$scope.reqPatients = [];

	$scope.selectedPatientID = typeof($route.current.params.p_id) == "undefined"? null: $route.current.params.p_id;
	if($scope.selectedPatientID){
		angular.forEach($__DATA.patients, function(p){
			if(p.ID == $scope.selectedPatientID){
				$scope.patName = p.name;
				$scope.patFirstName = p.fName;
				$scope.patRRN = p.rrn;
				$scope.patSocial_Sec_Number = p.socialSecurityNbr
				$scope.patGender = p.gender;
				$scope.patBirthday = p.birthDate;
				$scope.patStreet = p.street;
				$scope.patZip = p.zip;
				$scope.patCity = p.city;
				$scope.patPhone = p.tel;
				$scope.patMobile = p.gcm;
				$scope.patEmail = p.email;
				$scope.patClinicals = p.clinicals? p.clinicals: [];
				$scope.patAddtionalRemarks = p.addtionalRemarks;
			}
		});
	}
	
	// Actions
	$scope.addClinical = function(){
		if($scope.newClinical && $scope.patClinicals.indexOf($scope.newClinical) == -1){			
			$scope.patClinicals.push($scope.newClinical);
		} else {
			$global.messageBox("Please enter " + $scope.labels.Clinical_Patients + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=newClinical]").focus();
				});
			});
		}		
		$scope.newClinical = "";
	}

	$scope.deleteClinical = function(i){
		$scope.patClinicals.splice(i, 1);
	}

	// Actions
	$scope.addReqPatients = function(){
		if($scope.newReqPatient && $scope.reqPatients.indexOf($scope.newReqPatient) == -1){			
			$scope.reqPatients.push($scope.newReqPatient);
		} else {
			$global.messageBox("Please enter " + $scope.labels.Copies + " - " + $scope.labels.Patients + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=newReqPatient]").focus();
				});
			});
		}		
		$scope.newReqPatient = "";
	}

	$scope.deleteReqPatients = function(i){
		$scope.reqPatients.splice(i, 1);
	}

	//////////
	var validation = function(){
		// validation name field
		if(!$scope.patName){
			$global.messageBox("Please enter " + $scope.labels.Name + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=patName]").focus();
				});
			});
			return;
		}

		// validation first name field
		if(!$scope.patFirstName){
			$global.messageBox("Please enter " + $scope.labels.FirstName + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=patFirstName]").focus();
				});
			});
			return;
		}

		// validation RRN field
		if(!$scope.patRRN || isNaN($scope.patRRN)){
			$global.messageBox("Please enter " + $scope.labels.RRN + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$scope.patRRN = "";
					$("[ng-model=patRRN]").val("").focus();
				});
			});
			return;
		}

		// validation security number field
		if(!$scope.patSocial_Sec_Number){
			$global.messageBox("Please enter " + $scope.labels.Social_Sec_Number + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=patSocial_Sec_Number]").focus();
				});
			});
			return;
		}

		// validation gender field
		if(!$scope.patGender){
			$global.messageBox("Please enter " + $scope.labels.Gender + " correctly.");
			return;
		}

		// validation birthday field
		if(window.innerWidth <= 700 && (!$scope.patBirthday_M || moment($scope.patBirthday_M).format() >= moment(new Date()).format())){
			$global.messageBox("Please enter " + $scope.labels.Birthday + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=patBirthday_M]").val("").focus();
				});
			});
			return;
		}
		if(window.innerWidth > 700 && (!$scope.patBirthday || moment($scope.patBirthday).format() >= moment(new Date()).format())){
			$global.messageBox("Please enter " + $scope.labels.Birthday + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=patBirthday]").val("").focus();
				});
			});
			return;
		}

		// validation Street field
		if(!$scope.patStreet){
			$global.messageBox("Please enter " + $scope.labels.Street + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=patStreet]").focus();
				});
			});
			return;
		}

		// validation Zip field
		if(!$scope.patZip){
			$global.messageBox("Please enter " + $scope.labels.Zip + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=patZip]").focus();
				});
			});
			return;
		}

		// validation City field
		if(!$scope.patCity){
			$global.messageBox("Please enter " + $scope.labels.City + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=patCity]").focus();
				});
			});
			return;
		}

		// validation Phone field
		if(!$scope.patPhone || isNaN($scope.patPhone)){
			$global.messageBox("Please enter " + $scope.labels.Phone + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=patPhone]").val("").focus();
				});
			});
			return;
		}

		// validation Mobile Phone field
		if(!$scope.patMobile || isNaN($scope.patMobile)){
			$global.messageBox("Please enter " + $scope.labels.Mobile + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=patMobile]").val("").focus();
				});
			});
			return;
		}

		// validation eMail field
		if(!$scope.patEmail){
			$global.messageBox("Please enter " + $scope.labels.eMail + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=patEmail]").val("").focus();
				});
			});
			return;
		}

		// validation Request Date field
		if(!$scope.reqRequest_Date_M && window.innerWidth <= 700){
			$global.messageBox("Please enter " + $scope.labels.Request_Date + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=reqRequest_Date_M]").focus();
				});
			});
			return;
		}
		if(!$scope.reqRequest_Date && window.innerWidth > 700){
			$global.messageBox("Please enter " + $scope.labels.Request_Date + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=reqRequest_Date]").focus();
				});
			});
			return;
		}
		
		// validation Sample Date field
		if(!$scope.reqSample_Date_M && window.innerWidth <= 700){
			$global.messageBox("Please enter " + $scope.labels.Sample_Date + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=reqSample_Date_M]").focus();
				});
			});
			return;
		}
		if(!$scope.reqSample_Date && window.innerWidth > 700){
			$global.messageBox("Please enter " + $scope.labels.Sample_Date + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=reqSample_Date]").focus();
				});
			});
			return;
		}

		// validation Urgent field
		if(!$scope.reqUrgent){
			$global.messageBox("Please enter " + $scope.labels.Urgent + " correctly.");
			return;
		}

		// validation Extra Copies field
		if(isNaN($scope.reqExtra_Copies) || parseInt($scope.reqExtra_Copies) < 0){
			$global.messageBox("Please enter " + $scope.labels.Extra_Copies + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=reqExtra_Copies]").val("").focus();
				});
			});
			return;
		}

		// validation Remarks field
		if(!$scope.reqRemarks){
			$global.messageBox("Please enter " + $scope.labels.Remarks + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=reqRemarks]").focus();
				});
			});
			return;
		}

		return {
			ID:					$scope.selectedPatientID? $scope.selectedPatientID: $global.createID(),
			name:				$scope.patName,
			fName:				$scope.patFirstName,
			rrn:				$scope.patRRN,
			socialSecurityNbr: $scope.patSocial_Sec_Number,
			gender:				$scope.patGender,
			birthDate:			(window.innerWidth > 700? moment($scope.patBirthday).format(): moment($scope.patBirthday_M).format()),
			street:				$scope.patStreet,
			zip:				$scope.patZip,
			city:				$scope.patCity,
			tel:				$scope.patPhone,
			gcm:				$scope.patMobile,
			email:				$scope.patEmail,
			clinicals:			$scope.patClinicals,
			addtionalRemarks:	$scope.patAddtionalRemarks,
			
			reqRequestDate:		(window.innerWidth > 700? moment($scope.reqRequest_Date).format(): moment($scope.reqRequest_Date_M).format()),
			reqSampleDate:		(window.innerWidth > 700? moment($scope.reqSample_Date).format(): moment($scope.reqSample_Date_M).format()),
			reqUrgent:			$scope.reqUrgent,
			reqPatientCopy:		$scope.reqPatient_Copy,
			reqExtraCopies:		$scope.reqExtra_Copies,
			reqRemarks:			$scope.reqRemarks
		};
	};
	
	// update Patient/Request Info
	$scope.saveRequestInfo = function(){$scope.detailFlag = false;return;
		var patient = validation();
		if(!patient){
			return;
		}

		$global.messageBox("Are you sure you want to update this patient?", "confirm", function(){
			var db_field = $db.tbl.patient.fields;			
			console.log("UPDATE " + $db.tbl.patient.name + " SET " + db_field.data + " = '" + JSON.stringify(patient) + "', " + db_field.date + " = '" + moment().format() + "' WHERE " + db_field.id + " = '" + $scope.selectedPatientID + "';");

			angular.forEach($__DATA.patients, function(p, $index){
				if(p.ID == $scope.selectedPatientID){
					$__DATA.patients[$index] = patient;
				}
			});
			
			// redirect
			$scope.$apply(function(){
				$location.path("patients");
			});
		});
		return;
	};

	//////////////
	
	// get code items from Group Object
	$scope.getCodeItems = function(G, P, C){
		if(!G.Codes){
			return false;
		}

		////
		G.Codes.Code = G.Codes.Code.length? G.Codes.Code: [G.Codes.Code];
		
		angular.forEach(G.Codes.Code, function(cObj){
			$scope.codesList.push({
				type: "code",
				ChapterDescription: C.ChapterDescription,
				PartDescription: P.PartDescription,
				GroupDescription: G.GroupDescription,
				code: cObj.Code,
				longText: cObj.CodingSystem,
				finalPaymentType: cObj.PaymentType,
				isChecked: false,
				children: cObj.children,
				paymentType: cObj.PaymentType,
				matrix: cObj.Matrix,
				price: cObj.Price,
				description: cObj.Description
			});
		});
	};
	
	// get group items from Part Object
	$scope.getGroupItems = function(P, C){
		if(!P.Groups){
			return false;
		}

		////
		P.Groups.Group = P.Groups.Group.length? P.Groups.Group: [P.Groups.Group];

		angular.forEach(P.Groups.Group, function(G){
			if(G.GroupDescription){
				$scope.codesList.push({
					type: "group",
					description: G.GroupDescription
				});
			}
			
			
			$scope.getCodeItems(G, P, C);
		});
	};
	
	// get Part items from Chapter Object
	$scope.getPartItems = function(C){
		if(!C.Parts){
			return false;
		}

		////
		C.Parts.Part = C.Parts.Part.length? C.Parts.Part: [C.Parts.Part];

		angular.forEach(C.Parts.Part, function(P){
			$scope.codesList.push({
				type: "part",
				description: (P.PartDescription? P.PartDescription: "Part(No Name)")
			});

			$scope.getGroupItems(P, C);
		});
	};
	
	////
	$scope.tabs = [];
	$scope.codesByChapter = [];

	// create tabs
	angular.forEach($__DATA.analyses.Chapters.Chapter, function(C){
		$scope.tabs.push(C.ChapterDescription);
		
		////
		$scope.codesList = [];
		$scope.getPartItems(C);
		$scope.codesByChapter[C.ChapterDescription] = $scope.codesList;
	});
	
	////////////////
	// change Code list when selected Tab
	$scope.selectTab = function(t){
		angular.forEach($__DATA.analyses.Chapters.Chapter, function(C){
			if(t == C.ChapterDescription){
				$scope.items = $scope.codesByChapter[C.ChapterDescription];
			}
		});
	};
	// display Code itemd by default tab (first Chapter)
	$scope.selectTab($__DATA.analyses.Chapters.Chapter[0].ChapterDescription);

	///////////////////
	$scope.saveAnalyses = function(){		
		angular.forEach($scope.codesByChapter, function(C){console.log(C);
			angular.forEach(C, function(i){
				if(i.isChecked){
					console.log(i);
				}
			});
		});
		
	};
}])

// Prescriber Page Controller
.controller("PrescriberController", ["$scope", "$route", "$location", "$apiConnector", "$global", function($scope, $route, $location, $apiConnector, $global){
	//////////
	$scope.savePrescriber = function(){
		// validation name field
		if(!$scope.presName){
			$global.messageBox("Please enter " + $scope.labels.Name + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=presName]").focus();
				});
			});
			return;
		}
		
		// validation first name field
		if(!$scope.presFirstName){
			$global.messageBox("Please enter " + $scope.labels.FirstName + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=presFirstName]").focus();
				});
			});
			return;
		}
		
		// validation RIZIV field
		if(!$scope.presRIZIV){
			$global.messageBox("Please enter " + $scope.labels.RIZIV + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=presRIZIV]").focus();
				});
			});
			return;
		}
		
		// validation Our Reference field
		if(!$scope.presOur_Reference){
			$global.messageBox("Please enter " + $scope.labels.Our_Reference + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=presOur_Reference]").focus();
				});
			});
			return;
		}
		
		// validation Address Street field
		if(!$scope.presStreet){
			$global.messageBox("Please enter " + $scope.labels.Street + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=presStreet]").focus();
				});
			});
			return;
		}
		
		// validation Address Zip field
		if(!$scope.presZip){
			$global.messageBox("Please enter " + $scope.labels.Zip + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=presZip]").focus();
				});
			});
			return;
		}
		
		// validation Address City field
		if(!$scope.presCity){
			$global.messageBox("Please enter " + $scope.labels.City + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=presCity]").focus();
				});
			});
			return;
		}
		
		// validation Phone field
		if(!$scope.presPhone || isNaN($scope.presPhone)){
			$global.messageBox("Please enter " + $scope.labels.Phone + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=presPhone]").val("").focus();
				});
			});
			return;
		}
		
		// validation Mobile Phone field
		if(!$scope.presMobile || isNaN($scope.presMobile)){
			$global.messageBox("Please enter " + $scope.labels.Mobile + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=presMobile]").val("").focus();
				});
			});
			return;
		}
		
		// validation eMail field
		if(!$scope.presEmail){
			$global.messageBox("Please enter " + $scope.labels.eMail + " correctly.", "alert", function(){
				$scope.$apply(function(){
					$("[ng-model=presEmail]").val("").focus();
				});
			});
			return;
		}
		
		/////
		$scope.newPrescriber = {
			presName: $scope.presName,
			presFirstName: $scope.presFirstName,
			presRIZIV: $scope.presRIZIV,
			presOurReference: $scope.presOur_Reference,
			presStreet: $scope.presStreet,
			presZip: $scope.presZip,
			presCity: $scope.presCity,
			presPhone: $scope.presPhone,
			presMobile: $scope.presMobile,
			presEmail: $scope.presEmail
		};

		console.log($scope.newPrescriber);
	};
}])


// Processing Page Controller
.controller("ProcessingController", ["$scope", "$route", "$location", "$apiConnector", "$global", function($scope, $route, $location, $apiConnector, $global){
	/////////
	$scope.processData = [
		{date: "18.07.2014", patient: "patient1", action: "PRINT"},	
		{date: "19.07.2014", patient: "patient2", action: "SEND"},	
		{date: "19.07.2014", patient: "patient32111", action: "SEND"},	
		{date: "19.07.2014", patient: "ppatient42111", action: "SEND"},	
		{date: "19.07.2014", patient: "ppatient52111", action: "SEND"},	
		{date: "19.07.2014", patient: "ppatient62111", action: "SEND"},	
		{date: "19.07.2014", patient: "ppatient72111", action: "SEND"},	
		{date: "19.07.2014", patient: "pppatient82111", action: "SEND"},	
		{date: "19.07.2014", patient: "pppatient92111", action: "SEND"},	
		{date: "19.07.2014", patient: "ppatient02111", action: "SEND"},	
		{date: "19.07.2014", patient: "ppatient42111", action: "SEND"},	
		{date: "19.07.2014", patient: "ppatient521", action: "SEND"},	
		{date: "19.07.2014", patient: "patient621", action: "SEND"},	
		{date: "19.07.2014", patient: "patient721", action: "SEND"},	
		{date: "19.07.2014", patient: "patient8211111", action: "SEND"},	
		{date: "19.07.2014", patient: "patient9211111", action: "SEND"},	
		{date: "19.07.2014", patient: "patient02", action: "SEND"},	
		{date: "19.07.2014", patient: "ppatient42", action: "SEND"},	
		{date: "19.07.2014", patient: "ppatient52", action: "SEND"},	
		{date: "19.07.2014", patient: "pppatient62", action: "SEND"},	
		{date: "19.07.2014", patient: "ppppatient72", action: "SEND"},	
		{date: "19.07.2014", patient: "ppatient82", action: "SEND"},	
		{date: "19.07.2014", patient: "patient92", action: "SEND"},	
		{date: "19.07.2014", patient: "patient02", action: "SEND"},	
	];
	$scope.currentPage = 1;
	$scope.maxSize = 3;
	$scope.itemsPerPage = 10;
}])

// Settings Page Controller
.controller("SettingsController", ["$scope", "$route", "$location", "$apiConnector", "$global", function($scope, $route, $location, $apiConnector, $global){
	////
}])
;