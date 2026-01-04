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

  /* ================= STATE ================= */
  const [temperature, setTemperature] = useState(0);
  const [fanSpeed, setFanSpeed] = useState(0);
  const [fanMode, setFanMode] = useState("auto");
  const [activityLogs, setActivityLogs] = useState([]);

  /* ================= HELPERS ================= */
  const getLogInfo = (temp) => {
    if (temp < 20) return { color: "blue", label: "Fan OFF" };
    if (temp < 25) return { color: "green", label: "Fan LOW" };
    if (temp < 30) return { color: "yellow", label: "Fan MEDIUM" };
    if (temp < 35) return { color: "orange", label: "Fan HIGH" };
    return { color: "red", label: "Fan MAX" };
  };

  const [history, setHistory] = useState({
  labels: [],
  temps: [],
  speeds: [],
});


  /* ================= FIREBASE FLOW ================= */
  useEffect(() => {
    const tempRef = ref(db, "sensor/temperature");
    const fanRef = ref(db, "fan");

    const unsubscribeTemp = onValue(tempRef, (snapshot) => {
      const temp = snapshot.val();
      if (temp === null) return;

      setTemperature(temp);

      setHistory((prev) => {
  const time = new Date().toLocaleTimeString();

  return {
    labels: [...prev.labels, time].slice(-10),
    temps: [...prev.temps, temp].slice(-10),
    speeds: [...prev.speeds, fanSpeed].slice(-10),
  };
});


      // ACTIVITY LOG (LAST 3 ONLY)
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

      // AUTO MODE FAN CONTROL
      if (fanMode === "auto") {
        let speed = 0;

        if (temp < 20) speed = 0;
        else if (temp < 25) speed = 25;
        else if (temp < 30) speed = 50;
        else if (temp < 35) speed = 75;
        else speed = 100;

        set(ref(db, "fan"), {
          speed,
          mode: "auto",
        });
      }
    });

    const unsubscribeFan = onValue(fanRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      setFanSpeed(data.speed);
      setFanMode(data.mode);
    });

    return () => {
      unsubscribeTemp();
      unsubscribeFan();
    };
  }, [fanMode]);

  /* ================= MANUAL CONTROL ================= */
  const setFanManual = (speed) => {
    set(ref(db, "fan"), {
      speed,
      mode: "manual",
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
  plugins: {
    legend: {
      position: "bottom",
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
    },
  },
};


  return (
    <div className="page">
      <div className="container">

        {/* HEADER */}
        <header className="header">
          <h1>
            presk<span className="fan">🌀</span>
          </h1>
          <p>IoT Temperature-Based Fan Control System</p>
        </header>

        {/* CENTERED CARD GROUP */}
        <div className="cards-wrapper">
          <section className="top-cards">

            {/* TEMPERATURE CARD */}
            <div className="card">
              <h3>Current Temperature</h3>

              <div className="temp-box">
                <span className="temp-value">{temperature}°C</span>
              </div>

              <div className="zones">
                <div>
                  <p className="blue1">Cool (&lt;20°C)</p>
                  <p className="green1">20–25°C</p>
                  <p className="yellow1">25–30°C</p>
                  <p className="orange1">30–35°C</p>
                  <p className="red1">&gt;35°C</p>
                </div>
                <div>
                  <p><b>Fan OFF</b></p>
                  <p><b>Fan LOW</b></p>
                  <p><b>Fan MEDIUM</b></p>
                  <p><b>Fan HIGH</b></p>
                  <p><b>Fan MAX</b></p>
                </div>
              </div>
            </div>

            {/* FAN CONTROL CARD */}
            <div className="card center fan-card">
              <h3>Fan Speed Control</h3>

              <div className="fan-value">{fanSpeed}%</div>
              <p className="fan-sub">
                Mode: {fanMode.toUpperCase()}
              </p>

              <div className="fan-buttons">
                <button onClick={() => setFanManual(0)}>
                  0%<br /><span>OFF</span>
                </button>
                <button onClick={() => setFanManual(25)}>
                  25%<br /><span>LOW</span>
                </button>
                <button onClick={() => setFanManual(50)}>
                  50%<br /><span>MEDIUM</span>
                </button>
                <button onClick={() => setFanManual(75)}>
                  75%<br /><span>HIGH</span>
                </button>
                <button onClick={() => setFanManual(100)}>
                  100%<br /><span>MAX</span>
                </button>
              </div>
            </div>

            {/* ACTIVITY LOG */}
            <div className="card">
              <h3>Activity Log</h3>

              {activityLogs.map((log, index) => (
                <div key={index} className={`log ${log.color}`}>
                  Temperature changed to {log.temp}°C ({log.label}) 
                  <span>{log.time}</span>
                </div>
              ))}
            </div>

          </section>
        </div>

        {/* HISTORY */}
        <section className="history card">
   <Line data={chartData} options={chartOptions} />

        </section>

      </div>
    </div>
  );
}
