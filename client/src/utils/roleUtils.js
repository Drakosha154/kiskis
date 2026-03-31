// Определение доступов для каждой роли
const rolePermissions = {
  'admin': [], // Админ не видит обычные вкладки, только админ-панель
  'менеджер': ['suppliers', 'contracts', 'documents'],
  'кладовщик': ['warehouse', 'documents'],
  'бухгалтер': ['accounting', 'documents'],
  'директор': ['suppliers', 'contracts', 'warehouse', 'documents', 'accounting', 'reports']
};

// Получить роль текущего пользователя
export const getUserRole = () => {
  return localStorage.getItem('userRole') || '';
};

// Проверить, имеет ли пользователь доступ к вкладке
export const hasAccessToTab = (tabName) => {
  const role = getUserRole();
  const permissions = rolePermissions[role] || [];
  return permissions.includes(tabName);
};

// Получить список доступных вкладок для текущей роли
export const getAccessibleTabs = () => {
  const role = getUserRole();
  return rolePermissions[role] || [];
};