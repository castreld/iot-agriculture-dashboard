import { SensorGateway } from './sensor.gateway';
interface SensorDataDto {
    deviceId: string;
    timestamp: number;
    payload: Record<string, number>;
}
export declare class SensorController {
    private readonly sensorGateway;
    constructor(sensorGateway: SensorGateway);
    receiveData(data: SensorDataDto): {
        success: boolean;
    };
}
export {};
