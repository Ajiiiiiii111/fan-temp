import "./App.css";
import { useEffect, useState, useRef } from "react";
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

  // holds latest fanSpeed even between renders
  const fanSpeedRef = useRef(0);

  const getLogInfo = (temp, speed) => {
    if (speed === 0) return { mode: "OFF" };
    if (speed === 50) return { mode: "MEDIUM" };
    return { mode: "MAX" };
  };

  useEffect(() => {
    const tempRef = ref(db, "sensor/temperature");
    const fanRef = ref(db, "fan");

    // Listen for FAN changes first
    const unsubFan = onValue(fanRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const speed = data.speed ?? 0;
      fanSpeedRef.current = speed; // store latest speed
      setFanSpeed(speed);
      setFanMode(data.mode ?? "auto");

      // push to graph when fan changes
      const time = new Date().toLocaleTimeString();
      setHistory((prev) => ({
        labels: [...prev.labels, time].slice(-10),
        temps: [...prev.temps, temperature].slice(-10),
        speeds: [...prev.speeds, speed].slice(-10),
      }));
    });

    // Listen for TEMP changes second
    const unsubTemp = onValue(tempRef, (snapshot) => {
      const temp = snapshot.val();
      if (temp === null) return;

      setTemperature(temp);

      const speed = fanSpeedRef.current;
      const info = getLogInfo(temp, speed);
      const time = new Date().toLocaleTimeString();

      // Update activity logs
      setActivityLogs((prev) => {
        const newLog = { temp, mode: info.mode, time };
        return [newLog, ...prev].slice(0, 3);
      });

      // Update chart with temp + speed every tick
      setHistory((prev) => ({
        labels: [...prev.labels, time].slice(-10),
        temps: [...prev.temps, temp].slice(-10),
        speeds: [...prev.speeds, speed].slice(-10),
      }));
    });

    return () => {
      unsubTemp();
      unsubFan();
    };
  }, [temperature]);

  // Manual mode
  const setFanManual = (speed) => {
    set(ref(db, "fan"), { speed, mode: "manual" });
    fanSpeedRef.current = speed;
    setFanSpeed(speed);

    const time = new Date().toLocaleTimeString();
    const info = getLogInfo(temperature, speed);

    setActivityLogs((prev) => {
      const newLog = { temp: temperature, mode: info.mode, time };
      return [newLog, ...prev].slice(0, 3);
    });

    setHistory((prev) => ({
      labels: [...prev.labels, time].slice(-10),
      temps: [...prev.temps, temperature].slice(-10),
      speeds: [...prev.speeds, speed].slice(-10),
    }));
  };

  // Auto mode
  const setFanAuto = () => {
    set(ref(db, "fan"), { speed: fanSpeedRef.current, mode: "auto" });

    const time = new Date().toLocaleTimeString();
    const info = getLogInfo(temperature, fanSpeedRef.current);

    setActivityLogs((prev) => {
      const newLog = { temp: temperature, mode: info.mode, time };
      return [newLog, ...prev].slice(0, 3);
    });

    setHistory((prev) => ({
      labels: [...prev.labels, time].slice(-10),
      temps: [...prev.temps, temperature].slice(-10),
      speeds: [...prev.speeds, fanSpeedRef.current].slice(-10),
    }));
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

            {/* TEMP */}
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

            {/* FAN CONTROL */}
            <div className="card center fan-card">
              <h3>Fan Speed Control</h3>
              <div className="fan-value">{fanSpeed}%</div>
              <p className="fan-sub">Mode: {fanMode.toUpperCase()}</p>

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

            {/* ACTIVITY LOG */}
            <div className="card">
              <h3>Activity Log</h3>
              {activityLogs.map((log, i) => (
                <div key={i} className="log-item">
                  Temperature changed to {log.temp.toFixed(2)}°C (Fan {log.mode}) {log.time}
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
