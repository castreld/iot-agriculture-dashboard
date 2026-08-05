import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { SensorGateway } from './sensor.gateway';

interface SensorDataDto {
  deviceId: string;
  timestamp: number;
  payload: Record<string, number>;
}

@Controller('sensors')
export class SensorController {
  constructor(private readonly sensorGateway: SensorGateway) {}

  @Post()
  @UseGuards(ApiKeyGuard)
  receiveData(@Body() data: SensorDataDto) {
    this.sensorGateway.server.emit('sensor-data', data);
    return { success: true };
  }
}
