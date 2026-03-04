// registro.js
document.addEventListener("DOMContentLoaded", () => {
  const btnRegistro = document.getElementById("btnRegistro");
  const mensaje = document.getElementById("mensaje");

  btnRegistro.addEventListener("click", async () => {
    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!nombre || !email || !password) {
      mensaje.textContent = "Por favor, completa todos los campos";
      mensaje.style.color = "red";
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        mensaje.textContent = data.message || "Error en el registro";
        mensaje.style.color = "red";
        return;
      }

      mensaje.textContent = data.message;
      mensaje.style.color = "lime";

      // Guardar sesión automáticamente después del registro
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("usuarioEmail", email);
      localStorage.setItem("usuarioNombre", nombre);
      localStorage.setItem("usuarioRole", data.data.user.role);

      // Limpiar campos
      document.getElementById("nombre").value = "";
      document.getElementById("email").value = "";
      document.getElementById("password").value = "";

      // Redirigir después de 2 segundos
      setTimeout(() => {
        window.location.href = "inicio.html";
      }, 2000);
    } catch (err) {
      mensaje.textContent = "Error al conectar con el servidor";
      mensaje.style.color = "red";
    }
  });
});
