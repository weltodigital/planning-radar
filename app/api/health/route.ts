export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Planning Radar API is running'
  })
}