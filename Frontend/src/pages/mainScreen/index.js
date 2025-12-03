// Imports
import { useEffect, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

// This is the route to hit the backend API
const API = "Please Add Your Backend API URL Here";

// Function to send switch state to backend
async function sendSwitchState(port, state) {
  try {
    const response = await fetch(`${API}/api/switch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ port, state }),
    });
    await response.json();
  } catch (err) {
    console.error("Error sending switch state:", err);
  }
}

// This is a custom styled switch component from MUI
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
  // Costant for chart data
  const [chartData, setChartData] = useState({
    timestamps: [],
    s1Current: [],
    s2Current: [],
    s1Voltage: [],
    s2Voltage: [],
  });

  const [latest, setLatest] = useState(null);
  // Relay states
  const [relay1, setRelay1] = useState(false);
  const [relay2, setRelay2] = useState(false);

  // Grabs data from backend every 5 seconds
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API}/api/data?hours=24`);
        const json = await res.json();

        const timestamps = [];
        const s1Current = [];
        const s2Current = [];
        const s1Voltage = [];
        const s2Voltage = [];

        json.forEach((row) => {
          timestamps.push(new Date(`${row.date}T${row.time}`));
          s1Current.push(row.s1_current);
          s2Current.push(row.s2_current);
          s1Voltage.push(row.s1_voltage);
          s2Voltage.push(row.s2_voltage);
        });

        setChartData({
          timestamps,
          s1Current,
          s2Current,
          s1Voltage,
          s2Voltage,
        });

        if (json.length > 0) setLatest(json[json.length - 1]);
        else setLatest(null);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    }

    async function fetchRelayState() {
      try {
        const res = await fetch(`${API}/api/relays`);
        const json = await res.json();
        setRelay1(!json.relay1);
        setRelay2(!json.relay2);
      } catch (err) {
        console.error("Error fetching relay state:", err);
      }
    }

    async function fetchAll() {
      await fetchData();
      await fetchRelayState();
    }

    fetchAll();
    const id = setInterval(fetchAll, 5000);
    return () => clearInterval(id);
  }, []);

  // Latest readings text
  const latestS1Text = latest
    ? `${latest.s1_current.toFixed(2)} mA @ ${latest.s1_voltage.toFixed(2)} V`
    : "No data";

  const latestS2Text = latest
    ? `${latest.s2_current.toFixed(2)} mA @ ${latest.s2_voltage.toFixed(2)} V`
    : "No data";

  // Render the main screen
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#272727ff",
        display: "flex",
        p: 4,
      }}
    >
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            width: 900,
            transform: "scale(1.1)",
            transformOrigin: "top left",
          }}
        >
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            {/* Port 1 Current Chart */}
            <Paper
              sx={{
                p: 2,
                flex: 1,
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="h6">Port 1 Current</Typography>
              <LineChart
                xAxis={[{ data: chartData.timestamps, scaleType: "time" }]}
                series={[
                  { data: chartData.s1Current, label: "mA", showMark: false },
                ]}
                height={200}
                width={260}
              />
            </Paper>

            {/* Port 2 Current Chart */}
            <Paper
              sx={{
                p: 2,
                flex: 1,
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="h6">Port 2 Current</Typography>
              <LineChart
                xAxis={[{ data: chartData.timestamps, scaleType: "time" }]}
                series={[
                  { data: chartData.s2Current, label: "mA", showMark: false },
                ]}
                height={200}
                width={260}
              />
            </Paper>

            {/* Combined Current Chart */}
            <Paper
              sx={{
                p: 2,
                flex: 1,
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="h6">Current Combined</Typography>
              <LineChart
                xAxis={[{ data: chartData.timestamps, scaleType: "time" }]}
                series={[
                  {
                    data: chartData.s1Current,
                    label: "Port 1 (mA)",
                    showMark: false,
                  },
                  {
                    data: chartData.s2Current,
                    label: "Port 2 (mA)",
                    showMark: false,
                  },
                ]}
                height={200}
                width={260}
              />
            </Paper>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            {/* Port 1 Voltage Chart */}
            <Paper
              sx={{
                p: 2,
                flex: 1,
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="h6">Port 1 Voltage</Typography>
              <LineChart
                xAxis={[{ data: chartData.timestamps, scaleType: "time" }]}
                series={[
                  { data: chartData.s1Voltage, label: "V", showMark: false },
                ]}
                height={200}
                width={260}
              />
            </Paper>

            {/* Port 2 Voltage Chart */}
            <Paper
              sx={{
                p: 2,
                flex: 1,
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="h6">Port 2 Voltage</Typography>
              <LineChart
                xAxis={[{ data: chartData.timestamps, scaleType: "time" }]}
                series={[
                  { data: chartData.s2Voltage, label: "V", showMark: false },
                ]}
                height={200}
                width={260}
              />
            </Paper>

            {/* Combined Voltage Chart */}
            <Paper
              sx={{
                p: 2,
                flex: 1,
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="h6">Voltage Combined</Typography>
              <LineChart
                xAxis={[{ data: chartData.timestamps, scaleType: "time" }]}
                series={[
                  {
                    data: chartData.s1Voltage,
                    label: "Port 1 (V)",
                    showMark: false,
                  },
                  {
                    data: chartData.s2Voltage,
                    label: "Port 2 (V)",
                    showMark: false,
                  },
                ]}
                height={200}
                width={260}
              />
            </Paper>
          </Box>
        </Box>

        <Paper
          sx={{
            p: 3,
            ml: 4,
            minWidth: 260,
            height: "fit-content",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <FormControlLabel
            control={
              // Switch for Relay 1
              <MaterialUISwitch
                sx={{ m: 1 }}
                checked={relay1}
                onChange={(e) => {
                  const uiState = e.target.checked;
                  setRelay1(uiState);
                  sendSwitchState(1, !uiState);
                }}
              />
            }
            label={
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {/* Shows port 1 data */}
                <Typography>USB C port 1</Typography>
                <Typography variant="body2" color="text.secondary">
                  {latestS1Text}
                </Typography>
              </Box>
            }
          />

          <FormControlLabel
            control={
              // Switch for Relay 2
              <MaterialUISwitch
                sx={{ m: 1 }}
                checked={relay2}
                onChange={(e) => {
                  const uiState = e.target.checked;
                  setRelay2(uiState);
                  sendSwitchState(2, !uiState);
                }}
              />
            }
            label={
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {/* Shows port 2 data */}
                <Typography>USB C port 2</Typography>
                <Typography variant="body2" color="text.secondary">
                  {latestS2Text}
                </Typography>
              </Box>
            }
          />
        </Paper>
      </Box>
    </Box>
  );
}
