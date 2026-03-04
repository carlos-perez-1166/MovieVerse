const monto = parseFloat(localStorage.getItem("totalCompra")) || 0;

const comision = monto * 0.08;
const totalFinal = monto + comision;

document.getElementById("monto").textContent = monto.toFixed(2);
document.getElementById("comision").textContent = comision.toFixed(2);
document.getElementById("totalFinal").textContent = totalFinal.toFixed(2);

function procesarPago() {
  const tarjeta = document.getElementById("tarjeta").value;
  const fecha = document.getElementById("fecha").value;
  const cvv = document.getElementById("cvv").value;
  const nombre = document.getElementById("nombre").value;

  if (tarjeta.length !== 16 || cvv.length !== 3 || !nombre) {
    alert("Datos inválidos ❌");
    document.getElementById("estado").textContent = "Rechazado";
    return;
  }



function actualizarEstadoUI(estado) {
  const estadoEl = document.getElementById("estado");

  estadoEl.textContent = estado;

  estadoEl.style.background =
    estado === "Aprobado" ? "green" :
    estado === "Rechazado" ? "red" :
    "gray";
}



// Guardar compra (simulación BD)
  const compra = {
    monto,
    totalFinal,
    nombre,
    fecha: new Date()
  };

  localStorage.setItem("ultimaCompra", JSON.stringify(compra));

  alert("Pago realizado con éxito 🎉");
}

function verTicket() {
  window.location.href = "ticket.html";
}

