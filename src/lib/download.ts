import api from './api'

/**
 * Descarga un CSV pasando por axios, que es quien lleva el token de sesión: un
 * `<a href>` directo iría sin cabecera de autorización.
 */
export async function downloadCsv(
  path: string,
  params: Record<string, string | undefined>,
  filename: string,
) {
  const res = await api.get(path, { params, responseType: 'blob' })
  const url = URL.createObjectURL(res.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
