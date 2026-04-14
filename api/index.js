export default async function handler(req, res) {
  const { default: app } = await import("./src/app.js"); 
  app(req, res); 
}
