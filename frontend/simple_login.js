// Script simple para hacer login y probar
// Ejecutar en la consola del navegador

console.log('=== Login simple ===');

// Limpiar tokens
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');

async function simpleLogin() {
  try {
    // Login
    const response = await fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass123'
      })
    });
    
    const data = await response.json();
    console.log('Login response:', data);
    
    if (response.ok) {
      // Guardar tokens
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      console.log('✅ Tokens guardados');
      
      // Probar sesiones
      const sesionesResponse = await fetch('http://localhost:8000/api/simulacion/sesiones/', {
        headers: {
          'Authorization': `Bearer ${data.tokens.access}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Sesiones status:', sesionesResponse.status);
      
      if (sesionesResponse.ok) {
        const sesionesData = await sesionesResponse.json();
        console.log('✅ Sesiones funcionando:', sesionesData);
        
        // Recargar página
        window.location.reload();
      } else {
        const errorText = await sesionesResponse.text();
        console.error('❌ Error en sesiones:', errorText);
      }
    } else {
      console.error('❌ Error en login:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar
simpleLogin(); 