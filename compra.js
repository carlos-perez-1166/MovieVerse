// Corrección para el problema de checkboxes en compra.html
// Este script complementa a inicio.js sin reemplazarlo completamente

// Guardar las funciones originales de inicio.js
const originalToggleProduct = window.toggleProduct;
const originalUpdateTotal = window.updateTotal;

// Sobreescribir toggleProduct para manejar correctamente los checkboxes y radio buttons
window.toggleProduct = function(product) {
  const target = event.target;
  const optionsDiv = document.getElementById(product + "Options");
  
  if (product === 'ticket') {
    // Manejar radio buttons para tickets
    if (target.checked) {
      // Activar tickets - mostrar opciones y establecer cantidad 1
      if (optionsDiv) {
        optionsDiv.classList.remove('hidden');
      }
      if (window.products && window.products.ticket) {
        window.products.ticket.qty = 1;
        const qtyEl = document.getElementById('ticketQty');
        if (qtyEl) qtyEl.innerText = 1;
      }
    } else {
      // Desactivar tickets - ocultar opciones y establecer cantidad 0
      if (optionsDiv) {
        optionsDiv.classList.add('hidden');
      }
      if (window.products && window.products.ticket) {
        window.products.ticket.qty = 0;
        const qtyEl = document.getElementById('ticketQty');
        if (qtyEl) qtyEl.innerText = 0;
      }
    }
  } else {
    // Manejar checkboxes para otros productos
    if (target.checked) {
      // Activar producto - mostrar opciones y establecer cantidad 1
      if (optionsDiv) {
        optionsDiv.classList.remove('hidden');
      }
      if (window.products && window.products[product]) {
        window.products[product].qty = 1;
        const qtyEl = document.getElementById(product + "Qty");
        if (qtyEl) qtyEl.innerText = 1;
      }
    } else {
      // Desactivar producto - ocultar opciones y establecer cantidad 0
      if (optionsDiv) {
        optionsDiv.classList.add('hidden');
      }
      if (window.products && window.products[product]) {
        window.products[product].qty = 0;
        const qtyEl = document.getElementById(product + "Qty");
        if (qtyEl) qtyEl.innerText = 0;
      }
    }
  }
  
  // Llamar a la función original de actualización del total
  if (originalUpdateTotal) {
    originalUpdateTotal();
  }
};

// Sobreescribir changeQty para que funcione con el nuevo sistema
window.changeQty = function(product, value) {
  if (window.products && window.products[product]) {
    // Para tickets, permitir cambiar cantidad siempre
    // Para otros productos, solo si el checkbox está marcado
    let allowChange = false;
    
    if (product === 'ticket') {
      // Para tickets, verificar si hay un radio button seleccionado
      const ticketRadio = document.querySelector("input[type='radio']");
      if (ticketRadio && ticketRadio.checked) {
        allowChange = true;
      }
    } else {
      // Para otros productos, verificar si el checkbox está marcado
      const checkbox = document.querySelector(`input[onchange*="toggleProduct('${product}')"]`);
      if (checkbox && checkbox.checked) {
        allowChange = true;
      }
    }
    
    if (allowChange) {
      window.products[product].qty += value;
      if (window.products[product].qty < 1) window.products[product].qty = 1;
      if (window.products[product].qty > 10) window.products[product].qty = 10;

      const qtyEl = document.getElementById(product + "Qty");
      if (qtyEl) qtyEl.innerText = window.products[product].qty;

      if (originalUpdateTotal) {
        originalUpdateTotal();
      }
    }
  }
};

