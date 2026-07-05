const API = "http://localhost:3000/api/users";
let editingId = null;

// --------------------------------------------------------
// SHOW SQL: just for learning -- displays what ran
// --------------------------------------------------------
function showSQL(type, data = {}) {
  const el = document.getElementById("sql-display");
  const kw = (s) => `<span class="keyword">${s}</span>`;
  const val = (s) => `<span class="value">'${s}'</span>`;

  const queries = {
    getAll: `${kw("SELECT")} id, name, email, created_at\n${kw("FROM")} users\n${kw("ORDER BY")} id ASC;`,
    create: `${kw("INSERT INTO")} users (name, email, password)\n${kw("VALUES")} (${val(data.name)}, ${val(data.email)}, ${val("[bcrypt hash]")})\n${kw("RETURNING")} id, name, email, created_at;`,
    update: `${kw("UPDATE")} users\n${kw("SET")} name = ${val(data.name || "...")}, email = ${val(data.email || "...")}\n${kw("WHERE")} id = ${val(data.id)}\n${kw("RETURNING")} id, name, email, created_at;`,
    delete: `${kw("DELETE FROM")} users\n${kw("WHERE")} id = ${val(data.id)}\n${kw("RETURNING")} id, name;`,
  };

  el.innerHTML = queries[type] || "";
}

// --------------------------------------------------------
// LOAD ALL USERS (READ)
// --------------------------------------------------------
async function loadUsers() {
  showSQL("getAll");
  const res = await fetch(API);
  const users = await res.json();

  document.getElementById("count-badge").textContent = users.length;
  const tbody = document.getElementById("users-body");

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No users yet. Create one!</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr>
      <td class="id-cell">#${u.id}</td>
      <td>${u.name}</td>
      <td class="email-cell">${u.email}</td>
      <td class="date-cell">${new Date(u.created_at).toLocaleDateString()}</td>
      <td>
        <div class="actions">
          <button class="btn-edit" onclick="startEdit(${u.id}, '${u.name}', '${u.email}')">Edit</button>
          <button class="btn-del" onclick="deleteUser(${u.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

// --------------------------------------------------------
// SUBMIT FORM (CREATE or UPDATE)
// --------------------------------------------------------
async function submitForm() {
  const name     = document.getElementById("input-name").value.trim();
  const email    = document.getElementById("input-email").value.trim();
  const password = document.getElementById("input-password").value;

  if (!name || !email || (!editingId && !password)) {
    showFeedback("error", "Please fill in all fields.");
    return;
  }

  const body = { name, email };
  if (password) body.password = password;

  try {
    let res, user;

    if (editingId) {
      // UPDATE
      showSQL("update", { id: editingId, name, email });
      res = await fetch(`${API}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      // CREATE
      showSQL("create", { name, email });
      res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    const data = await res.json();

    if (!res.ok) {
      showFeedback("error", data.error);
      return;
    }

    showFeedback("success", editingId ? `Updated user #${data.id}` : `Created user #${data.id}!`);
    resetForm();
    loadUsers();

  } catch (err) {
    showFeedback("error", "Could not reach the server. Is it running?");
  }
}

// --------------------------------------------------------
// DELETE USER
// --------------------------------------------------------
async function deleteUser(id) {
  if (!confirm(`Delete user #${id}?`)) return;
  showSQL("delete", { id });

  const res = await fetch(`${API}/${id}`, { method: "DELETE" });
  const data = await res.json();

  if (!res.ok) {
    showFeedback("error", data.error);
    return;
  }

  showFeedback("success", data.message);
  loadUsers();
}

// --------------------------------------------------------
// EDIT MODE: pre-fill the form
// --------------------------------------------------------
function startEdit(id, name, email) {
  editingId = id;
  document.getElementById("input-name").value = name;
  document.getElementById("input-email").value = email;
  document.getElementById("input-password").value = "";

  const badge = document.getElementById("mode-badge");
  badge.textContent = `EDIT MODE (id: ${id})`;
  badge.classList.add("edit-mode");

  document.getElementById("btn-submit").textContent = "Save Changes";
  document.getElementById("btn-cancel").style.display = "block";
}

function resetForm() {
  editingId = null;
  document.getElementById("input-name").value = "";
  document.getElementById("input-email").value = "";
  document.getElementById("input-password").value = "";

  const badge = document.getElementById("mode-badge");
  badge.textContent = "CREATE MODE";
  badge.classList.remove("edit-mode");

  document.getElementById("btn-submit").textContent = "Create User";
  document.getElementById("btn-cancel").style.display = "none";
  document.getElementById("feedback").className = "";
  document.getElementById("feedback").style.display = "none";
}

function showFeedback(type, msg) {
  const el = document.getElementById("feedback");
  el.textContent = msg;
  el.className = type;
}

// Load users on page open
loadUsers();