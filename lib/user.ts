const USER_ID_KEY = "socforge_user_id"
const USER_NAME_KEY = "socforge_user_name"

export function getUserId(): string {
  if (typeof window === "undefined") return "server"

  let userId = localStorage.getItem(USER_ID_KEY)
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem(USER_ID_KEY, userId)
  }
  return userId
}

export function getUserName(): string {
  if (typeof window === "undefined") return "Server"

  let userName = localStorage.getItem(USER_NAME_KEY)
  if (!userName) {
    userName = `User_${Math.floor(Math.random() * 1000)}`
    localStorage.setItem(USER_NAME_KEY, userName)
  }
  return userName
}