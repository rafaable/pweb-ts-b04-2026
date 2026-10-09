// Paste into the browser console on any page of this site (same origin) to test operator.html alone.
// Then open operator.html.
localStorage.setItem("session", JSON.stringify({ token: "fake-token", role: "user", firstName: "Tester" }));
localStorage.setItem("queueTypes", JSON.stringify([
  { code: "A", name: "Poli Umum", active: true, lastNumber: 5 },
  { code: "B", name: "Poli Gigi", active: true, lastNumber: 2 },
  { code: "C", name: "Farmasi", active: false, lastNumber: 0 },
]));
const now = Date.now();
localStorage.setItem("tickets", JSON.stringify([
  { id: "A-001", code: "A", number: 1, priority: "normal", status: "done", createdAt: now - 600000 },
  { id: "A-002", code: "A", number: 2, priority: "normal", status: "called", createdAt: now - 500000 },
  { id: "A-003", code: "A", number: 3, priority: "normal", status: "waiting", createdAt: now - 400000 },
  { id: "A-004", code: "A", number: 4, priority: "vip", status: "waiting", createdAt: now - 300000 },
  { id: "A-005", code: "A", number: 5, priority: "lansia", status: "waiting", createdAt: now - 200000 },
  { id: "B-001", code: "B", number: 1, priority: "disabilitas", status: "waiting", createdAt: now - 100000 },
  { id: "B-002", code: "B", number: 2, priority: "normal", status: "waiting", createdAt: now - 50000 },
]));
location.reload();
