import { Client, type IMessage } from '@stomp/stompjs';
import type { LatestDataSensorResponse, ActionResponse } from '../api/types';

type SensorCallback = (data: LatestDataSensorResponse) => void;
type DeviceStatusCallback = (data: ActionResponse) => void;

class WebSocketService {
  private client: Client | null = null;
  private sensorListeners: Set<SensorCallback> = new Set();
  private deviceListeners: Map<number, Set<DeviceStatusCallback>> = new Map();
  private isConnected = false;

  constructor() {
    this.initClient();
  }

  private initClient() {
    this.client = new Client({
      brokerURL: 'ws://localhost:8080/ws/sensors',
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.isConnected = true;
        console.log('>>> [WebSocket] Connected to STOMP Broker');

        // Subscribe to sensor stream
        this.client?.subscribe('/topic/sensors', (message: IMessage) => {
          try {
            const data: LatestDataSensorResponse = JSON.parse(message.body);
            this.sensorListeners.forEach((cb) => cb(data));
          } catch (err) {
            console.error('Failed to parse sensor message from STOMP:', err);
          }
        });

        // Re-subscribe device status listeners
        this.deviceListeners.forEach((_listeners, deviceId) => {
          this.subscribeDeviceTopic(deviceId);
        });
      },
      onDisconnect: () => {
        this.isConnected = false;
        console.log('>>> [WebSocket] Disconnected from STOMP Broker');
      },
      onStompError: (frame) => {
        console.error('>>> [WebSocket Error]:', frame.headers['message'], frame.body);
      },
      onWebSocketError: (_event) => {
        // Quietly log to avoid console spam when backend is down
        console.warn('>>> [WebSocket] Connection attempt failed (Backend may be offline).');
      },
    });

    try {
      this.client.activate();
    } catch (e) {
      console.error('Failed to activate STOMP client:', e);
    }
  }

  private subscribeDeviceTopic(deviceId: number) {
    if (!this.client || !this.isConnected) return;
    this.client.subscribe(`/topic/devices/${deviceId}/status`, (message: IMessage) => {
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
