export function formatStockWarning(w) {
  return `${w.article} — demandé ${w.requested}, disponible avant vente ${w.available_before}. Stock désormais à ${w.resulting_stock}.`;
}