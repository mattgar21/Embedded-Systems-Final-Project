#include <WiFi.h>
#include <HTTPClient.h>

//GPIO pins for UART 
#define TXD1 21
#define RXD1 19

//UART Serial
HardwareSerial UARTSerial(2);   

//WIFI Network Settings
const char* WIFI_SSID = "PUT SSID";
const char* WIFI_PASS = "PUT PASSWORD";

//ROUTE
const char* API_URL   = "PUTURL/api/esp/ping";

String message;

//Checks if connneceted to wifi
void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(250);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED)
    Serial.println("\nWiFi connected!");
  else
    Serial.println("\nWiFi connection failed!");
}

//start new serial port and serial on esp-
void setup() {
  Serial.begin(115200);

  // UART2 for TX/RX
  UARTSerial.begin(9600, SERIAL_8N1, RXD1, TXD1);

  WiFi.mode(WIFI_STA);
  ensureWiFi();

  Serial.println("ESP32 UART <-> WiFi bridge ready!");
}

//Loop used to send data to the pi
void loop() {
  ensureWiFi();

  //check is we recieved message
  if (UARTSerial.available()) {
    message = UARTSerial.readStringUntil('\n');
    message.trim();

    if (message.length() > 0) {
      Serial.println("UART Received: " + message);

      //send to the api
      if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(API_URL);
        http.addHeader("Content-Type", "application/json");

        //packages info into a json for backend to process
        String payload = "{\"msg\":\"" + message + "\",\"rssi\":" + String(WiFi.RSSI()) + "}";

        Serial.println("Sending payload: " + payload);

        int code = http.POST(payload);
        String body = http.getString();
        http.end();

        Serial.printf("HTTP %d -> %s\n", code, body.c_str());

        //This section will be used to send if the power to usbc 1 or 2 should be on
        UARTSerial.print("ACK: ");
        UARTSerial.println(code);   // send back HTTP status
      }
    }
  }

  delay(200); 
