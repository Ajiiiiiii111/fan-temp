import "./App.css";

export default function App() {
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

            <div className="card">
              <h3>Current Temperature</h3>

              <div className="temp-box">
                <span className="temp-value">35.5°C</span>
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

            <div className="card center fan-card">

              <h3>Fan Speed Control</h3>

              <div className="fan-value">100%</div>
              <p className="fan-sub">Speed: MAX</p>

              <div className="fan-buttons">
                <button>0%<br /><span>OFF</span></button>
                <button>25%<br /><span>LOW</span></button>
                <button>50%<br /><span>MEDIUM</span></button>
                <button>75%<br /><span>HIGH</span></button>
                <button className="active">100%<br /><span>MAX</span></button>
              </div>
            </div>

            <div className="card">
              <h3>Activity Log</h3>

              <div className="log green">
                Temperature changed to 23°C <br />
                <span>4:29:03 PM</span>
              </div>
              <div className="log blue"></div>
              <div className="log yellow"></div>
              <div className="log red"></div>
            </div>

          </section>
        </div>

        {/* HISTORY */}
        <section className="history card">
          <h3>Historical Temperature Data</h3>
          <div className="chart-placeholder">
            Temperature (°C) & Fan Speed (%) Chart
          </div>
        </section>

      </div>
    </div>
  );
}
