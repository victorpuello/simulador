// Script para arreglar rápidamente la autenticación
// Ejecutar en la consola del navegador

console.log('=== Arreglando autenticación rápidamente ===');

// Verificar estado actual
const currentToken = localStorage.getItem('access_token');
console.log('Token actual:', currentToken ? 'Presente' : 'No encontrado');

// Hacer login y probar inmediatamente
async function quickFix() {
  try {
    // 1. Hacer login
    console.log('🔄 Haciendo login...');
    const loginResponse = await fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login status:', loginResponse.status);
    
    if (loginResponse.ok) {
      // 2. Guardar tokens
      localStorage.setItem('access_token', loginData.tokens.access);
      localStorage.setItem('refresh_token', loginData.tokens.refresh);
      console.log('✅ Tokens guardados');
      
      // 3. Probar inmediatamente el endpoint problemático
      console.log('🔄 Probando endpoint de sesiones...');
      const sesionesResponse = await fetch('http://localhost:8000/api/simulacion/sesiones/', {
        headers: {
          'Authorization': `Bearer ${loginData.tokens.access}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Sesiones status:', sesionesResponse.status);
      
      if (sesionesResponse.ok) {
        const sesionesData = await sesionesResponse.json();
        console.log('✅ Sesiones funcionando:', sesionesData);
        
        // 4. Recargar la página para aplicar la autenticación
        console.log('🔄 Recargando página...');
        window.location.reload();
      } else {
        const errorText = await sesionesResponse.text();
        console.error('❌ Error en sesiones:', errorText);
      }
    } else {
      console.error('❌ Error en login:', loginData);
    }
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar
quickFix(); 