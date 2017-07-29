'use strict';

const rpio = require('rpio');

var Service, Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory('homebridge-simple-garage-door-opener', 'SimpleGarageDoorOpener', SimpleGarageDoorOpener);
};

class SimpleGarageDoorOpener {
  constructor (log, config) {

    //get config values
    this.name = config['name'];
    this.doorSwitchPin = config['doorSwitchPin'] || 12;
    this.simulateTimeOpening = config['simulateTimeOpening'] || 15;
    this.simulateTimeOpen = config['simulateTimeOpen'] || 30;
    this.simulateTimeClosing = config['simulateTimeClosing'] || 15;

    //initial setup
    this.log = log;
    this.lastOpened = new Date();
    this.service = new Service.GarageDoorOpener(this.name, this.name);
    this.setupGarageDoorOpenerService(this.service);

    this.informationService = new Service.AccessoryInformation();
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, 'Simple Garage Door')
      .setCharacteristic(Characteristic.Model, 'A Remote Control')
      .setCharacteristic(Characteristic.SerialNumber, '0712');
  }

  getServices () {
    return [this.informationService, this.service];
  }

  setupGarageDoorOpenerService (service) {

    this.service.setCharacteristic(Characteristic.TargetDoorState, Characteristic.TargetDoorState.CLOSED);
    this.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSED);
    
    service.getCharacteristic(Characteristic.TargetDoorState)
      .on('get', (callback) => {
        var targetDoorState = service.getCharacteristic(Characteristic.TargetDoorState).value;
        callback(null, targetDoorState);
      })
      .on('set', (value, callback) => {
        var currentDoorState = service.getCharacteristic(Characteristic.CurrentDoorState).value;

        if (value === Characteristic.TargetDoorState.OPEN) {
          switch (currentDoorState) {
            case Characteristic.CurrentDoorState.CLOSED:
              this.openGarageDoor(callback);
              break;
	    case Characteristic.CurrentDoorState.STOPPED:
	      this.openGarageDoor(callback);
              break;
	    case Characteristic.CurrentDoorState.OPEN:
              this.log('Current state open');
              this.closeGarageDoor(callback);
              break;

            default:
              callback();
          }
        }
        if (value === Characteristic.TargetDoorState.CLOSED) {
          this.log('Target Close');
          switch (currentDoorState) {
            case Characteristic.CurrentDoorState.OPEN:
	      this.log('Current state open');
	      this.closeGarageDoor(callback);
              break;
            case Characteristic.CurrentDoorState.STOPPED:
              this.log('Current state stopped');
              this.closeGarageDoor(callback);
              break;
	    case Characteristic.CurrentDoorState.CLOSED:
              this.openGarageDoor(callback);
              break;
            default:
              callback();
          }
        }
      });
  }

  openGarageDoor (callback) {
    this.log('Opening the garage door for...');
    this.signalCall();
    this.simulateGarageDoorOpening();
    callback();
  }

  closeGarageDoor(callback) {
    this.log('Closing the garage door for...');
    this.signalCall();
    this.simulateGarageDoorClosing();
    callback();
  }

  signalCall () {
    this.log('Starting signal');
    rpio.open(this.doorSwitchPin, rpio.OUTPUT, rpio.LOW);
    rpio.write(this.doorSwitchPin, rpio.HIGH);
    rpio.sleep(1);
    rpio.write(this.doorSwitchPin, rpio.LOW);
    rpio.close(this.doorSwitchPin, rpio.PIN_RESET);
    this.log('Signal ended successfully');
  }


  simulateGarageDoorOpening () {
    this.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPENING);
    setTimeout(() => {
      this.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPEN);
    }, this.simulateTimeOpening * 1000);
  }

  simulateGarageDoorClosing () {
    this.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSING);
    setTimeout(() => {
        this.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSED);
    }, this.simulateTimeClosing * 1000);
  }

}
