#include <Wire.h>
#include <Adafruit_INA219.h>

// INA219 object
Adafruit_INA219 ina219;

// State machine
enum States { S1_INIT, S2_READ, S3_WAIT } state = S1_INIT;

// Sensor data variables
float volt = 0.0;
float current = 0.0;
float voltSum = 0.0;
float currentSum = 0.0;
unsigned long sampleCount = 0;

// Timing variables
unsigned long lastSample = 0;
const unsigned long sampleInterval = 667; // ~1.5kHz polling rate



// ---------------------------------------------------------------------------
// STATE MACHINE FUNCTION
// ---------------------------------------------------------------------------
void vState() {
  switch (state) {

    // ------------------ STATE 1: INITIALIZE ------------------
    case S1_INIT: {
      Serial.println("Connecting to INA219...");

      if (!ina219.begin()) {
        Serial.println("Can't connect to INA219!");
        while (1); // halt if not found
      }

      ina219.setCalibration_32V_2A();
      Serial.println("Connected to INA219");
      state = S2_READ;
      break;
    }

    // ------------------ STATE 2: READ / AVERAGE ------------------
    case S2_READ: {
      unsigned long now = micros();

      if (now - lastSample >= sampleInterval) {
        lastSample = now;

        float v = ina219.getBusVoltage_V();
        float i = ina219.getCurrent_mA();

        // Accumulate for averaging
        voltSum += v;
        currentSum += i;
        sampleCount++;
      }

      // Compute and print averages once per ~1s (1500 samples)
      if (sampleCount >= 1500) {
        float avgVolt = voltSum / sampleCount;
        float avgCurrent = currentSum / sampleCount;

        Serial.println("---- AVERAGED DATA ----");
        Serial.print("Avg Voltage: ");
        Serial.print(avgVolt, 3);
        Serial.println(" V");
        Serial.print("Avg Current: ");
        Serial.print(avgCurrent, 3);
        Serial.println(" mA");
        Serial.println("-----------------------");

        // Update global vars for other states or subsystems
        volt = avgVolt;
        current = avgCurrent;

        // Reset accumulators
        voltSum = 0;
        currentSum = 0;
        sampleCount = 0;

        // Move to next state
        state = S3_WAIT;
      }

      break;
    }

    // ------------------ STATE 3: WAIT ------------------
    case S3_WAIT: {
      delay(1000);  // 1 second wait (simulate idle or cooldown)
      state = S2_READ;
      break;
    }

  } // end switch
}

// ---------------------------------------------------------------------------
// STANDARD ARDUINO ENTRY POINTS FOR STM32
// ---------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  while (!Serial) {;}  // Wait for terminal connection (optional)
  Serial.println("STM32 Nucleo F401RE + INA219 test");
  state = S1_INIT;
}

void loop() {
  vState();  // continuously run state machine
}
