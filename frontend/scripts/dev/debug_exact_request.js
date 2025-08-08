// Script para verificar exactamente qué está enviando el frontend
// Ejecutar en la consola del navegador

console.log('=== Verificando petición exacta del frontend ===');

// Verificar tokens
const accessToken = localStorage.getItem('access_token');
const refreshToken = localStorage.getItem('refresh_token');

console.log('Tokens en localStorage:');
console.log('- Access Token:', accessToken ? 'Presente' : 'No encontrado');
console.log('- Refresh Token:', refreshToken ? 'Presente' : 'No encontrado');

// Simular exactamente la petición que hace el frontend
async function debugExactRequest() {
  try {
    console.log('🔄 Simulando petición exacta del frontend...');
    
    // Usar la misma configuración que axios
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    console.log('Headers que se enviarán:', headers);
    
    const response = await fetch('http://localhost:8000/api/simulacion/sesiones/', {
      method: 'GET',
      headers: headers,
      credentials: 'include'
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response text:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('✅ Response es JSON válido:', json);
    } catch (e) {
      console.log('❌ Response no es JSON válido, es HTML:', text.substring(0, 300));
    }
    
  } catch (error) {
    console.error('❌ Error en petición:', error);
  }
}

// Verificar si hay algún problema con el token
async function verifyToken() {
  if (!accessToken) {
    console.log('❌ No hay token de acceso');
    return;
  }
  
  try {
    console.log('🔄 Verificando token...');
    
    const response = await fetch('http://localhost:8000/api/simulacion/sesiones/test_endpoint/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('✅ Token válido:', data);
  } catch (error) {
    console.error('❌ Token inválido:', error);
  }
}

// Ejecutar verificaciones
debugExactRequest();
setTimeout(verifyToken, 1000); 