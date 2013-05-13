var util = require('util'),
    stream = require('stream'),
    helpers = require('./helpers');

module.exports = NinjaSmartPlug
util.inherits(NinjaSmartPlug,stream);

//SRPC header bit positions
var SRPC_CMD_ID_POS = 0;
var SRPC_CMD_LEN_POS = 1;

//define incoming RPCS command ID's
var RPCS_CLOSE              = 0x80;
var RPCS_GET_DEVICES        = 0x81;
var RPCS_SET_DEV_STATE      = 0x82;
var RPCS_SET_DEV_LEVEL      = 0x83;
var RPCS_SET_DEV_COLOR      = 0x84;
var RPCS_GET_DEV_STATE      = 0x85;
var RPCS_GET_DEV_LEVEL      = 0x86;
var RPCS_GET_DEV_HUE        = 0x87;
var RPCS_GET_DEV_SAT        = 0x88;
var RPCS_BIND_DEVICES       = 0x89;
var RPCS_GET_THERM_READING  = 0x8a;
var RPCS_GET_POWER_READING  = 0x8b;
var RPCS_DISCOVER_DEVICES   = 0x8c;
var RPCS_SEND_ZCL           = 0x8d;
var RPCS_GET_GROUPS         = 0x8e;
var RPCS_ADD_GROUP          = 0x8f;
var RPCS_GET_SCENES         = 0x90;
var RPCS_STORE_SCENE        = 0x91;
var RPCS_RECALL_SCENE       = 0x92;
var RPCS_IDENTIFY_DEVICE    = 0x93;
var RPCS_CHANGE_DEVICE_NAME = 0x94;
var RPCS_REMOVE_DEVICE      = 0x95;

//SRPC AfAddr Addr modes ID's
var AddrNotPresent = 0;
var AddrGroup = 1;
var Addr16Bit = 2;
var Addr64Bit = 3;
var AddrBroadcast = 1;

var power = 1;
var state = 0;

function NinjaSmartPlug(logger,device) {

  // Features of this device
  this.readable = true;
  this.writeable = false;
  this.log = logger;

  // Ninja config
  this.V = 0;
  this.D = 243; //power
  this.G = device.fetchLookupKey();

  this.zigbee = device;
  device.ninjaPower = this;

  var self = this;

  clearInterval(this._iv);
  this._iv = setInterval(function(){
    self.pollForPowerReading();
  },2000);

};

NinjaSmartPlug.prototype.pollForPowerReading = function() {

  var msg = new Buffer(14);
  var msgIdx;

  this.log.info('zigbee.prototype.pollForPowerReading: nwk:' +this.zigbee.nwkAddr +' ep:' +this.zigbee.endPoint);

  //set SRPC len and CMD ID
  msg[SRPC_CMD_ID_POS] = RPCS_GET_POWER_READING;
  msg[SRPC_CMD_LEN_POS] = 12;

  //set ptr to point to data
  msgIdx=2;

  //dstAddr.addrMode = Addr16Bit
  msg[msgIdx++] = Addr16Bit;
  //set afAddrMode_t nwk address
  msg[msgIdx++] = (this.zigbee.nwkAddr & 0xFF);
  msg[msgIdx++] = ((this.zigbee.nwkAddr & 0xFF00)>>8);
  //pad for an ieee addr size;
  msgIdx += 6;
  //set Ep
  msg[msgIdx++] = this.zigbee.endPoint;
  //pad out pan ID
  msgIdx+=2;

  this.zigbee.socket.write(msg);
};

/**
 * Change the state of the device (on/off).
 *
 * @param {Boolean} state true if on, false if off
 * @fires zigbee#data       `data` written to SRPC client
 */
NinjaSmartPlug.prototype.setDeviceState = function(state) {
  var msg = new Buffer(15);
  var msgIdx;

  this.log.info('NinjaSmartPlug.prototype.setDeviceState++: nwk:' +this.zigbee.nwkAddr +' ep:' +this.zigbee.endPoint);

  //set SRPC len and CMD ID
  msg[SRPC_CMD_ID_POS] = RPCS_SET_DEV_STATE;
  msg[SRPC_CMD_LEN_POS] = 13;

  //set ptr to point to data
  msgIdx=2;

  //dstAddr.addrMode = Addr16Bit
  msg[msgIdx++] = Addr16Bit;
  //set afAddrMode_t nwk address
  msg[msgIdx++] = (this.zigbee.nwkAddr & 0xFF);
  msg[msgIdx++] = ((this.zigbee.nwkAddr & 0xFF00)>>8);
  //pad for an ieee addr size;
  msgIdx += 6;
  //set Ep
  msg[msgIdx++] = this.zigbee.endPoint;
  //pad out pan ID
  msgIdx+=2;

  this.log.info('NinjaSmartPlug.prototype.setDeviceState: ' +state);

  //set State
  if(state){
      msg[msgIdx++] = 0xFF;
  } else {
      msg[msgIdx++] = 0;
  }
  this.zigbee.socket.write(msg);
};

NinjaSmartPlug.prototype.write = function(data) {
  return false;
};

NinjaSmartPlug.prototype.end = function() {};
NinjaSmartPlug.prototype.close = function() {};