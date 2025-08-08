// Script para verificar el estado actual del frontend
// Ejecutar en la consola del navegador

console.log('=== Verificando estado del frontend ===');

// Verificar URL actual
console.log('URL actual:', window.location.href);

// Verificar tokens
const accessToken = localStorage.getItem('access_token');
const refreshToken = localStorage.getItem('refresh_token');

console.log('Tokens:', {
  access: accessToken ? 'Presente' : 'No encontrado',
  refresh: refreshToken ? 'Presente' : 'No encontrado'
});

// Verificar si estamos en la página correcta
if (window.location.pathname === '/simulacion') {
  console.log('✅ Estamos en la página de simulaciones');
} else {
  console.log('❌ No estamos en la página de simulaciones');
  console.log('Página actual:', window.location.pathname);
}

// Verificar si el usuario debería estar autenticado
if (!accessToken) {
  console.log('❌ No hay token de acceso - el usuario debe hacer login');
  console.log('Redirigiendo a /login...');
  window.location.href = '/login';
} else {
  console.log('✅ Hay token de acceso');
  
  // Probar la conexión con el backend
  fetch('http://localhost:8000/api/simulacion/sesiones/test_endpoint/', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ Conexión con backend exitosa:', data);
  })
  .catch(error => {
    console.error('❌ Error al conectar con backend:', error);
  });
} 