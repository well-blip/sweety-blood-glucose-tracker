// Tell TypeScript that requests can carry the logged-in user's id (set by requireAuth).
declare global {
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}

export {}
