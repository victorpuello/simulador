// Script para hacer login automático y probar inmediatamente
// Ejecutar en la consola del navegador

console.log('=== Login automático y prueba inmediata ===');

// Limpiar tokens existentes
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
console.log('✅ Tokens limpiados');

async function autoLoginAndTest() {
  try {
    // 1. Hacer login
    console.log('🔄 Paso 1: Haciendo login...');
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
      
      // 3. Probar endpoint de sesiones inmediatamente
      console.log('🔄 Paso 2: Probando endpoint de sesiones...');
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
        
        // 4. Probar con axios
        console.log('🔄 Paso 3: Probando con axios...');
        const axios = window.axios || (await import('axios')).default;
        
        try {
          const axiosResponse = await axios.get('http://localhost:8000/api/simulacion/sesiones/', {
            headers: {
              'Authorization': `Bearer ${loginData.tokens.access}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('✅ Axios funcionando:', axiosResponse.data);
          
          // 5. Recargar la página
          console.log('🔄 Recargando página...');
          window.location.reload();
        } catch (axiosError) {
          console.error('❌ Error con axios:', axiosError);
        }
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
autoLoginAndTest(); 