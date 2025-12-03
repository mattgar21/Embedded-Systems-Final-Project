// Libraries
#include <WiFi.h>
#include <HTTPClient.h>

// UART pins
#define TXD1 21
#define RXD1 19

HardwareSerial mySerial(2);

// WiFi to connect to hotspot
const char* WIFI_SSID = "put ssid";
const char* WIFI_PASS = "put pw";

// API endpoints
const char* API_URL   = "insertIP/api/esp/ping";
const char* RELAY_URL = "insertIP/api/relays";

// Parsed sensor values from STM32
float s1v = 0.0f;
float s1c = 0.0f;
float s2v = 0.0f;
float s2c = 0.0f;

// Relay states from Pi
bool relay1 = true;
bool relay2 = true;


// makes sure esp connects to WiFi
void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long start = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected!");
  } else {
    Serial.println("WiFi connection failed.");
  }
}

// Function used to send values to pi
void sendToPi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping HTTP POST");
    return;
  }

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  // put all values into json format
  String payload = "{";
  payload += "\"s1c\":" + String(s1c, 3) + ",";
  payload += "\"s1v\":" + String(s1v, 3) + ",";
  payload += "\"s2c\":" + String(s2c, 3) + ",";
  payload += "\"s2v\":" + String(s2v, 3);
  payload += "}";

  Serial.println("Sending payload: " + payload);

  int code = http.POST(payload);
  String body = http.getString();
  http.end();
  // Debug statemens
  Serial.printf("HTTP %d -> %s\n", code, body.c_str());

  mySerial.print("ACK: ");
  mySerial.println(code);
}

// Function used to retreive relay states
void fetchRelayStates() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  HTTPClient http;
  http.begin(RELAY_URL);
  int code = http.GET();

  if (code == 200) {
    String body = http.getString();
    Serial.printf("Relay JSON: %s\n", body.c_str());

    String flat = body;
    flat.replace(" ", "");

    // Sets relay values
    relay1 = flat.indexOf("\"relay1\":true") != -1;
    relay2 = flat.indexOf("\"relay2\":true") != -1;

    // debugs statements
    mySerial.println(relay1 ? "R1ON" : "R1OFF");
    mySerial.println(relay2 ? "R2ON" : "R2OFF");
  } else {
    Serial.printf("Failed to GET relay states, HTTP %d\n", code);
  }

  http.end();
}

// Exact values from UART
void parseLine(const String& line) {
  if (line.startsWith("S1 Volt")) {
    String val = line.substring(String("S1 Volt").length());
    val.trim();
    s1v = val.toFloat();
    Serial.print("Parsed S1V = ");
    Serial.println(s1v, 3);

  } else if (line.startsWith("S1 Current")) {
    String val = line.substring(String("S1 Current").length());
    val.trim();
    s1c = val.toFloat();
    Serial.print("Parsed S1C = ");
    Serial.println(s1c, 3);

  } else if (line.startsWith("S2 Volt")) {
    String val = line.substring(String("S2 Volt").length());
    val.trim();
    s2v = val.toFloat();
    Serial.print("Parsed S2V = ");
    Serial.println(s2v, 3);

  } else if (line.startsWith("S2 Current")) {
    String val = line.substring(String("S2 Current").length());
    val.trim();
    s2c = val.toFloat();
    Serial.print("Parsed S2C = ");
    Serial.println(s2c, 3);

    sendToPi();

  } else {
    Serial.println("Unknown UART line: " + line);
  }
}

// Starts UART
void setup() {
  Serial.begin(115200);
  mySerial.begin(9600, SERIAL_8N1, RXD1, TXD1);

  Serial.println("ESP32 Ready (UART + WiFi bridge)");

  WiFi.mode(WIFI_STA);
  ensureWiFi();
}

void loop() {
  ensureWiFi();

  // Polls the relay state
  static unsigned long lastRelayPoll = 0;
  if (millis() - lastRelayPoll > 1000) {
    fetchRelayStates();
    lastRelayPoll = millis();
  }

  // This reads the UART
  while (mySerial.available()) {
    String line = mySerial.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) continue;

    Serial.println("received: " + line);
    parseLine(line);
  }

  delay(10);
}
