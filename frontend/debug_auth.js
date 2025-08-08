// Script para verificar el estado de autenticación en el frontend
// Ejecutar en la consola del navegador

console.log('=== Verificando estado de autenticación ===');

// Verificar tokens en localStorage
const accessToken = localStorage.getItem('access_token');
const refreshToken = localStorage.getItem('refresh_token');

console.log('Access Token:', accessToken ? 'Presente' : 'No encontrado');
console.log('Refresh Token:', refreshToken ? 'Presente' : 'No encontrado');

// Verificar estado del store (si está disponible)
if (window.useAppStore) {
  const state = window.useAppStore.getState();
  console.log('Estado del store:', {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading
  });
}

// Probar petición al backend
async function testBackendConnection() {
  try {
    const response = await fetch('http://localhost:8000/api/simulacion/sesiones/test_endpoint/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Test endpoint response:', {
      status: response.status,
      ok: response.ok,
      data: await response.json()
    });
  } catch (error) {
    console.error('Error al probar backend:', error);
  }
}

if (accessToken) {
  testBackendConnection();
} else {
  console.log('No hay token de acceso, no se puede probar el backend');
} 