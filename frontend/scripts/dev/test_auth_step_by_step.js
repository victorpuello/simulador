// Script para probar la autenticación paso a paso
// Ejecutar en la consola del navegador

console.log('=== Probando autenticación paso a paso ===');

// Paso 1: Limpiar tokens existentes
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
console.log('✅ Tokens limpiados');

// Paso 2: Hacer login
async function stepByStepAuth() {
  try {
    console.log('🔄 Paso 2: Haciendo login...');
    
    const loginResponse = await fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginResponse.ok) {
      // Paso 3: Guardar tokens
      localStorage.setItem('access_token', loginData.tokens.access);
      localStorage.setItem('refresh_token', loginData.tokens.refresh);
      console.log('✅ Tokens guardados');
      
      // Paso 4: Probar endpoint de sesiones
      console.log('🔄 Paso 4: Probando endpoint de sesiones...');
      
      const sesionesResponse = await fetch('http://localhost:8000/api/simulacion/sesiones/', {
        headers: {
          'Authorization': `Bearer ${loginData.tokens.access}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Sesiones status:', sesionesResponse.status);
      console.log('Sesiones headers:', Object.fromEntries(sesionesResponse.headers.entries()));
      
      const sesionesText = await sesionesResponse.text();
      console.log('Sesiones response text:', sesionesText);
      
      try {
        const sesionesData = JSON.parse(sesionesText);
        console.log('✅ Sesiones JSON válido:', sesionesData);
      } catch (e) {
        console.log('❌ Sesiones no es JSON válido:', sesionesText.substring(0, 200));
      }
      
      // Paso 5: Probar con axios
      console.log('🔄 Paso 5: Probando con axios...');
      
      const axios = window.axios || (await import('axios')).default;
      
      try {
        const axiosResponse = await axios.get('http://localhost:8000/api/simulacion/sesiones/', {
          headers: {
            'Authorization': `Bearer ${loginData.tokens.access}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Axios response:', axiosResponse.data);
      } catch (axiosError) {
        console.error('❌ Error con axios:', axiosError);
        console.log('Axios error response:', axiosError.response?.data);
      }
      
    } else {
      console.error('❌ Error en login:', loginData);
    }
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar
stepByStepAuth(); 