"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SensorController = void 0;
const common_1 = require("@nestjs/common");
const api_key_guard_1 = require("./api-key.guard");
const sensor_gateway_1 = require("./sensor.gateway");
let SensorController = class SensorController {
    sensorGateway;
    constructor(sensorGateway) {
        this.sensorGateway = sensorGateway;
    }
    receiveData(data) {
        this.sensorGateway.server.emit('sensor-data', data);
        return { success: true };
    }
};
exports.SensorController = SensorController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SensorController.prototype, "receiveData", null);
exports.SensorController = SensorController = __decorate([
    (0, common_1.Controller)('sensors'),
    __metadata("design:paramtypes", [sensor_gateway_1.SensorGateway])
], SensorController);
//# sourceMappingURL=sensor.controller.js.map