// Cargar datos desde localStorage
document.getElementById("movie").textContent =
  localStorage.getItem("movieName") || "N/A";

document.getElementById("total").textContent =
  "$" + (localStorage.getItem("total") || "0");

// Descargar PDF
function descargarPDF() {
  const contenido = `
    MovieVerse 🎬
    
    Película: ${localStorage.getItem("movieName")}
    Total: $${localStorage.getItem("total")}
    Estado: Aprobado
  `;

  const blob = new Blob([contenido], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "Ticket_MovieVerse.pdf";
  link.click();
}