import { LineChart } from "@mui/x-charts/LineChart";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

//route used to hit flask backend
//Change api to represent your backend location
const API = "http://localhost:5000";

//This is used to send if the front end switch is on or off
async function sendSwitchState(port, state) {
  try {
    const response = await fetch("http://localhost:5000/api/switch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        port: port,
        state: state,
      }),
    });

    const data = await response.json();
    console.log("Backend response:", data);
  } catch (err) {
    console.error("Error sending switch state:", err);
  }
}

const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 7,
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    transform: "translateX(6px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(22px)",
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
          "#fff"
        )}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`,
      },
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: "#aab4be",
        ...theme.applyStyles("dark", {
          backgroundColor: "#8796A5",
        }),
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: "#001e3c",
    width: 32,
    height: 32,
    "&::before": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
        "#fff"
      )}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`,
    },
    ...theme.applyStyles("dark", {
      backgroundColor: "#003892",
    }),
  },
  "& .MuiSwitch-track": {
    opacity: 1,
    backgroundColor: "#aab4be",
    borderRadius: 20 / 2,
    ...theme.applyStyles("dark", {
      backgroundColor: "#8796A5",
    }),
  },
}));

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
      {/* Main horizontal layout: graphs on left, switches on right */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        {/* Left side: Graphs */}
        <Box
          sx={{
            width: 800, // natural (unscaled) layout width
            transform: "scale(1.2)",
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
                USB C port 1
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
                USB C port 2
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

        {/* Right side: Switch panel */}
        <Paper
          sx={{
            p: 3,
            ml: 4,
            minWidth: 250,
            height: "fit-content",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <FormControlLabel
            control={
              <MaterialUISwitch
                sx={{ m: 1 }}
                defaultChecked
                onChange={(e) => sendSwitchState(1, e.target.checked)}
              />
            }
            label="USB C port 1"
          />

          <FormControlLabel
            control={
              <MaterialUISwitch
                sx={{ m: 1 }}
                defaultChecked
                onChange={(e) => sendSwitchState(2, e.target.checked)}
              />
            }
            label="USB C port 2"
          />
        </Paper>
      </Box>
    </Box>
  );
}