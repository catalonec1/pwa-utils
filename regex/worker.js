/* Rulează regex-ul în afara firului UI: un model cu backtracking catastrofal blochează doar workerul, pe care app.js îl oprește la timeout. */
importScripts('logic.js');
self.onmessage = e => {
  let res;
  try { res = RegexLogic.run(e.data); } catch (err) { res = { error: String(err && err.message || err) }; }
  self.postMessage({ id: e.data.id, res });
};
