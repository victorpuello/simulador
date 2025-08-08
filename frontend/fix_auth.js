// Script para arreglar la autenticación en el frontend
// Ejecutar en la consola del navegador

console.log('=== Arreglando autenticación ===');

// Limpiar tokens existentes
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');

// Hacer login automático
async function fixAuth() {
  try {
    console.log('Haciendo login...');
    
    const response = await fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      
      console.log('✅ Login exitoso, tokens guardados');
      console.log('Usuario:', data.user);
      
      // Probar el endpoint que estaba fallando
      const sesionesResponse = await fetch('http://localhost:8000/api/simulacion/sesiones/', {
        headers: {
          'Authorization': `Bearer ${data.tokens.access}`,
          'Content-Type': 'application/json'
        }
      });
      
      const sesionesData = await sesionesResponse.json();
      console.log('✅ Endpoint de sesiones funcionando:', sesionesData);
      
      // Recargar la página
      console.log('Recargando página...');
      window.location.reload();
    } else {
      console.error('❌ Error en login:', data);
    }
  } catch (error) {
    console.error('❌ Error al hacer login:', error);
  }
}

// Ejecutar
fixAuth(); 