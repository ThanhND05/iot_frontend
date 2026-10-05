import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { LatestDataSensorResponse, ActionResponse } from '../api/types';

type SensorCallback = (data: LatestDataSensorResponse) => void;
type DeviceStatusCallback = (data: ActionResponse) => void;

class WebSocketService {
    private sensorClient: Client | null = null;
    private deviceClient: Client | null = null;

    private sensorListeners: Set<SensorCallback> = new Set();
    private deviceListeners: Map<number, Set<DeviceStatusCallback>> = new Map();

    private isSensorConnected = false;
    private isDeviceConnected = false;

    constructor() {
        this.initSensorClient();
        this.initDeviceClient();
    }

    // 1. Kênh WebSocket riêng cho Dữ liệu Cảm biến (Endpoint: /ws/sensors)
    private initSensorClient() {
        this.sensorClient = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws/sensors'),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                this.isSensorConnected = true;
                console.log('>>> [WebSocket Sensor] Connected to STOMP Broker (/ws/sensors)');

                // Subscribe kênh cảm biến
                this.sensorClient?.subscribe('/topic/sensors', (message: IMessage) => {
                    try {
                        const data: LatestDataSensorResponse = JSON.parse(message.body);
                        this.sensorListeners.forEach((cb) => cb(data));
                    } catch (err) {
                        console.error('Failed to parse sensor message from STOMP:', err);
                    }
                });
            },
            onDisconnect: () => {
                this.isSensorConnected = false;
                console.log('>>> [WebSocket Sensor] Disconnected from /ws/sensors');
            },
            onStompError: (frame) => {
                console.error('>>> [WebSocket Sensor Error]:', frame.headers['message'], frame.body);
            },
            onWebSocketError: (_event) => {
                console.warn('>>> [WebSocket Sensor] Connection attempt failed (Backend may be offline).');
            },
        });

        try {
            this.sensorClient.activate();
        } catch (e) {
            console.error('Failed to activate Sensor STOMP client:', e);
        }
    }

    // 2. Kênh WebSocket riêng cho Điều khiển Thiết bị (Endpoint: /ws/devices)
    private initDeviceClient() {
        this.deviceClient = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws/devices'),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                this.isDeviceConnected = true;
                console.log('>>> [WebSocket Devices] Connected to STOMP Broker (/ws/devices)');

                // Re-subscribe các kênh trạng thái thiết bị đang chờ
                this.deviceListeners.forEach((_listeners, deviceId) => {
                    this.subscribeDeviceTopic(deviceId);
                });
            },
            onDisconnect: () => {
                this.isDeviceConnected = false;
                console.log('>>> [WebSocket Devices] Disconnected from /ws/devices');
            },
            onStompError: (frame) => {
                console.error('>>> [WebSocket Devices Error]:', frame.headers['message'], frame.body);
            },
            onWebSocketError: (_event) => {
                console.warn('>>> [WebSocket Devices] Connection attempt failed (Backend may be offline).');
            },
        });

        try {
            this.deviceClient.activate();
        } catch (e) {
            console.error('Failed to activate Devices STOMP client:', e);
        }
    }

    private subscribeDeviceTopic(deviceId: number) {
        if (!this.deviceClient || !this.isDeviceConnected) return;
        this.deviceClient.subscribe(`/topic/devices/${deviceId}/status`, (message: IMessage) => {
            try {
                const data: ActionResponse = JSON.parse(message.body);
                const listeners = this.deviceListeners.get(deviceId);
                listeners?.forEach((cb) => cb(data));
            } catch (err) {
                console.error(`Failed to parse device ${deviceId} status:`, err);
            }
        });
    }

    // Subscribe to real-time sensor updates
    public onSensorData(callback: SensorCallback): () => void {
        this.sensorListeners.add(callback);
        return () => {
            this.sensorListeners.delete(callback);
        };
    }

    // Subscribe to real-time device action status updates
    public onDeviceStatus(deviceId: number, callback: DeviceStatusCallback): () => void {
        if (!this.deviceListeners.has(deviceId)) {
            this.deviceListeners.set(deviceId, new Set());
            this.subscribeDeviceTopic(deviceId);
        }
        this.deviceListeners.get(deviceId)!.add(callback);

        return () => {
            const listeners = this.deviceListeners.get(deviceId);
            if (listeners) {
                listeners.delete(callback);
                if (listeners.size === 0) {
                    this.deviceListeners.delete(deviceId);
                }
            }
        };
    }
}

export const webSocketService = new WebSocketService();