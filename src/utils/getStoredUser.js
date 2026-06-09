export const getStoredUser = () => {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) return null
  try {
    return JSON.parse(storedUser)
  } catch {
    return null
  }
}
