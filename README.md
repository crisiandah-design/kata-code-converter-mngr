# Kata Code Converter (Manager)

Servicio backend (Node/Express/Lambda) que transforma código de un lenguaje origen a un lenguaje destino. Expone un único endpoint `/kata-senior/V1/transform` documentado en el OpenAPI de `static/OAS.json`.

## Endpoints

- **POST** `/kata-senior/V1/transform`
	- **Headers obligatorios**
		- `X-RqUID`: UUID de la transacción.
		- `X-IPAddr`: IP del cliente (IPv4).
		- `x-api-key`: API Key.
		- `Content-Type: application/json`
	- **Body (`transformRequest`)**
		- `sourceLanguage`: `COBOL` | `DELPHI` | `C`
		- `targetLanguage`: `JAVA` | `PYTHON` | `NODE` | `GO`
		- `code`: string con el código fuente a transformar.
	- **Respuesta 200 (`transformResponse`)**
		- `status`: número (ej. 200)
		- `message`: string (ej. "Ok")
		- `data`:
			- `code`: string con el código transformado.
			- `detail`: lista de reglas aplicadas (`ruleName`, `description`, `line?`).

## Ejemplo de petición

```bash
curl -X POST "https://{host}/kata-senior/V1/transform" \
	-H "Content-Type: application/json" \
	-H "Accept: application/json" \
	-H "x-api-key: <API_KEY>" \
	-H "X-RqUID: bb82a9cd-076e-4f69-9d6f-d7b0681a0346" \
	-H "X-IPAddr: 160.80.70.123" \
	-d '{
		"sourceLanguage": "COBOL",
		"targetLanguage": "JAVA",
		"code": "IDENTIFICATION DIVISION..."
	}'
```

## Resumen de lenguajes

- **Entrada (sourceLanguage)**: COBOL, DELPHI
- **Salida (targetLanguage)**: JAVA, PYTHON, NODE, GO

Consulta el contrato completo y ejemplos en [static/OAS.json](static/OAS.json).
