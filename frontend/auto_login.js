// Script para hacer login automáticamente
// Ejecutar en la consola del navegador

async function autoLogin() {
  console.log('=== Intentando login automático ===');
  
  try {
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
      
      // Recargar la página para aplicar la autenticación
      window.location.reload();
    } else {
      console.error('❌ Error en login:', data);
    }
  } catch (error) {
    console.error('❌ Error al hacer login:', error);
  }
}

// Ejecutar login automático
autoLogin(); 