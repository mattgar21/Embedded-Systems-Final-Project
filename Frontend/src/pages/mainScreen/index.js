import { LineChart } from "@mui/x-charts/LineChart";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

// ... MaterialUISwitch (unchanged) ...

export default function MainScreen() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#272727ff",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        p: 4,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* small window for graphs */}
        <Box
          sx={{
            width: 800, // natural (unscaled) layout width
            transform: "scale(1.2)", // shrink everything
            transformOrigin: "top left",
          }}
        >
          {/* Row for Sensor 1 and Sensor 2 */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mb: 2,
            }}
          >
            {/* Sensor 1 */}
            <Paper
              sx={{
                p: 2,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" gutterBottom>
                Sensor 1
              </Typography>
              <LineChart
                xAxis={[{ data: [1, 2, 3, 5, 8, 10] }]}
                series={[{ data: [2, 5.5, 2, 8.5, 1.5, 5] }]}
                height={200}
                width={240}
              />
            </Paper>

            {/* Sensor 2 */}
            <Paper
              sx={{
                p: 2,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" gutterBottom>
                Sensor 2
              </Typography>
              <LineChart
                xAxis={[{ data: [1, 2, 3, 5, 8, 10] }]}
                series={[{ data: [2, 5.5, 2, 8.5, 1.5, 5] }]}
                height={200}
                width={240}
              />
            </Paper>
          </Box>

          {/* Combined Graph below */}
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Combined Sensor Data
            </Typography>
            <LineChart
              xAxis={[{ data: [1, 2, 3, 5, 8, 10] }]}
              series={[
                { data: [2, 5.5, 2, 8.5, 1.5, 5], label: "Temperature (°C)" },
                { data: [1, 3, 4.5, 7, 6, 8], label: "Humidity (%)" },
                { data: [0.5, 2, 3.5, 5.5, 7.5, 9], label: "Pressure (kPa)" },
              ]}
              height={220}
              width={500}
            />
          </Paper>
        </Box>

        <Paper>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="MUI switch"
            />

            <FormControlLabel
              control={<Switch defaultChecked />}
              label="MUI switch"
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
