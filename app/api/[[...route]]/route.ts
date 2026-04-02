import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import books from './books'
import authors from './authors'

const app = new Hono().basePath('/api')

app.route('/authors/*', authors)
app.route('/books/*', books)

export const GET = handle(app)
export const POST = handle(app)