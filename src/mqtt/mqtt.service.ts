import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(MqttService.name);
    private client: mqtt.MqttClient;
    constructor(
        private readonly eventEmitter: EventEmitter2,
    ) { }

    onModuleInit() {
        if (process.env.MQTT_ENABLED === 'false') {
            console.log('MQTT disabled (MQTT_ENABLED=false)');
            return;
        }
        this.connect();
    }

    private connect() {
        console.log('🔌 Connecting to MQTT...');

        this.client = mqtt.connect('mqtt://localhost:1883', {
            username: 'gate_device_1',
            password: 'vinh13012004',
            clientId: 'backend_server',
        });

        this.client.on('connect', () => {
            console.log('✅ MQTT connected');

            this.client.subscribe([
                'gate/checkin/rfid',
                'gate/checkout/rfid',
            ], (err) => {
                if (err) {
                    console.error('❌ Subscribe failed:', err);
                } else {
                    console.log('📡 Subscribed to gate/checkin/rfid & gate/checkout/rfid');
                }
            });
        });

        this.client.on('message', (topic, message) => {
            void this.handleGateMessage(topic, message);
        });

        this.client.on('error', (error) => {
            console.error('❌ MQTT error:', error);
        });

        this.client.on('close', () => {
            console.log('⚠️ MQTT connection closed → retry in 5s...');
            setTimeout(() => this.connect(), 3000);
        });
    }

    private async handleGateMessage(topic: string, message: Buffer) {
        try {
            const payload = JSON.parse(message.toString());

            if (topic === 'gate/checkin/rfid') {
                await this.eventEmitter.emitAsync('rfid.checkin', {
                    rfid: payload.uid,
                    area: payload.area,
                });
                console.log('🔍 Checkin event emitted:', payload);
                return;
            }

            if (topic === 'gate/checkout/rfid') {
                await this.eventEmitter.emitAsync('rfid.checkout', {
                    rfid: payload.uid,
                });
            }
        } catch (error) {
            this.logger.error(`Gate message handling failed [${topic}]`, error);
        }
    }

    openGate(gateType: string, duration = 3000) {
        if (!this.client) {
            return;
        }
        const topic = `gate/${gateType}/command`;
        const payload = JSON.stringify({
            action: 'OPEN',
            duration
        });

        this.client.publish(topic, payload, (err) => {
            if (err) console.error('Publish failed:', err);
            else console.log('📤 Gate command sent to topic:', topic);
        });
    }

    onModuleDestroy() {
        this.client?.end();
    }
}