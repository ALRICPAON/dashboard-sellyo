<!-- ===== Cartes bonus ===== -->
<section id="kpis-boost" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px">
  <div class="card"><div class="kpi-label">Leads (7 jours)</div><div id="kpi-leads-7d" class="kpi-value">—</div></div>
  <div class="card"><div class="kpi-label">Emails envoyés (7 jours)</div><div id="kpi-emails-7d" class="kpi-value">—</div></div>
  <div class="card"><div class="kpi-label">Scripts vidéo (7 jours)</div><div id="kpi-scripts-7d" class="kpi-value">—</div></div>
</section>

<!-- ===== Courbe d’activité ===== -->
<section style="margin-top:24px">
  <div class="card" style="padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div class="kpi-label" style="font-size:14px;opacity:.9">Activité quotidienne (30 derniers jours)</div>
      <div>
        <label style="font-size:12px;opacity:.8;margin-right:6px">Séries</label>
        <select id="series-select">
          <option value="all" selected>Leads + Emails + Scripts + Tunnels</option>
          <option value="leads">Leads</option>
          <option value="emails">Emails</option>
          <option value="scripts">Scripts</option>
          <option value="tunnels">Tunnels</option>
        </select>
      </div>
    </div>
    <canvas id="chart-activity" height="120"></canvas>
  </div>
</section>

<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
