#include <Wire.h>
#include <Adafruit_INA219.h>
#include <Arduino.h>

// Relay Pins
#define RELAY1_PIN D4
#define RELAY2_PIN D5

// UART Pins
HardwareSerial Serial1(PA10, PA9);

//state machines
enum Vstate { V_INIT, V_READ, V_WAIT };
enum SendState { Send_init, wait };
enum RelayState { relay_init, set };

// Sensor pins
Adafruit_INA219 ina219_1(0x40);
TwoWire Wire2(PB3, PB10);   // SDA, SCL
Adafruit_INA219 ina219_2(0x40);

// task structure definion
typedef struct task {
  int state;
  unsigned long period;     
  unsigned long elapsedTime; 
  int (*Function)(int);
} task;

const unsigned int numTasks = 3;
task tasks[numTasks];

// scheduler tick period (1 ms)
const unsigned long basePeriod_ms = 1;      
const unsigned long SensorPeriod_ms = 1; 

// global variables for sensor data
float S1v = 0.0f, S1c = 0.0f, S2v = 0.0f, S2c = 0.0f;

//global variable for sensor averaging
const unsigned long windowDuration_ms = 10500UL;

float s1v_sum = 0, s1c_sum = 0;
float s2v_sum = 0, s2c_sum = 0;
unsigned long sample_count = 0;
unsigned long windowStart_ms = 0;

//flag for when new data is ready to send over uart
bool newAvgReady = false;

//global variable for relay value
bool relay1;
bool relay2;
String rxBuffer = "";

//hardware timer
HardwareTimer *MyTimer = new HardwareTimer(TIM2);

//sensor state machine
int Vstates(int state) {
  switch (state) {
    case V_INIT:
      Wire.begin();
      Wire2.begin();

      if (!ina219_1.begin(&Wire))//setup I2C connection
        Serial.println("Failed to find INA219 #1");
      else
        Serial.println("Found INA219 #1");

      if (!ina219_2.begin(&Wire2))
        Serial.println("Failed to find INA219 #2");
      else
        Serial.println("Found INA219 #2");

      sample_count = 0;
      s1v_sum = s1c_sum = 0;
      s2v_sum = s2c_sum = 0;

      windowStart_ms = millis();
      newAvgReady = false;//set flag false

      state = V_READ;
      break;

    case V_READ: {
      //taking samples to be average
      s1v_sum += ina219_1.getBusVoltage_V();
      s1c_sum += ina219_1.getCurrent_mA();
      s2v_sum += ina219_2.getBusVoltage_V();
      s2c_sum += ina219_2.getCurrent_mA();
      sample_count++;//increment sample count each time

      unsigned long now_ms = millis();
      if ((now_ms - windowStart_ms) >= windowDuration_ms) {
        if (sample_count > 0) {
          S1v = s1v_sum / sample_count;//averaging and setting values in global variable
          S1c = s1c_sum / sample_count;
          S2v = s2v_sum / sample_count;
          S2c = s2c_sum / sample_count;
        }

        s1v_sum = s1c_sum = 0;//reseting sumation variables
        s2v_sum = s2c_sum = 0;
        sample_count = 0;
        windowStart_ms = now_ms;

        newAvgReady = true;
      }

      state = V_WAIT;
      break;
    }

    case V_WAIT:
      state = V_READ;
      break;
  }

  return state;
}

//send data to ESP state machine
int SendState(int state) {
  switch (state) {
    case Send_init:
      Serial1.begin(9600);//start UART connection
      state = wait;
      break;

    case wait:
      if (newAvgReady) {//wait for new data
        Serial1.print("S1 Volt ");
        Serial1.println(S1v);
        Serial1.print("S1 Current ");
        Serial1.println(S1c);

        Serial1.print("S2 Volt ");
        Serial1.println(S2v);
        Serial1.print("S2 Current ");
        Serial1.println(S2c);

        newAvgReady = false;
      }
      break;
  }
  return state;
}

//relay state machine
int RelayState(int state) {
  while (Serial1.available()) {//read from serial terminal to add to buffer
    char c = Serial1.read();

    if (c == '\n') {//if the charachter is the new line/enter key parse the buffer
      String cmd = rxBuffer;
      cmd.trim();
      cmd.toUpperCase();

      //parse terminal for relay values
      if (cmd == "R1ON")  relay1 = true;
      if (cmd == "R1OFF") relay1 = false;

      if (cmd == "R2ON")  relay2 = true;
      if (cmd == "R2OFF") relay2 = false;

      rxBuffer = "";//reset buffer
    } else {
      rxBuffer += c;//add input to buffer
    }
  }

  switch (state) {
    case relay_init:
      pinMode(RELAY1_PIN, OUTPUT);//set gpio pins to output
      pinMode(RELAY2_PIN, OUTPUT);
      relay1 = true://turn relays on by defualt
      relay2 = true;
      state = set;
      break;

    case set:
      digitalWrite(RELAY1_PIN, relay1 ? LOW : HIGH);//set relay values
      digitalWrite(RELAY2_PIN, relay2 ? LOW : HIGH);
      break;
  }
  return state;
}

//TimerISR from class
void TimerISR() {
  for (int i = 0; i < numTasks; i++) {
    if (tasks[i].elapsedTime >= tasks[i].period) {
      tasks[i].state = tasks[i].Function(tasks[i].state);
      tasks[i].elapsedTime = 0;
    }
    tasks[i].elapsedTime += basePeriod_ms;
  }
}

void setup() {
  Serial.begin(115200);

  // init tasks
  tasks[0].state = V_INIT;
  tasks[0].period = SensorPeriod_ms;
  tasks[0].elapsedTime = tasks[0].period;
  tasks[0].Function = &Vstates;

  tasks[1].state = Send_init;
  tasks[1].period = 50;
  tasks[1].elapsedTime = tasks[1].period;
  tasks[1].Function = &SendState;

  tasks[2].state = relay_init;
  tasks[2].period = 10;
  tasks[2].elapsedTime = tasks[2].period;
  tasks[2].Function = &RelayState;

  //timer interupt
  MyTimer->setOverflow(basePeriod_ms * 1000, MICROSEC_FORMAT); 
  MyTimer->attachInterrupt(TimerISR);
  MyTimer->resume();
}

void loop() {
  //empty loop because program functions off of TimerISR
}
