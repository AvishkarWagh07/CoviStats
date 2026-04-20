import { useState, useEffect } from "react";
import "./App.css";

function getColor(perMillion) {
  if (!perMillion) return "rgba(26,26,26,0.3)";
  if (perMillion > 100000) return "#b05252";
  if (perMillion > 50000) return "#a08060";
  if (perMillion > 10000) return "#8a9a6a";
  return "#6a9a7a";
}

function getLabel(perMillion) {
  if (!perMillion) return "Unknown";
  if (perMillion > 100000) return "Critical";
  if (perMillion > 50000) return "High";
  if (perMillion > 10000) return "Moderate";
  return "Low";
}

function pretty(n) {
  if (n == null) return "N/A";
  return n.toLocaleString();
}

function Card({ country }) {
  const color = getColor(country.casesPerOneMillion);
  const label = getLabel(country.casesPerOneMillion);

  return (
    <div className="card">
      <div className="card-inner">
        <div className="card-header">
          <div className="country-info">
            <img className="flag" src={country.countryInfo?.flag} alt={country.country} />
            <span className="cname">{country.country}</span>
          </div>
          <span className="badge" style={{ color, background: color + "18" }}>
            {label}
          </span>
        </div>

        <div className="stat-row">
          <div className="stat-cell">
            <span className="stat-val" style={{ color: "#b05252" }}>{pretty(country.cases)}</span>
            <span className="stat-name">Cases</span>
          </div>
          <div className="divider-line" />
          <div className="stat-cell">
            <span className="stat-val" style={{ color: "#6a9a7a" }}>{pretty(country.recovered)}</span>
            <span className="stat-name">Recovered</span>
          </div>
          <div className="divider-line" />
          <div className="stat-cell">
            <span className="stat-val" style={{ color: "#8a8278" }}>{pretty(country.deaths)}</span>
            <span className="stat-name">Deaths</span>
          </div>
        </div>

        <span className="per-mil">{pretty(country.casesPerOneMillion)} per million</span>
      </div>
    </div>
  );
}

