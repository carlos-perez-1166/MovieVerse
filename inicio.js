/* =========================
   CLASES (POO) - COMENTARIOS
========================= */

class Comentario {
  constructor(texto) {
    this.texto = texto;
    this.fecha = new Date();
    this.completo = false;
  }

  editar(nuevoTexto) {
    this.texto = nuevoTexto;
  }

  toggle() {
    this.completo = !this.completo;
  }
}

class GestorDeComentarios {
  constructor() {
    this.comentarios = JSON.parse(localStorage.getItem("comentarios")) || [];
    this.render();
  }

  agregarComentario(texto) {
    if (texto.trim() === "") {
      alert("No puedes enviar un comentario vacío");
      return;
    }
    this.comentarios.push(new Comentario(texto));
    this.guardar();
    this.render();
  }

  eliminarComentario(index) {
    this.comentarios.splice(index, 1);
    this.guardar();
    this.render();
  }

  editarComentario(index) {
    const nuevoTexto = prompt("Edita tu comentario:");
    if (nuevoTexto && nuevoTexto.trim() !== "") {
      this.comentarios[index].editar(nuevoTexto);
      this.guardar();
      this.render();
    }
  }

  toggleComentario(index) {
    this.comentarios[index].toggle();
    this.guardar();
    this.render();
  }

  guardar() {
    localStorage.setItem("comentarios", JSON.stringify(this.comentarios));
  }

  render() {
    const lista = document.getElementById("lista-comentarios");
    if (!lista) return;

    lista.innerHTML = "";

    this.comentarios.forEach((c, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span style="text-decoration:${c.completo ? "line-through" : "none"}">
          ${c.texto}
        </span>
        <small>(${new Date(c.fecha).toLocaleString()})</small><br>
        <button onclick="gestor.toggleComentario(${index})">✔</button>
        <button onclick="gestor.editarComentario(${index})">Editar</button>
        <button onclick="gestor.eliminarComentario(${index})">Eliminar</button>
      `;
      lista.appendChild(li);
    });
  }
}

/* =========================
   INSTANCIA Y EVENTOS
========================= */

const gestor = new GestorDeComentarios();

const btnAgregar = document.getElementById("agregar-comentario");
if (btnAgregar) {
  btnAgregar.addEventListener("click", () => {
    const input = document.getElementById("nuevo-comentario");
    gestor.agregarComentario(input.value);
    input.value = "";
  });
}

/* =========================
   COMPRA DE PELÍCULAS
========================= */

function comprar(nombrePelicula) {
  // Guardar la película seleccionada en localStorage
  localStorage.setItem("peliculaSeleccionada", nombrePelicula);
  
  // Redirigir a compra.html
  window.location.href = "compra.html";
}

function comprarBoletos(movie, price) {
  localStorage.setItem("movieName", movie);
  localStorage.setItem("ticketPrice", price);
  window.location.href = "compras.html";
}

/* =========================
   CARRITO / PRODUCTOS
========================= */

const products = {
  ticket: { price: 80, qty: 1 },
  popcorn: { price: 60, qty: 0 },
  nachos: { price: 50, qty: 0 },
  crepas: { price: 65, qty: 0 },
  hotdogs: { price: 70, qty: 0 },
  soda: { price: 65, qty: 0 },
  water: { price: 30, qty: 0 },
  frappe: { price: 75, qty: 0 },
};

function changeQty(product, value) {
  products[product].qty += value;
  if (products[product].qty < 0) products[product].qty = 0;

  const qtyEl = document.getElementById(product + "Qty");
  if (qtyEl) qtyEl.innerText = products[product].qty;

  updateTotal();
}


function toggleProduct(product) {
  const box = document.getElementById(product + "Options");
  const isHidden = box.classList.toggle("hidden");

  // Si se está cerrando y la cantidad es 0, no se suma
  if (isHidden && products[product].qty === 0) {
    updateTotal();
    return;
  }

  // Si se abre por primera vez, poner cantidad mínima 1
  if (!isHidden && products[product].qty === 0) {
    products[product].qty = 1;
    document.getElementById(product + "Qty").innerText = 1;
  }

  updateTotal();
}


function updateTotal() {
  let total = 0;
  for (let key in products) {
    total += products[key].price * products[key].qty;
  }

  const totalEl = document.getElementById("totalText");
  if (totalEl) totalEl.innerText = "$" + total;
}



function irAPago() {
  let total = 0;

  for (let key in products) {
    total += products[key].price * products[key].qty;
  }

  localStorage.setItem("totalCompra", total);
  window.location.href = "metodoPago.html";
}