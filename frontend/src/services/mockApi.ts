// Mock API service para desarrollo y testing
export const mockUsers = [
  {
    username: 'estudiante@test.com',
    email: 'estudiante@test.com',
    password: 'password123',
    first_name: 'Juan',
    last_name: 'Pérez',
    rol: 'estudiante',
    id: 1
  },
  {
    username: 'docente@test.com',
    email: 'docente@test.com', 
    password: 'password123',
    first_name: 'María',
    last_name: 'García',
    rol: 'docente',
    id: 2
  },
  {
    username: 'admin@test.com',
    email: 'admin@test.com',
    password: 'password123',
    first_name: 'Admin',
    last_name: 'Sistema',
    rol: 'admin',
    is_staff: true,
    is_superuser: true,
    id: 3
  }
];

export const mockLogin = (username: string, password: string) => {
  const user = mockUsers.find(u => 
    u.username === username && u.password === password
  );
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    return Promise.resolve({
      access: 'mock-access-token-' + Date.now(),
      refresh: 'mock-refresh-token-' + Date.now(),
      user: userWithoutPassword
    });
  }
  
  return Promise.reject(new Error('Credenciales inválidas'));
};

export const mockLogout = () => {
  return Promise.resolve({ message: 'Logout exitoso' });
};

export const mockRefreshToken = () => {
  return Promise.resolve({
    access: 'mock-access-token-refreshed-' + Date.now()
  });
};

export const mockUserProfile = () => {
  const userData = localStorage.getItem('user');
  if (userData) {
    return Promise.resolve(JSON.parse(userData));
  }
  return Promise.reject(new Error('No authenticated'));
};