function GhostCard() {
  return (
    <div className="card">
      <div className="card-inner" style={{ gap: "0.8rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="ghost" style={{ height: 13, width: "45%" }} />
          <div className="ghost" style={{ height: 13, width: "18%" }} />
        </div>
        <div className="ghost" style={{ height: 52, borderRadius: 8 }} />
        <div className="ghost" style={{ height: 11, width: "50%" }} />
      </div>
    </div>
  );
}

export default function CoviStats() {
  const [countries, setCountries] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [search, setSearch] = useState("");
  const [chosenCountry, setChosenCountry] = useState("");
  const [view, setView] = useState("card");
  const [severity, setSeverity] = useState("all");
  const [sortBy, setSortBy] = useState("cases");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch("https://disease.sh/v3/covid-19/countries")
      .then(res => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then(data => {
        setCountries(data);
        setLoading(false);
      })
      .catch(e => {
        setErr(e.message);
        setLoading(false);
      });


    fetch("https://disease.sh/v3/covid-19/all")
      .then(res => res.json())
      .then(data => setGlobalStats(data))
      .catch(() => {});
  }, []);

  let visible = [...countries];

  if (chosenCountry) {
    visible = visible.filter(c => c.country === chosenCountry);
  } else if (search.trim()) {
    visible = visible.filter(c =>
      c.country.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (severity !== "all") {
    visible = visible.filter(c =>
      getLabel(c.casesPerOneMillion).toLowerCase() === severity
    );
  }


  visible.sort((a, b) => {
    if (sortBy === "cases") return (b.cases || 0) - (a.cases || 0);
    if (sortBy === "deaths") return (b.deaths || 0) - (a.deaths || 0);
    if (sortBy === "recovered") return (b.recovered || 0) - (a.recovered || 0);
    if (sortBy === "az") return a.country.localeCompare(b.country);
    return 0;
  });

  const allNames = countries.map(c => c.country).sort();

  return (
    <>

      <nav className="topbar">
        <div className="logo">CoviStats</div>
      </nav>

      <div className="intro">
        <span className="tag">Live Global Data</span>
        <h1>Track the <em>world's</em> COVID-19 story.</h1>
        <p>Cases, recoveries, and deaths across every country — updated in real time from disease.sh.</p>
      </div>

      {globalStats && (
        <div className="overview">
          <div className="overview-box">
            <span className="big-number">{pretty(globalStats.cases)}</span>
            <span className="box-label">Total Cases</span>
          </div>
          <div className="overview-box">
            <span className="big-number">{pretty(globalStats.recovered)}</span>
            <span className="box-label">Recovered</span>
          </div>
          <div className="overview-box">
            <span className="big-number">{pretty(globalStats.deaths)}</span>
            <span className="box-label">Deaths</span>
          </div>
          <div className="overview-box">
            <span className="big-number">{pretty(globalStats.active)}</span>
            <span className="box-label">Active</span>
          </div>
        </div>
      )}

      <div className="filters">
        <div className="pills">
          {["all", "critical", "high", "moderate", "low"].map(s => (
            <button
              key={s}
              className={`pill-btn ${severity === s ? "selected" : ""}`}
              onClick={() => setSeverity(s)}
            >
              {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="middle-search">
          <span>&#9906;</span>
          <input
            type="text"
            placeholder="Search country..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setChosenCountry("");
            }}
          />
        </div>

        <div className="right-side">
          <select
            className="dropdown"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="cases">Most Cases</option>
            <option value="deaths">Most Deaths</option>
            <option value="recovered">Most Recovered</option>
            <option value="az">A — Z</option>
          </select>

          <select
            className="dropdown"
            value={chosenCountry}
            onChange={e => {
              setChosenCountry(e.target.value);
              setSearch("");
            }}
          >
            <option value="">All countries</option>
            {allNames.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <button
            className={`toggle-btn ${view === "card" ? "selected" : ""}`}
            onClick={() => setView("card")}
          >
            Card
          </button>
          <button
            className={`toggle-btn ${view === "table" ? "selected" : ""}`}
            onClick={() => setView("table")}
          >
            Table
          </button>
        </div>
      </div>

      <div className="result-count">
        {loading ? "loading..." : `${visible.length} ${visible.length === 1 ? "country" : "countries"}`}
      </div>

      {err && (
        <p style={{ textAlign: "center", color: "#b05252", padding: "2rem" }}>
          Something went wrong: {err}
        </p>
      )}

      {view === "card" && (
        <div className="cards">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <GhostCard key={i} />)
            : visible.length === 0
            ? <div className="nothing">nothing matched that filter</div>
            : visible.map(c => (
                <Card key={c.countryInfo?._id || c.country} country={c} />
              ))
          }
        </div>
      )}

      {view === "table" && !loading && (
        <div className="table-section">
          {visible.length === 0 ? (
            <div className="nothing">nothing matched that filter</div>
          ) : (
            <div className="table-box">
              <table>
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Cases</th>
                    <th>Recovered</th>
                    <th>Deaths</th>
                    <th>Per Million</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(c => {
                    const color = getColor(c.casesPerOneMillion);
                    const label = getLabel(c.casesPerOneMillion);
                    return (
                      <tr key={c.countryInfo?._id || c.country}>
                        <td>
                          <img
                            src={c.countryInfo?.flag}
                            alt={c.country}
                            style={{ width: 24, height: 16, objectFit: "cover", borderRadius: 2, marginRight: 8, verticalAlign: "middle" }}
                          />
                          {c.country}
                        </td>
                        <td style={{ color: "#b05252", fontWeight: 600 }}>{pretty(c.cases)}</td>
                        <td style={{ color: "#6a9a7a", fontWeight: 600 }}>{pretty(c.recovered)}</td>
                        <td style={{ color: "#8a8278", fontWeight: 600 }}>{pretty(c.deaths)}</td>
                        <td>{pretty(c.casesPerOneMillion)}</td>
                        <td>
                          <span style={{ fontSize: "0.68rem", fontWeight: 600, padding: "0.18rem 0.6rem", borderRadius: 20, color, background: color + "18" }}>
                            {label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <footer className="footer">
        © 2025 Avishkar Wagh. All rights reserved.
      </footer>
    </>
  );
}