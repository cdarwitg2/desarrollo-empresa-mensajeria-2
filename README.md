# Sistema de Trazabilidad Logística - Prototipo Mínimo Navegable (PMN)

**Asignatura:** Desarrollo de Aplicaciones Empresariales  
**Institución:** Universidad Católica de Temuco  
**Equipo:** Esban Chavez y Camilo Darwitg  
**Profesor:** Gastón Contreras  

---

## 📝 Descripción del Proyecto

Este repositorio contiene el **Prototipo Mínimo Navegable (PMN)** para la plataforma de trazabilidad de custodia y traspaso de responsabilidades logísticas. El foco de esta fase ha cambiado drásticamente del análisis conceptual abstracto hacia la creación de una maqueta interactiva orientada a la **Experiencia del Usuario (UX)** y a la validación de las reglas de negocio en tiempo real.

El sistema simula el ciclo de vida completo de un activo (paquete) a través de una **Máquina de Estados Estricta** y un modelo estocástico de contingencias. Está diseñado bajo una estética **Premium Dark / Glassmorphism** utilizando tecnologías modernas de desarrollo frontend completamente desacopladas.

---

## 🛤️ El Recorrido Principal (Camino Feliz)

Para garantizar consistencia y evitar un exceso de funcionalidades inconexas, el prototipo implementa un recorrido lineal único y vertical de transiciones de custodia basadas en nuestro informe de la Fase 2:

[SOLICITADO] ➔ [EN_TRANSITO] ➔ [EN_ACOPIO] ➔ [ENTREGADO]


1. **Bloqueo Inicial:** La aplicación requiere obligatoriamente ingresar el RUT del Responsable y el nombre del activo para inicializar la simulación. El RUT se hereda de manera inmutable (`disabled`) en las siguientes pantallas para resguardar la identidad del custodio.
2. **Pipeline Rectangular de Estados:** Reemplaza los indicadores circulares tradicionales por tarjetas horizontales legibles que cambian dinámicamente de color (Verde brillante con sombras difusas) al completarse.
3. **Cierre Exitoso:** Al alcanzar el estado `[ENTREGADO]`, un hito final (ícono de casa grande) se ilumina intensamente para indicar visualmente el fin de la responsabilidad legal sobre la carga.

---

## 🚨 Control de Incidencias y Lógica de Probabilidades

El prototipo no es un flujo estático; interactúa intensamente con las excepciones definidas en el modelado del negocio a través del **Panel del Analista**:

- **Anomalía de Sello de Seguridad:** El analista puede forzar el estado a `[EN_DISPUTA]`. Esto congela inmediatamente toda la operación en el *Portal Operador* (los botones se deshabilitan y muestran opacidad), simulando el resguardo legal de la cadena de custodia.
- **Gestión Estocástica (Simular Choque):** Al gatillar un accidente, el sistema calcula de forma probabilística dos escenarios:
  - **10% de Probabilidad (Pérdida Total):** El paquete pasa a `[EN_DISPUTA]`, el terminal añade un registro crítico y la estación del flujo público se enciende en **rojo brillante** informando el extravío.
  - **90% de Probabilidad (Colisión Menor):** El paquete sigue su curso lineal, pero su estado de integridad decae a `"Un poco dañado"`.
- **Casillas Flotantes (Tooltips):** Al pasar el cursor (`hover`) sobre cualquier estación de la ruta, emerge una nube informativa detallando el Estado, el Custodio (RUT) y la Integridad del activo en tiempo real.
- **Resolución de Conflictos:** El analista cuenta con una función para liberar el activo, devolviendo el paquete al estado seguro `[EN_ACOPIO]` y desbloqueando la interfaz del operador.

---

## 📑 Terminal de Logs Históricos (Custody_Log)

En la sección inferior del *Portal Operador* se despliega un terminal de eventos interactivo que emula la inmutabilidad de la entidad `Custody_Log` definida en el modelo relacional. Cada acción genera una línea de auditoría automática con el siguiente formato:
`[DD-MM-YYYY | HH:MM]: Paquete [Nombre, RUT] Estado: [Nuevo Estado]`

- **Color Verde:** Resoluciones de conflicto exitosas.
- **Color Rojo:** Alertas de vulneración de sellos o pérdidas totales.
- **Color Blanco/Gris:** Traspasos operativos estándar.

---

## 🛠️ Stack Tecnológico Utilizado

### Frontend (Interfaz de Usuario & Simulación)
- **React 18** + **TypeScript** (Entorno rápido y tipado estricto).
- **Vite** (Module Bundler de alta velocidad).
- **Tailwind CSS** (Clases utilitarias y variables de cristalomorfismo `backdrop-blur`).
- **Lucide React** (Iconografía de logística, alertas y estados).

### Backend (Arquitectura Preparada)
- **Python 3.10+**
- **Flask** + **Flask-SQLAlchemy** (Modelos: `Usuario`, `Activo`, `CustodyLog` e `Evidence`)

---

## 🚀 Instalación y Ejecución Local

Para levantar e interactuar con el Prototipo Mínimo Navegable, ejecute los siguientes comandos en su terminal:

```bash
# 1. Ingresar a la carpeta del frontend
cd frontend

# 2. Instalar dependencias
npm install

# 3. Ejecutar el servidor de desarrollo
npm run dev
```

El cliente web interactivo se desplegará en: http://localhost:5173