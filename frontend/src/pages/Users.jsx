import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import { useForm } from "../hooks/useForm";
import { ROLES } from "../utils/constants";
import { titleCase, downloadCsv } from "../utils/helpers";
import { PanelHeader, Select, DataTable, Badge, RowActions, Modal, Loading, ErrorState } from "../components/ui";

export function Users() {
  const { setNotice } = useOutletContext();
  const { data = [], loading, error, refresh } = useAsync(api.users, []);
  const form = useForm({ name: "", email: "", password: "", role: "BDE" });
  const [editing, setEditing] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  async function submit(event) {
    event.preventDefault();
    try {
      if (editing) {
        await api.updateUser(editing.id, { name: form.values.name, email: form.values.email, role: form.values.role });
        setNotice("User updated");
      } else {
        await api.createUser(form.values);
        setNotice("User created");
      }
      form.reset();
      setEditing(null);
      refresh();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function toggleStatus(user) {
    await api.updateUserStatus(user.id, !user.isActive);
    setNotice(`User ${!user.isActive ? "activated" : "deactivated"}`);
    refresh();
  }

  async function resetPasswordSubmit(event) {
    event.preventDefault();
    await api.resetPassword(resetTarget.id, newPassword);
    setNotice("Password reset");
    setResetTarget(null);
    setNewPassword("");
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  return (
    <section className="stack">
      <PanelHeader title="User management" action={<button onClick={() => downloadCsv("users.csv", data)}>Export CSV</button>} />
      <form className="form-grid" onSubmit={submit}>
        <label>Name<input value={form.values.name} onChange={(e) => form.set("name", e.target.value)} required /></label>
        <label>Email<input type="email" value={form.values.email} onChange={(e) => form.set("email", e.target.value)} required /></label>
        {!editing && <label>Password<input type="password" minLength="8" value={form.values.password} onChange={(e) => form.set("password", e.target.value)} required /></label>}
        <label>Role<Select value={form.values.role} onChange={(e) => form.set("role", e.target.value)} options={ROLES} /></label>
        <button className="primary">{editing ? "Save user" : "Create user"}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); form.reset(); }}>Cancel</button>}
      </form>
      <DataTable
        columns={["Name", "Email", "Role", "Status", "Actions"]}
        rows={data.map((u) => [
          u.name,
          u.email,
          titleCase(u.role?.name || u.role),
          <Badge tone={u.isActive ? "success" : "danger"}>{u.isActive ? "Active" : "Disabled"}</Badge>,
          <RowActions>
            <button onClick={() => { setEditing(u); form.setValues({ name: u.name, email: u.email, password: "", role: u.role?.name || u.role }); }}>Edit</button>
            <button onClick={() => toggleStatus(u)}>{u.isActive ? "Disable" : "Enable"}</button>
            <button onClick={() => setResetTarget(u)}>Reset password</button>
          </RowActions>,
        ])}
      />
      {resetTarget && (
        <Modal title={`Reset password for ${resetTarget.name}`} onClose={() => setResetTarget(null)}>
          <form className="stack" onSubmit={resetPasswordSubmit}>
            <label>New password<input type="password" minLength="8" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></label>
            <button className="primary">Update password</button>
          </form>
        </Modal>
      )}
    </section>
  );
}
