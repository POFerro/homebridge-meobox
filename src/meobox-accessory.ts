import {
    AccessoryConfig,
    AccessoryPlugin,
    API,
    CharacteristicEventTypes,
    CharacteristicGetCallback,
    CharacteristicSetCallback,
    CharacteristicValue,
    HAP,
    Logging,
    Service
} from "homebridge";

const meo = require("meo-controller");

let hap: HAP;

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
    hap = api.hap;
    api.registerAccessory("MeoBox", MeoBox);
};

interface MeoBoxConfig extends AccessoryConfig {
    ip: string;
}
const POWER_ON_BUTTON = 150;
const POWER_OFF_BUTTON = 151;

class MeoBox implements AccessoryPlugin {

    private readonly log: Logging;
    private readonly config: MeoBoxConfig;
    private readonly name: string;

    private meoBoxIsOn = false;

    private readonly powerService: Service;
    private readonly informationService: Service;

    constructor(log: Logging, config: AccessoryConfig, api: API) {
        this.log = log;
        this.config = config as MeoBoxConfig;
        this.name = config.name;

        this.powerService = new hap.Service.Switch(this.name);
        this.powerService.getCharacteristic(hap.Characteristic.On)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => { this.getPowerState(callback); })
            .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => { this.setPowerState(value, callback); })
            ;

        this.informationService = new hap.Service.AccessoryInformation()
            .setCharacteristic(hap.Characteristic.Manufacturer, 'Meo')
            .setCharacteristic(hap.Characteristic.Model, 'Meo Box HD')
            .setCharacteristic(hap.Characteristic.SerialNumber, config.deviceId)
            ;

        this.log.info("Initialized box with IP " + config.ip + ".");
    }

    /*
     * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
     * Typical this only ever happens at the pairing process.
     */
    identify(): void {
        this.log("Identify!");
    }

    /*
     * This method is called directly after creation of this instance.
     * It should return all services which should be added to the accessory.
     */
    getServices(): Service[] {
        return [
            this.informationService,
            this.powerService,
        ];
    }

    setPowerState(powerOn: CharacteristicValue, callback: CharacteristicSetCallback) {
        const powerOnNewValue = powerOn as boolean;
        meo(this.config.ip, (err: any, api: any) => {
            if (err) {
                this.log.error(err);
            } else {
                api.sendNum(powerOnNewValue ? POWER_ON_BUTTON : POWER_OFF_BUTTON);
                this.meoBoxIsOn = powerOnNewValue;

                this.log.info("Meo Box with IP " + this.config.ip + " state was set to: " + (this.meoBoxIsOn ? "ON" : "OFF") + ".");

                if (api.close)
                    api.close();
                callback();
            }
        });
    };


    // Can't find a good way to do it
    getPowerState(callback: CharacteristicGetCallback) {
        this.log.info("Checking if box with IP " + this.config.ip + " is online.");

        callback(null, this.meoBoxIsOn);
    };
}