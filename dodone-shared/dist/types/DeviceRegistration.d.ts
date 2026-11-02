export interface DeviceRegistrationRequest {
    deviceId: string;
    fcmToken: string;
    platform: "ios" | "android" | "windows" | "macos" | "web";
    timezone: string;
}
