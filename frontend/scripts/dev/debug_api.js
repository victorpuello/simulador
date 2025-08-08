// Script para diagnosticar el problema de la API
// Ejecutar en la consola del navegador

console.log('=== Diagnosticando problema de API ===');

// Verificar tokens
const accessToken = localStorage.getItem('access_token');
console.log('Access Token:', accessToken ? 'Presente' : 'No encontrado');

// Probar petición directa sin axios
async function testDirectFetch() {
  try {
    console.log('Probando petición directa...');
    
    const response = await fetch('http://localhost:8000/api/simulacion/sesiones/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response text:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('✅ JSON válido:', json);
    } catch (e) {
      console.log('❌ No es JSON válido, es HTML:', text.substring(0, 200));
    }
  } catch (error) {
    console.error('❌ Error en petición directa:', error);
  }
}

// Probar con axios
async function testAxios() {
  try {
    console.log('Probando con axios...');
    
    const axios = window.axios || (await import('axios')).default;
    
    const response = await axios.get('http://localhost:8000/api/simulacion/sesiones/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Axios response:', response.data);
  } catch (error) {
    console.error('❌ Error con axios:', error);
    console.log('Error response:', error.response?.data);
  }
}

// Ejecutar pruebas
if (accessToken) {
  testDirectFetch();
  setTimeout(testAxios, 1000);
} else {
  console.log('❌ No hay token, no se pueden hacer pruebas');
} 