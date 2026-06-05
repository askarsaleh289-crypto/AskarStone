import React, { useEffect, useState } from "react";
import API, { assetUrl } from "../api";
import "../styles/project.css";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    API.get("/projects")
      .then((r) => setProjects(r.data))
      .catch((e) => console.error(e));
  }, []);

  return (
    <div className="projects-page">
      <h3>
        <span>Our</span> Projects
      </h3>

      <div className="row g-3">
        {projects.length === 0 ? (
          <div className="projects-empty">
            No projects are available yet.
          </div>
        ) : projects.map((p) => (
          <div className="col-md-4" key={p.id}>
            <div className="card admin-card">
              <img
                src={assetUrl(`uploads/projects/${p.image}`)}
                className="card-img-top project-img"
                alt={p.title}
                onClick={() => setSelected(p)}
                onError={(e) => {
                  e.currentTarget.src = "/images/hajar-arsali.png";
                }}
              />

              <div className="card-body">
                <h5>{p.title}</h5>
                <p>{p.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

 
      {selected && (
        <div className="project-modal" onClick={() => setSelected(null)}>
          <div
            className="project-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setSelected(null)}
            >
              x
            </button>

            <img
              src={assetUrl(`uploads/projects/${selected.image}`)}
              alt={selected.title}
              onError={(e) => {
                e.currentTarget.src = "/images/hajar-arsali.png";
              }}
            />

            <h4>{selected.title}</h4>
            <p>{selected.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
