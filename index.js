var Service, Characteristic,
	meo = require('meo-controller');

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	
	homebridge.registerAccessory("homebridge-meobox", "MeoBox", MeoBox);
}

function MeoBox(log, config, api) {
	this.log = log;
	this.config = config;
	this.name = config.name || 'Meo Box';
	this.status = false;
	
	this.powerService = new Service.Switch(this.name);

	//	Control the box power status.
	this.powerService.getCharacteristic(Characteristic.On).on('set', this.setPowerState.bind(this));
//	this.powerService.getCharacteristic(Characteristic.On).on('get', this.getPowerState.bind(this));

	this.informationService = new Service.AccessoryInformation()
    			.setCharacteristic(Characteristic.Manufacturer, 'Meo')
    			.setCharacteristic(Characteristic.Model, 'Meo Box HD')
    			.setCharacteristic(Characteristic.SerialNumber, config.deviceId);

	this.log.info("Initialized box with IP "+config.ip+".");
}

MeoBox.prototype.setPowerState = function(powerOn, callback) {
	var meoConfig = this.config;
	var _this = this;
	this.log.info("Setting box with IP " + meoConfig.ip + " state to: " + powerOn + ".");
	meo(meoConfig.ip, function(err, api) {
		if (err) {
			console.log(err);
		} else {
			api.sendNum(powerOn ? 150 : 151);
			_this.status = powerOn;
			if (api.close)
				api.close();
			callback();
		}
	});
};

// Not used, can't find a good way to do it	
MeoBox.prototype.getPowerState = function (callback) {
	var meoConfig = this.config;
	this.log.info("Checking if box with IP " + meoConfig.ip + " is online.");
	callback(null, this.status);
};

MeoBox.prototype.getServices = function() {
	return [this.powerService, this.informationService];
};