let speechOutput;
let reprompt;
// let welcomeOutput = "Welcome to Air Guru. You can ask me for the current air quality, and I will tell you about the air conditions in your area.";
// let welcomeReprompt = "For example you can say, 'ask Air Guru for the current air quality'";
"use strict";
const Alexa = require('alexa-sdk');
const request = require('request');
const moment = require('moment-timezone');
var Speech = require('ssml-builder');
const geocoding_api_key = process.env.geocoding_api_key;
const APP_ID = undefined;
speechOutput = '';
const handlers = {
	'LaunchRequest': function () {
		// this.emit(':ask', welcomeOutput, welcomeReprompt);
		const self = this;
		speechOutput = '';

		var deviceId = this.event.context.System.device.deviceId;
		var accessToken = this.event.context.System.apiAccessToken;
		var url = `https://api.amazonalexa.com/v1/devices/${deviceId}/settings/address/countryAndPostalCode`

		request.get(url, {
      headers: {'Authorization': 'Bearer ' + accessToken}
		}, (error, response, body) => {
      console.log('error:', error); // Print the error if one occurred
      console.log('statusCode:', response && response.statusCode);
      // console.log('body:', body); // Print the body
      if (response.statusCode == 200 && JSON.parse(body).postalCode) {
        var zipcode = JSON.parse(body).postalCode;

        var geocodeURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipcode}&key=${geocoding_api_key}`;
        request.get(geocodeURL, (error, response, body) => {
					if (response.statusCode == 200 && JSON.parse(body).results) {
						var data = JSON.parse(body);
						var lat = data.results[0].geometry.location.lat;
						var lng = data.results[0].geometry.location.lng;

						var airnowURL = 'https://api-airnowgov.sonomatech.com/reportingarea/get';
						request.post({url: airnowURL, form: {
							latitude: lat,
							longitude: lng,
							maxDistance: 500
						}}, function(err, response, body){
							if (response.statusCode == 200) {
								var data = JSON.parse(body);
								moment.tz.setDefault("America/Chicago");
								var today = moment();
								var dataFound = false;
								var PM25Data;
								var OzoneData;
								for (var i = 0; i < data.length; i++) {
									var date = moment(data[i].validDate, "MM-DD-YY");
									if (today.isSame(date, 'day') && ((data[i].parameter == "PM2.5" && !PM25Data) || (data[i].parameter == "OZONE" && !OzoneData))) {
										console.log("today:", today.format());
										console.log("date:", date.format());
										var aqi = data[i].aqi;
										var category = data[i].category.toLowerCase();
										var region = data[i].reportingArea;
										console.log("aqi: " + aqi);
										console.log("category: " + category);
										console.log("parameter: " + data[i].parameter);
										// console.log(data[i]);
										if (category && aqi || category) {
											if (data[i].parameter == "PM2.5")
												PM25Data = data[i];
											else
												OzoneData = data[i];
										}


										dataFound = true;
										if (PM25Data && OzoneData)
											break;
									}
								}

								if (!dataFound) {
									speechOutput = "Sorry, I was unable to get the air quality in your location."

									self.emit(":tell", speechOutput);
								} else {
									var data;
									if (PM25Data && OzoneData && PM25Data.aqi && OzoneData.aqi) {
										data = PM25Data.aqi >= OzoneData.aqi ? PM25Data : OzoneData;
									} else if (PM25Data) {
										data = PM25Data;
									} else {
										data = OzoneData;
									}
									console.log("chose: " + data.parameter);
									var aqi = data.aqi;
									var category = data.category.toLowerCase();
									var region = data.reportingArea;

									if (category && aqi) {
										speechOutput = `Currently, in ${region}, the air quality is ${category}, with an air quality index of ${aqi}.`;
									} else if (category) {
										speechOutput = `Currently, in ${region}, the air quality is ${category}.`;
									} else {
										speechOutput = "Sorry, I was unable to get the air quality in your location."
									}

									self.emit(":tell", speechOutput);

								}
							} else {
								speechOutput = "Sorry, I was unable to get the air quality in your location."
								self.emit(":tell", speechOutput);
							}
						});

					} else {
						speechOutput = "I'm having trouble getting the air quality in your location. Please try again later."
						self.emit(":tell", speechOutput);
					}
        });
      } else {
        speechOutput = "I'm having trouble getting the air quality in your location. Please ensure you have granted the Air Guru skill accesss to your zipcode through the alexa app.";
				self.emit(":tell", speechOutput);
      }

    });
	},
	'AMAZON.HelpIntent': function () {
		speechOutput = "You can ask me for the current air quality. For example you can say, 'ask Air Guru for the current air quality'";
		reprompt = '';
		this.emit(':ask', speechOutput, reprompt);
	},
	'AMAZON.FallbackIntent': function () {
		speechOutput = "Sorry, I didn't understand. Try saying, 'ask Air Guru for the current air quality'";
		this.emit(':ask', speechOutput, speechOutput);
  },
	'GetAirQualityIntent': function () {
		const self = this;
		speechOutput = '';

		let dateSlot = this.event.request.intent.slots.date.value;
		console.log("dateSlot:", dateSlot);

		var deviceId = this.event.context.System.device.deviceId;
		var accessToken = this.event.context.System.apiAccessToken;
		var url = `https://api.amazonalexa.com/v1/devices/${deviceId}/settings/address/countryAndPostalCode`

		request.get(url, {
      headers: {'Authorization': 'Bearer ' + accessToken}
		}, (error, response, body) => {
      console.log('error:', error); // Print the error if one occurred
      console.log('statusCode:', response && response.statusCode);
      // console.log('body:', body); // Print the body
      if (response.statusCode == 200 && JSON.parse(body).postalCode) {
        var zipcode = JSON.parse(body).postalCode;

        var geocodeURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipcode}&key=${geocoding_api_key}`;
        request.get(geocodeURL, (error, response, body) => {
					if (response.statusCode == 200 && JSON.parse(body).results) {
						var data = JSON.parse(body);
						var lat = data.results[0].geometry.location.lat;
						var lng = data.results[0].geometry.location.lng;

						var airnowURL = 'https://api-airnowgov.sonomatech.com/reportingarea/get';
						request.post({url: airnowURL, form: {
							latitude: lat,
							longitude: lng,
							maxDistance: 500
						}}, function(err, response, body){
							if (response.statusCode == 200) {
								var data = JSON.parse(body);
								moment.tz.setDefault("America/Chicago");

								var today = moment();
								if (dateSlot) {
									var queryDay = moment(dateSlot, "YYYY-MM-DD"); // query requested day
								} else {
									var queryDay = today; // query today's air quality
								}

								var dataFound = false;
								var PM25Data;
								var OzoneData;
								for (var i = 0; i < data.length; i++) {
									var date = moment(data[i].validDate, "MM-DD-YY");
									if (queryDay.isSame(date, 'day') && ((data[i].parameter == "PM2.5" && !PM25Data) || (data[i].parameter == "OZONE" && !OzoneData))) {
										console.log("queryDay:", queryDay.format());
										console.log("date:", date.format());
										var aqi = data[i].aqi;
										var category = data[i].category.toLowerCase();
										var region = data[i].reportingArea;
										console.log("aqi: " + aqi);
										console.log("category: " + category);
										console.log("parameter: " + data[i].parameter);
										// console.log(data[i]);
										if (category && aqi || category) {
											if (data[i].parameter == "PM2.5")
												PM25Data = data[i];
											else
												OzoneData = data[i];
										}


										dataFound = true;
										if (PM25Data && OzoneData)
											break;
									}
								}

								if (!dataFound) {
									if (dateSlot)
										speechOutput = "Sorry, I was unable to get the air quality in your location for the date you requested. Usually there are only air quality forecasts for the next 2 days."
									else
										speechOutput = "Sorry, I was unable to get the air quality in your location."

									self.emit(":tell", speechOutput);
								} else {
									var data;
									if (PM25Data && OzoneData && PM25Data.aqi && OzoneData.aqi) {
										data = PM25Data.aqi >= OzoneData.aqi ? PM25Data : OzoneData;
									} else if (PM25Data) {
										data = PM25Data;
									} else {
										data = OzoneData;
									}
									console.log("chose: " + data.parameter);
									var aqi = data.aqi;
									var category = data.category.toLowerCase();
									var region = data.reportingArea;

									if (category && aqi) {
										if (queryDay.isSame(moment(), 'day')) {
											speechOutput = `Currently, in ${region}, the air quality is ${category}, with an air quality index of ${aqi}.`;
										} else {
											if (queryDay.isAfter(today))
												var tense = "will be";
											else
												var tense = "was";

											var speech = new Speech();
											speech.say("On").sayAs({word: dateSlot.substring(5) + ",", interpret: "date", format: "md"}).say(`in ${region}, the air quality ${tense} ${category}, with an air quality index of ${aqi}.`);
											speechOutput = speech.ssml(true);
											// speechOutput = `In ${region}, the air quality will be ${category}, with an air quality index of ${aqi}.`;
										}
									} else if (category) {
										if (queryDay.isSame(moment(), 'day')) {
											speechOutput = `Currently, in ${region}, the air quality is ${category}.`;
										} else {
											if (queryDay.isAfter(today))
												var tense = "will be";
											else
												var tense = "was";
												
											var speech = new Speech();
											speech.say("On").sayAs({word: dateSlot.substring(5) + ",", interpret: "date", format: "md"}).say(`in ${region}, the air quality ${tense} ${category}.`)
											speechOutput = speech.ssml(true);
											// speechOutput = `In ${region}, the air quality will be ${category}.`;
										}
									} else {
										speechOutput = "Sorry, I was unable to get the air quality in your location."
									}

									self.emit(":tell", speechOutput);

								}
							} else {
								speechOutput = "Sorry, I was unable to get the air quality in your location."
								self.emit(":tell", speechOutput);
							}
						});

					} else {
						speechOutput = "I'm having trouble getting the air quality in your location. Please try again later."
						self.emit(":tell", speechOutput);
					}
        });
      } else {
        speechOutput = "I'm having trouble getting the air quality in your location. Please ensure you have granted the Air Guru skill accesss to your zipcode through the alexa app.";
				self.emit(":tell", speechOutput);
      }

    });
  }
};

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function isSlotValid(request, slotName){
        let slot = request.intent.slots[slotName];
        //console.log("request = "+JSON.stringify(request)); //uncomment if you want to see the request
        let slotValue;

        //if we have a slot, get the text and store it into speechOutput
        if (slot && slot.value) {
            //we have a value in the slot
            slotValue = slot.value.toLowerCase();
            return slotValue;
        } else {
            //we didn't get a value in the slot.
            return false;
        }
}
