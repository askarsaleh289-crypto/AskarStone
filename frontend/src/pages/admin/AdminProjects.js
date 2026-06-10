import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API, { assetUrl } from "../../api";
import { confirmWithToast } from "../../utils/confirmToast";
import "../../styles/admin-projects.css";

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await API.get("/projects");
      setProjects(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load projects.");
    }
  };

  const createProject = async (e) => {
    e.preventDefault();

    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      if (image) fd.append("image", image);

      await API.post("/projects", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTitle("");
      setDescription("");
      setImage(null);
      toast.success("Project added.");
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add project.");
    }
  };

  const deleteProject = async (id) => {
    confirmWithToast({
      message: "Delete this project?",
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await API.delete(`/projects/${id}`);
          toast.success("Project deleted.");
          fetchProjects();
        } catch (err) {
          console.error(err);
          toast.error("Failed to delete project.");
        }
      },
    });
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <h3>Manage Projects</h3>

        <form onSubmit={createProject} className="admin-form">
          <input
            className="form-control mb-2"
            placeholder="Project title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            className="form-control mb-2"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            className="form-control mb-3"
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
          />

          <button className="btn btn-primary">Add Project</button>
        </form>

        <div className="row g-4">
          {projects.map((p) => (
            <div className="col-md-4" key={p.id}>
              <div className="admin-project-card">
                <img src={assetUrl(`uploads/projects/${p.image}`)} alt={p.title} />
                <div className="card-body">
                  <h5>{p.title}</h5>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteProject(p.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
