import "./App.css";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { ref, onValue, set } from "firebase/database";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function App() {
  const [temperature, setTemperature] = useState(0);
  const [fanSpeed, setFanSpeed] = useState(0);
  const [fanMode, setFanMode] = useState("auto");
  const [activityLogs, setActivityLogs] = useState([]);

  const [history, setHistory] = useState({
    labels: [],
    temps: [],
    speeds: [],
  });

  let latestFanSpeed = fanSpeed; // keep fresh speed for chart

  // Updated ranges
  const getLogInfo = (temp) => {
    if (temp <= 35) return { color: "blue", label: "Fan OFF" };
    if (temp <= 39) return { color: "orange", label: "Fan MEDIUM" };
    return { color: "red", label: "Fan MAX" };
  };

  useEffect(() => {
    const tempRef = ref(db, "sensor/temperature");
    const fanRef = ref(db, "fan");

    // FAN LISTENER FIRST
    const unsubFan = onValue(fanRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      latestFanSpeed = data.speed ?? 0;
      setFanSpeed(latestFanSpeed);
      setFanMode(data.mode ?? "auto");
    });

    // TEMP LISTENER SECOND
    const unsubTemp = onValue(tempRef, (snapshot) => {
      const temp = snapshot.val();
      if (temp === null) return;

      setTemperature(temp);

      setHistory((prev) => {
        const time = new Date().toLocaleTimeString();
        return {
          labels: [...prev.labels, time].slice(-10),
          temps: [...prev.temps, temp].slice(-10),
          speeds: [...prev.speeds, latestFanSpeed].slice(-10),
        };
      });

      const info = getLogInfo(temp);
      setActivityLogs((prev) => {
        const newLog = {
          temp,
          label: info.label,
          color: info.color,
          time: new Date().toLocaleTimeString(),
        };
        return [newLog, ...prev].slice(0, 3);
      });
    });

    return () => {
      unsubTemp();
      unsubFan();
    };
  }, []);

  // Manual Mode
  const setFanManual = (speed) => {
    set(ref(db, "fan"), { speed, mode: "manual" });

    // Instant local update so chart reacts immediately
    setFanSpeed(speed);

    // Add to history
    setHistory((prev) => {
      const time = new Date().toLocaleTimeString();
      return {
        labels: [...prev.labels, time].slice(-10),
        temps: [...prev.temps, temperature].slice(-10),
        speeds: [...prev.speeds, speed].slice(-10),
      };
    });
  };

  // Auto Mode
  const setFanAuto = () => {
    set(ref(db, "fan"), { speed: fanSpeed, mode: "auto" });

    // Add point to graph for mode switch
    setHistory((prev) => {
      const time = new Date().toLocaleTimeString();
      return {
        labels: [...prev.labels, time].slice(-10),
        temps: [...prev.temps, temperature].slice(-10),
        speeds: [...prev.speeds, fanSpeed].slice(-10),
      };
    });
  };

  const chartData = {
    labels: history.labels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: history.temps,
        borderColor: "#ff6b6b",
        backgroundColor: "#ff6b6b",
        tension: 0.4,
      },
      {
        label: "Fan Speed (%)",
        data: history.speeds,
        borderColor: "#4dabf7",
        backgroundColor: "#4dabf7",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: "bottom" } },
    scales: { y: { beginAtZero: true, max: 100 } },
  };

  return (
    <div className="page">
      <div className="container">

        <header className="header">
          <img src="/logo.svg" alt="Logo" className="logo" />
          <p>IoT Temperature-Based Fan Control System</p>
        </header>

        <div className="cards-wrapper">
          <section className="top-cards">

            <div className="card">
              <h3>Current Temperature</h3>
              <div className="temp-box">
                <span className="temp-value">{temperature}°C</span>
              </div>

              <div className="zones">
                <div>
                  <p className="blue1">Cool (&lt;= 35°C)</p>
                  <p className="orange1">36–39°C</p>
                  <p className="red1">&gt;= 40°C</p>
                </div>
                <div>
                  <p><b>Fan OFF</b></p>
                  <p><b>Fan MEDIUM</b></p>
                  <p><b>Fan MAX</b></p>
                </div>
              </div>
            </div>

            <div className="card center fan-card">
              <h3>Fan Speed Control</h3>
              <div className="fan-value">{fanSpeed}%</div>
              <p className="fan-sub">Mode: {(fanMode || "auto").toUpperCase()}</p>

              <div className="fan-buttons">
                <button onClick={() => setFanManual(0)}>0%<br /><span>OFF</span></button>
                <button onClick={() => setFanManual(50)}>50%<br /><span>MEDIUM</span></button>
                <button onClick={() => setFanManual(100)}>100%<br /><span>MAX</span></button>
              </div>

              <div className="fan-buttons">
                <button onClick={() => setFanManual(fanSpeed)}>MANUAL</button>
                <button onClick={setFanAuto}>AUTO</button>
              </div>
            </div>

            <div className="card">
              <h3>Activity Log</h3>
              {activityLogs.map((log, i) => (
                <div key={i} className={`log ${log.color}`}>
                  Temperature changed to {log.temp}°C ({log.label})
                  <span>{log.time}</span>
                </div>
              ))}
            </div>

          </section>
        </div>

        <section className="history card">
          <Line data={chartData} options={chartOptions} />
        </section>

      </div>
    </div>
  );
}
