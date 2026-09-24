/* =====================================================================
   CUMPLEAÑOS — tarjetas ordenadas por mes y día, con la fecha de nacimiento de cada colaborador
   ===================================================================== */
VIEWS.cumpleanos = async el => {
  await loadBase();
  const hoy = new Date(), y = hoy.getFullYear(), hoyD = new Date(y, hoy.getMonth(), hoy.getDate());
  const filtroMes = S.bdMes ?? 'todos', q = (S.bdQ || '').toLowerCase();
  const act = activos(), con = act.filter(c => c.fecha_nacimiento), sin = act.filter(c => !c.fecha_nacimiento);
  const lista = con.map(c => {
    const n = parseYmd(c.fecha_nacimiento), este = new Date(y, n.getMonth(), n.getDate());
    let prox = este < hoyD ? new Date(y + 1, n.getMonth(), n.getDate()) : este;
    return { c, mes: n.getMonth(), dia: n.getDate(), edad: y - n.getFullYear(), dias: Math.round((prox - hoyD) / 864e5), paso: este < hoyD };
  }).sort((a, b) => a.mes - b.mes || a.dia - b.dia || nombreCompleto(a.c).localeCompare(nombreCompleto(b.c)));
  const hoyL = lista.filter(x => x.dias === 0), prox = lista.filter(x => x.dias > 0 && x.dias <= 30).sort((a, b) => a.dias - b.dias);
  const tarjeta = x => `<div class="bday ${x.dias === 0 ? 'hoy' : x.dias <= 7 ? 'prox' : ''}"><div class="day">${x.dia} ${MESES[x.mes].slice(0, 3)}</div>${avatarHtml(x.c, 'lg')}<b style="display:block">${h(nombreCompleto(x.c))}</b><div class="small muted">${h(x.c.cargo || '')}${x.c.area ? ' · ' + h(x.c.area) : ''}</div>
    <div class="mt">${x.dias === 0 ? '<span class="badge amber">🎂 ¡Hoy cumple ' + x.edad + ' años!</span>' : x.paso ? `<span class="badge">Cumplió ${x.edad} años</span>` : `<span class="badge blue">Cumple ${x.edad} años${x.dias <= 30 ? ' · en ' + x.dias + ' día' + (x.dias === 1 ? '' : 's') : ''}</span>`}</div>
    <div class="mt"><button class="btn sm" data-f="${x.c.id}">🎉 Enviar felicitación</button></div></div>`;
  const meses = [...Array(12).keys()].filter(m => (filtroMes === 'todos' || Number(filtroMes) === m));
  const vis = lista.filter(x => !q || nombreCompleto(x.c).toLowerCase().includes(q));
  el.innerHTML = pageHead('Cumpleaños', `${con.length} de ${act.length} colaboradores tienen fecha de nacimiento registrada`) +
    (hoyL.length ? `<div class="card mb" style="background:linear-gradient(90deg,#fff8e6,#fff);border-color:#f59e0b"><h3>🎂 Hoy cumplen años</h3><div class="bday-grid mt">${hoyL.map(tarjeta).join('')}</div></div>` : '') +
    (prox.length ? `<div class="card mb"><h3>Próximos 30 días</h3><div class="bday-grid mt">${prox.slice(0, 8).map(tarjeta).join('')}</div></div>` : '') +
    `<div class="row mb"><div><label>Mes</label><select id="bM"><option value="todos">Todos los meses</option>${MESES.map((m, i) => `<option value="${i}" ${String(filtroMes) === String(i) ? 'selected' : ''}>${m[0].toUpperCase() + m.slice(1)}</option>`).join('')}</select></div><div class="grow"><label>Buscar</label><input id="bQ" value="${h(S.bdQ || '')}" placeholder="Nombre del colaborador"></div></div>` +
    (meses.map(m => { const ms = vis.filter(x => x.mes === m); return ms.length ? `<h2 style="margin:18px 0 10px;text-transform:capitalize">${MESES[m]} <span class="badge blue">${ms.length}</span></h2><div class="bday-grid">${ms.map(tarjeta).join('')}</div>` : ''; }).join('') || '<div class="card empty">No hay cumpleaños para mostrar. Registre la fecha de nacimiento en la ficha del colaborador (Colaboradores → Editar).</div>') +
    (sin.length ? `<div class="card mt"><h3>Sin fecha de nacimiento (${sin.length})</h3><p class="muted small">Complete este dato en Colaboradores → Editar para que aparezcan aquí.</p><div class="row">${sin.map(c => `<span class="badge">${h(nombreCompleto(c))}</span>`).join('')}</div></div>` : '');
  $('#bM').onchange = e => { S.bdMes = e.target.value; go('cumpleanos'); };
  $('#bQ').oninput = debounce(e => { S.bdQ = e.target.value; go('cumpleanos'); }, 400);
  $$('[data-f]', el).forEach(b => b.onclick = async () => {
    const c = colabById(b.dataset.f), { error } = await sb.from('mensajes').insert({ colaborador_id: c.id, remitente: 'admin', texto: `🎂 ¡Feliz cumpleaños, ${c.nombres.split(' ')[0]}! Todo el equipo te desea un día maravilloso. 🎉` });
    if (error) return toast(dbErr(error), 'err'); toast('Felicitación enviada por el chat', 'ok');
  });
};