// Función para manejar el proceso de compra con excepciones
window.procesarCompra = async function() {
  console.log('procesarCompra() llamada');
  try {
    // Verificar que hay productos seleccionados
    if (!window.products) {
      throw new Error('No se pudo acceder al sistema de productos');
    }

    // Calcular total y obtener productos activos
    const productosActivos = [];
    let total = 0;

    for (const [key, product] of Object.entries(window.products)) {
      if (product.qty > 0) {
        productosActivos.push({
          nombre: key,
          cantidad: product.qty,
          precio: product.price
        });
        total += product.price * product.qty;
      }
    }

    if (productosActivos.length === 0) {
      throw new Error('No has seleccionado ningún producto');
    }

    // Obtener token de autenticación si existe
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Debes iniciar sesión para realizar una compra');
    }

    // Preparar datos de la compra
    const compraData = {
      productos: productosActivos,
      total: total,
      fecha: new Date().toISOString()
    };

    // Enviar a la API con timeout y reintentos
    const response = await fetchWithRetry('http://localhost:3000/api/compras', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(compraData),
      timeout: 10000 // 10 segundos timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Mostrar éxito con nombre y ticket
    const nombreUsuario = result.nombre || '';
    const numeroTicket = result.ticket || Math.floor(Math.random() * 1000000);
    
    let mensajeExito = '¡Buenas tardes! Gracias por la compra';
    if (nombreUsuario) {
      mensajeExito += `, ${nombreUsuario}`;
    }
    mensajeExito += `. Tu ticket es ${numeroTicket}`;
    
    mostrarMensaje(mensajeExito, 'success');
    
    // Limpiar carrito
    limpiarCarrito();
    
    // Redirigir o mostrar confirmación
    setTimeout(() => {
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        mostrarMensaje('Tu compra ha sido procesada. Recibirás un correo de confirmación.', 'info');
      }
    }, 2000);

  } catch (error) {
    // Manejar diferentes tipos de errores
    let mensajeUsuario = 'Ocurrió un error al procesar tu compra';
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      mensajeUsuario = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.';
    } else if (error.message.includes('timeout')) {
      mensajeUsuario = 'El servidor tardó demasiado en responder. Por favor, intenta nuevamente.';
    } else if (error.message.includes('401')) {
      mensajeUsuario = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
      setTimeout(() => {
        window.location.href = 'inicioSesion.html';
      }, 3000);
    } else if (error.message.includes('403')) {
      mensajeUsuario = 'No tienes permisos para realizar esta acción.';
    } else if (error.message.includes('No has seleccionado')) {
      mensajeUsuario = error.message;
    } else if (error.message.includes('Debes iniciar sesión')) {
      mensajeUsuario = error.message;
      setTimeout(() => {
        window.location.href = 'inicioSesion.html';
      }, 3000);
    } else {
      console.error('Error en compra:', error);
      mensajeUsuario += '. Por favor, intenta nuevamente más tarde.';
    }
    
    mostrarMensaje(mensajeUsuario, 'error');
  }
}

// Función para reintentar peticiones fallidas
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
      
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Esperar antes de reintentar (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      console.log(`Reintentando petición (${i + 1}/${maxRetries})...`);
    }
  }
}

// Función para limpiar el carrito
function limpiarCarrito() {
  if (window.products) {
    for (const key in window.products) {
      window.products[key].qty = 0;
      
      // Actualizar display
      const qtyEl = document.getElementById(key + 'Qty');
      if (qtyEl) qtyEl.innerText = '0';
      
      // Desmarcar checkboxes
      const checkbox = document.querySelector(`input[onchange*="toggleProduct('${key}')"]`);
      if (checkbox) {
        checkbox.checked = false;
        const optionsDiv = document.getElementById(key + 'Options');
        if (optionsDiv) {
          optionsDiv.classList.add('hidden');
        }
      }
    }
    
    // Actualizar total
    if (window.updateTotal) {
      window.updateTotal();
    }
  }
}

// Función para mostrar mensajes al usuario
function mostrarMensaje(mensaje, tipo = 'info') {
  // Crear o actualizar el mensaje
  let mensajeEl = document.getElementById('mensajeCompra');
  if (!mensajeEl) {
    mensajeEl = document.createElement('div');
    mensajeEl.id = 'mensajeCompra';
    mensajeEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: bold;
      z-index: 1000;
      max-width: 300px;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(mensajeEl);
  }
  
  // Establecer colores según tipo
  const colores = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  };
  
  mensajeEl.style.backgroundColor = colores[tipo] || colores.info;
  mensajeEl.textContent = mensaje;
  mensajeEl.style.display = 'block';
  
  // Auto-ocultar después de 5 segundos
  setTimeout(() => {
    mensajeEl.style.display = 'none';
  }, 5000);
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
  // Asegurarse que las funciones de inicio.js estén disponibles
  if (typeof window.updateTotal === 'function') {
    // Actualizar el total inicial
    window.updateTotal();
  }
  
  // Manejar el radio button principal de tickets
  const mainTicketRadio = document.querySelector("input[type='radio']");
  if (mainTicketRadio) {
    mainTicketRadio.addEventListener('change', function() {
      if (this.checked && window.products && window.products.ticket) {
        window.products.ticket.qty = 1;
        const qtyEl = document.getElementById('ticketQty');
        if (qtyEl) qtyEl.innerText = 1;
        
        if (window.updateTotal) {
          window.updateTotal();
        }
      }
    });
  }
  
  // Manejar los radio buttons de opciones de tickets
  const ticketRadios = document.querySelectorAll('input[name="ticketOption"]');
  ticketRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked && window.products && window.products.ticket) {
        window.products.ticket.qty = 1;
        const qtyEl = document.getElementById('ticketQty');
        if (qtyEl) qtyEl.innerText = 1;
        
        if (window.updateTotal) {
          window.updateTotal();
        }
      }
    });
  });
  
  // Agregar evento al botón de Confirmar Pago
  const btnConfirmar = document.querySelector('.btn-confirmar');
  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', function(e) {
      e.preventDefault();
      procesarCompra();
    });
  }
});
