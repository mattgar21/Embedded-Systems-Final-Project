#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "TTUguest";
const char* WIFI_PASS = "maskedraiders";

const char* API_URL  = "http://10.179.227.124:5000/api/esp/ping";

void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(250);
    Serial.print(".");
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? "\nWiFi OK" : "\nWiFi FAIL");
}

void setup() {
  Serial.begin(115200);
  delay(500);
  WiFi.mode(WIFI_STA);
  ensureWiFi();
}

void loop() {
  ensureWiFi();
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(API_URL);
    http.addHeader("Content-Type", "application/json");

    // Send JSON (no ArduinoJson needed for something this small)
    String payload = String("{\"rssi\":") + WiFi.RSSI() + ",\"msg\":\"hello from ESP32\"}";
    int code = http.POST(payload);
    String body = http.getString();
    http.end();

    Serial.printf("HTTP %d -> %s\n", code, body.c_str());
  }

  delay(5000); // hit every 5 seconds (adjust)
}
