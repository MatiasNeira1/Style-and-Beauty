// TODO: reemplazar por endpoints reales de analytics cuando backend exponga historicos agregados.
// Fallback temporal aislado: no representa datos reales de Style & Beauty.
export const adminDashboardMock = {
  revenueSeries: [
    { label: 'Lun', ingresos: 420000, anterior: 340000 },
    { label: 'Mar', ingresos: 510000, anterior: 460000 },
    { label: 'Mie', ingresos: 390000, anterior: 420000 },
    { label: 'Jue', ingresos: 620000, anterior: 520000 },
    { label: 'Vie', ingresos: 810000, anterior: 640000 },
    { label: 'Sab', ingresos: 740000, anterior: 700000 },
    { label: 'Dom', ingresos: 360000, anterior: 310000 },
  ],
  weeklyOccupancy: [
    { day: 'Lun', values: [35, 48, 62, 78, 56] },
    { day: 'Mar', values: [42, 58, 73, 86, 61] },
    { day: 'Mie', values: [28, 52, 67, 80, 70] },
    { day: 'Jue', values: [38, 60, 74, 92, 76] },
    { day: 'Vie', values: [54, 72, 88, 96, 82] },
    { day: 'Sab', values: [68, 84, 90, 74, 45] },
  ],
};
