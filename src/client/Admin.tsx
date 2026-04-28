import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";

interface MostReviewedRow {
  Recipe_ID: number;
  Recipe_Name: string;
  Review_Count: number;
}

interface AdminStats {
  totalUsers: number;
  totalRecipes: number;
  mostReviewed: MostReviewedRow[];
  users: string[];
}

const Admin: React.FC = () => {
  const token = localStorage.getItem("authToken");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const res = await fetch("/admin/stats", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.status === 403) throw new Error("Forbidden: you are not an admin");
      if (!res.ok) throw new Error("Failed to load admin stats");
      const body = await res.json();
      setStats(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const deleteRecipe = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Delete recipe?",
      text: `Recipe_ID: ${id}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });
    if (!confirm.isConfirmed) return;

    const res = await fetch(`/admin/recipe/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      await Swal.fire("Error", (body && (body.error || body.message)) || "Failed to delete recipe", "error");
      return;
    }
    await Swal.fire("Deleted", "Recipe deleted.", "success");
    await load();
  };

  const deleteUser = async (email: string) => {
    const confirm = await Swal.fire({
      title: "Delete user?",
      text: email,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });
    if (!confirm.isConfirmed) return;

    const res = await fetch(`/admin/user/${encodeURIComponent(email)}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      await Swal.fire("Error", (body && (body.error || body.message)) || "Failed to delete user", "error");
      return;
    }
    await Swal.fire("Deleted", "User deleted.", "success");
    await load();
  };

  if (error) return <div className="container mt-4">Error: {error}</div>;
  if (!stats) return <div className="container mt-4">Loading admin dashboard...</div>;

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Admin Dashboard</h1>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-0">Total users</h5>
              <div className="display-6">{stats.totalUsers}</div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-0">Total recipes</h5>
              <div className="display-6">{stats.totalRecipes}</div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="mt-4">Most reviewed recipes</h2>
      {stats.mostReviewed.length === 0 ? (
        <div>No reviews yet.</div>
      ) : (
        <div className="list-group">
          {stats.mostReviewed.map((r) => (
            <div key={r.Recipe_ID} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold">{r.Recipe_Name}</div>
                <small className="text-muted">
                  Recipe_ID: {r.Recipe_ID} • Reviews: {r.Review_Count}
                </small>
              </div>
              <button className="btn btn-sm btn-danger" onClick={() => deleteRecipe(r.Recipe_ID)}>
                Delete recipe
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-4">Users</h2>
      <div className="list-group">
        {stats.users.map((u) => (
          <div key={u} className="list-group-item d-flex justify-content-between align-items-center">
            <div>{u}</div>
            <button className="btn btn-sm btn-outline-danger" onClick={() => deleteUser(u)}>
              Delete user
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;

