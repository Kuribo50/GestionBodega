// /pages/api/ubicaciones.js
export default async function handler(req, res) {
  const apiUrl = process.env.API_URL || "http://127.0.0.1:8000/api";  // URL base de la API Django

  if (req.method === "GET") {
    try {
      const response = await fetch(`${apiUrl}/ubicaciones/`);  // Endpoint correcto de Django
      if (!response.ok) {
        throw new Error(`Error en la API: ${response.statusText}`);
      }
      const data = await response.json();  // Convierte la respuesta a JSON
      res.status(200).json(data);  // Devuelve los datos a la solicitud de Next.js
    } catch (error) {
      console.error("Error al obtener ubicaciones:", error.message);
      res.status(500).json({ message: "Error al obtener ubicaciones" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
