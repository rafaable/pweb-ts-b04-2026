const KEYS = {
    session: "session",
    queueTypes: "queueTypes",
    tickets: "tickets",
};
function read(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
export function getSession() {
    return read(KEYS.session, null);
}
export function saveSession(session) {
    write(KEYS.session, session);
}
export function clearSession() {
    localStorage.removeItem(KEYS.session);
}
export function getQueueTypes() {
    return read(KEYS.queueTypes, []);
}
export function saveQueueTypes(types) {
    write(KEYS.queueTypes, types);
}
export function getTickets() {
    return read(KEYS.tickets, []);
}
export function saveTickets(tickets) {
    write(KEYS.tickets, tickets);
}
