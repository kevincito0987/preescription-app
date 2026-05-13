# 🏥 Prueba Técnica Full-Stack — App de Prescripciones

### 🛠️ Stack Obligatorio

- **Backend:** NestJS + **Prisma** ORM + **PostgreSQL**.
- **Seguridad:** Autenticación con **JWT + refresh tokens** y RBAC mediante Guards/Decorators.
- **Frontend:** **Next.js** (App Router o Pages), **React** con **TypeScript** y **TailwindCSS**.
- **Infraestructura (Sugerida):** Backend en Railway/Render, DB en Railway PostgreSQL y Frontend en Vercel.

------

### 🎯 Objetivo del Proyecto

Construir un MVP **simple y sólido** de un sistema de prescripciones con **3 roles específicos**:

- **👨‍⚕️ Médico:** Crea prescripciones asociadas a un paciente con ítems digitados manualmente (⚠️ **no** hay CRUD de productos).
- **👤 Paciente:** Visualiza sus prescripciones, puede **marcarlas como "consumidas"** y **descargarlas en formato PDF**.
- **🔑 Admin:** Visualiza un panel de **métricas** generales (totales y por estado).

------



## 📋 1) Requerimientos Funcionales

### 👥 Roles del Sistema

- **⚡ Admin**
  - 📊 Visualiza métricas: número de pacientes, número de médicos, número de prescripciones totales, prescripciones por **estado** y por **día**.
  - 👤 *(Opcional/Plus)* Crea usuarios y asigna roles.
- **👨‍⚕️ Médico**
  - 📝 Crea **prescripciones** para un paciente existente (o mediante el email del paciente).
  - 🔎 Lista y ve el detalle de sus propias prescripciones creadas.
- **👤 Paciente**
  - 📅 Lista y ve el detalle de **sus** propias prescripciones.
  - 🔄 Cambia el estado de una prescripción: **pendiente** $\rightarrow$ **consumida**.
  - 📄 Descarga la prescripción en formato **PDF**.

------

### 🔄 Flujo Mínimo de Usuario

1. **Seguridad:** Autenticación obligatoria por email y password.
2. **Acción Médica:** Un **médico** crea una prescripción para un **paciente** utilizando inputs libres para los ítems.
3. **Gestión del Paciente:** El **paciente** accede a su bandeja de prescripciones, donde puede marcarlas como **consumidas** y **descargar el PDF**.
4. **Supervisión:** El **admin** visualiza las **métricas** globales del sistema.

------

### 🚦 Estados y Reglas de Negocio

- **Entidad Prescripción:** Maneja dos estados posibles: `pending` | `consumed`.
- **Entidad Ítems:** No requieren un estado individual; se definen únicamente por:
  - 💊 Nombre del medicamento.
  - ⚖️ Dosis.
  - 🔢 Cantidad.
  - 📝 Indicaciones de uso.

------

## 🛠️ 2) Requerimientos Técnicos

### 🔐 Autenticación y Autorización

- **Token Management:** Implementación de **JWT de acceso + refresh token** (con rotación recomendada). Almacenamiento seguro mediante **HTTP-Only cookies** o Bearer tokens.
- **RBAC (Role-Based Access Control):** Uso de **Guards** con decoradores personalizados `@Roles('admin' | 'doctor' | 'patient')`.
- **Seguridad de Rutas:** Protección de endpoints y vistas tanto en la **API (Backend)** como en el **cliente (Front)** según el rol del usuario.

### 🛡️ Validación y Seguridad

- **Data Integrity:** Validación de DTOs mediante `class-validator` y serialización de datos con `class-transformer`.
- **Gobernanza de Errores:** Manejo estándar de excepciones mediante **Exception Filters** para garantizar códigos de estado HTTP precisos.
- **Hardening:** Aplicación de seguridad básica con **Helmet**, configuración de **CORS** y control de flujo con **rate limit**.

### 💾 Datos y Persistencia

- **Motor & ORM:** Uso de **PostgreSQL** gestionado a través de **Prisma**.
- **Arquitectura de DB:** Definición de relaciones correctas e implementación de **índices** en campos de búsqueda frecuente para optimizar el rendimiento.
- **Ciclo de Vida:** Gestión de esquema mediante **Prisma Migrate** y poblamiento de base de datos con **Seeders** para entornos de desarrollo.

### 🚀 Funcionalidades (Features) Mínimas

- **Listados Optimizados:** Implementación de **paginación y filtros** avanzados (por estado y fecha).
- **Data Sorting:** Ordenamiento parametrizable (por defecto `createdAt DESC`).
- **Borrado Lógico:** Implementación de **Soft Delete** para usuarios y prescripciones.
- **Documentación:** Generación de archivos **PDF** directamente desde el backend para las prescripciones médicas.

### 🧪 Estrategia de Testing

- **Backend:** Cobertura mínima con tests unitarios de servicios o pruebas **E2E** básicas utilizando **Jest** junto a Supertest o Pactum.
- **Frontend:** Pruebas funcionales de un componente core o un hook crítico del sistema.

------

## 🗄️ 3) Modelado de Datos (Prisma)

El diseño de la base de datos se basa en un modelo relacional que separa la identidad del usuario de sus perfiles especializados, optimizado para consultas de alto rendimiento mediante índices específicos.

### 🧬 Schema de Prisma (`schema.prisma`)

Fragmento de código

```
// schema.prisma

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String
  role          Role      @default(patient)
  createdAt     DateTime  @default(now())

  // Perfiles opcionales según el rol
  doctor        Doctor?   @relation(fields: [doctorId], references: [id])
  doctorId      String?
  patient       Patient?  @relation(fields: [patientId], references: [id])
  patientId     String?

  // Trazabilidad de autoría
  prescriptionsAuthored Prescription[] @relation("AuthoredBy")
}

enum Role {
  admin
  doctor
  patient
}

model Doctor {
  id            String         @id @default(cuid())
  user          User           @relation(fields: [userId], references: [id])
  userId        String         @unique
  specialty     String?
  prescriptions Prescription[] @relation("AuthoredBy")
}

model Patient {
  id            String         @id @default(cuid())
  user          User           @relation(fields: [userId], references: [id])
  userId        String         @unique
  birthDate     DateTime?
  prescriptions Prescription[]
}

model Prescription {
  id          String             @id @default(cuid())
  code        String             @unique // Identificador para QR en PDF
  status      PrescriptionStatus @default(pending)
  notes       String?           
  createdAt   DateTime           @default(now())
  consumedAt  DateTime?         

  // Relaciones
  patient     Patient            @relation(fields: [patientId], references: [id])
  patientId   String            
  author      Doctor             @relation("AuthoredBy", fields: [authorId], references: [id])
  authorId    String            
  
  items       PrescriptionItem[]

  // ⚡ Índices sugeridos 
  @@index([status, createdAt])    // Optimiza métricas por estado y día
  @@index([patientId])            // Agiliza carga de bandeja del paciente
  @@index([authorId])             // Mejora búsqueda de recetas por médico
}

enum PrescriptionStatus {
  pending 
  consumed
}

model PrescriptionItem {
  id             String       @id @default(cuid())
  prescription   Prescription @relation(fields: [prescriptionId], references: [id])
  prescriptionId String      
  
  name           String       // Producto digitado manualmente
  dosage         String?     
  quantity       Int?         // Unidades indicadas
  instructions   String?     
}
```

------

## 📡 4) API: Contratos Mínimos

La API está diseñada siguiendo principios REST, con respuestas consistentes y control de acceso basado en roles (RBAC).

### 🔐 Autenticación (Auth)

- **POST** `/auth/register`: Registro de nuevos usuarios (**patient** o **doctor**).
- **POST** `/auth/login`: Retorna `{ accessToken, refreshToken }`.
- **POST** `/auth/refresh`: Genera un nuevo `{ accessToken }`.
- **GET** `/auth/profile`: Retorna la información del usuario autenticado y su rol.

### 👥 Gestión de Usuarios e Identidades

- **Usuarios (Admin):**
  - **GET** `/users?role=doctor|patient&query=`: Listado paginado de usuarios.
  - **POST** `/users`: Creación manual de usuarios con rol y datos básicos.
- **Perfiles Específicos:**
  - **GET** `/patients`: Listado paginado con filtros simples.
  - **GET** `/doctors`: Listado paginado con filtros simples.

### 📝 Prescripciones Médicas

#### 👨‍⚕️ Módulo de Médicos

- **POST** `/prescriptions`: Creación de una nueva prescripción.

  - **Body esperado:**

    JSON

    ```
    {
      "patientId": "uuid",
      "notes": "Observaciones adicionales",
      "items": [
        {
          "name": "Amoxicilina 500mg",
          "dosage": "1 c/8h",
          "quantity": 15,
          "instructions": "Después de comer"
        }
      ]
    }
    ```

- **GET** `/prescriptions?mine=true&status=&from=&to=&page=&limit=&order=`: Listado de prescripciones creadas por el médico.

- **GET** `/prescriptions/:id`: Detalle de una prescripción específica.

#### 👤 Módulo de Pacientes

- **GET** `/me/prescriptions?status=&page=&limit=`: Listado de prescripciones asignadas al paciente.
- **PUT** `/prescriptions/:id/consume`: Marca una prescripción como **consumida** (solo si pertenece al paciente).
- **GET** `/prescriptions/:id/pdf`: Genera y descarga el comprobante en formato **PDF**.

#### ⚡ Módulo de Administrador

- **GET** `/admin/prescriptions?status=&doctorId=&patientId=&from=&to=&page=&limit=`: Control total y supervisión de todas las prescripciones del sistema.

### 📊 Métricas de Control (Admin)

- **GET** `/admin/metrics?from=&to=`: Retorna un resumen estadístico global.
  - **Respuesta:**

JSON

```
        {
          "totals": { "doctors": 10, "patients": 120, "prescriptions": 560 },
          "byStatus": { "pending": 120, "consumed": 440 },
          "byDay": [ { "date": "2026-10-25", "count": 20 } ],
          "topDoctors": [ { "doctorId": "uuid", "count": 50 } ]
        }
        ```

```

### 🛡️ Reglas de Acceso y Errores
*   **Permisos:**
    *   **Doctor:** Solo visualiza y gestiona las prescripciones que él mismo ha creado.
    *   **Paciente:** Solo visualiza y marca como consumidas sus propias prescripciones.
    *   **Admin:** Acceso total a todos los recursos y visualización de métricas.
*   **Gestión de Errores:** Todas las respuestas de error siguen el formato:
    `{ "message": "Descripción", "code": "ERROR_CODE", "details": {} }`
    *(Manejo de códigos 400, 401, 403, 404, 409 y 500 según corresponda).*

------

## 💻 5) Frontend (Páginas Mínimas)

La interfaz de usuario está diseñada para ser intuitiva y funcional, con vistas especializadas para cada tipo de rol y un enfoque en la experiencia de usuario (UX).

### 🔑 Autenticación

- **`/login`**: Formulario de acceso mediante email y password. Se encarga de la persistencia de tokens de seguridad y la carga del perfil de usuario.

### 👨‍⚕️ Vistas del Médico

- **`/doctor/prescriptions`**: Panel principal con listado de prescripciones, filtros avanzados por estado/fecha y paginación.
- **`/doctor/prescriptions/new`**: Formulario dinámico para la creación de recetas, permitiendo agregar o eliminar ítems (medicamentos) en tiempo real.
- **`/doctor/prescriptions/[id]`**: Vista detallada de una prescripción específica.

### 👤 Vistas del Paciente

- **`/patient/prescriptions`**: Listado de recetas asignadas con acciones rápidas: **Marcar como consumida** y **Descargar PDF**.
- **`/patient/prescriptions/[id]`**: Detalle completo de la receta e instrucciones médicas.

### 📊 Dashboard del Administrador

- **`/admin`**: Panel de control con KPIs y visualización de datos utilizando librerías como Recharts o Chart.js:
  - Tarjetas con totales globales (doctores, pacientes, prescripciones).
  - Gráficos de distribución por estado de receta.
  - Serie temporal de actividad de los últimos 30 días.
  - (Opcional) Ranking de médicos por volumen de prescripciones.

------

### ✨ UX/UI y Reglas de Negocio

Para asegurar una aplicación robusta y profesional, se han implementado los siguientes estándares:

- **Diseño Responsive**: Interfaz adaptable basada en grids y sistemas de cards.
- **Feedback Constante**: Gestión de estados de **carga (loading)**, **error** y **vistas vacías (empty states)**.
- **Notificaciones**: Uso de **Toasts** para confirmar acciones exitosas (creación, consumo) o reportar fallos.
- **Seguridad**: Protección de rutas mediante Middlewares basados en el rol del usuario.
- **Navegación Inteligente**: Filtros con persistencia mediante *querystring* para facilitar el uso compartido de enlaces y la navegación hacia atrás.

------

## 📄 6) PDF de Prescripción (Backend)

El sistema incluye un servicio de generación dinámica de documentos PDF para que los pacientes puedan descargar y conservar sus recetas de manera oficial.

### 🛠️ Implementación Técnica

- **Endpoint:** `GET /prescriptions/:id/pdf`.
- **Tecnologías:** Se han utilizado herramientas de alto rendimiento como **pdfkit**, **puppeteer/playwright** con plantillas HTML personalizadas, o **html-pdf** para garantizar un diseño limpio y profesional.

### 📋 Estructura del Documento

Cada archivo generado incluye la información esencial para su validez médica:

- **Información de Identidad:** Datos completos del paciente y del médico tratante.
- **Trazabilidad:** Fecha de emisión, código único de la receta y estado actual de la misma.
- **Detalle Clínico:** Lista exhaustiva de ítems, especificando nombre del medicamento, dosis, cantidad e instrucciones de uso.

### 🚀 Valor Agregado (Plus)

- **Código QR Integrado:** El documento cuenta con un **código QR** que vincula directamente al `code` de la prescripción. Al ser escaneado, redirige automáticamente a la vista de detalle en la plataforma: `/patient/prescriptions/:id`.

------

Entendido, aquí tienes la sección exactamente como aparece en la imagen **image_dc47df.png**, con una estructura limpia y profesional para tu readme:

------

## 🌱 7) Semillas y credenciales de prueba

- **Script `prisma/seed.ts` que cree:**
  - 👤 **1 admin:** `admin@test.com` / `admin123`
  - 👨‍⚕️ **1 médico:** `dr@test.com` / `dr123`
  - 🏥 **1 paciente:** `patient@test.com` / `patient123`
  - 📝 **5–10 prescripciones de ejemplo** (varias pending y consumed).

> 💡 **Nota:** Se acepta no tener UI de creación de usuarios si existen **seeds**.



------

## ⚙️ 8) Variables de entorno (guía)

Para el correcto funcionamiento del proyecto, es necesario configurar los siguientes archivos de entorno:

### 🖥️ Backend (`.env`):

Bash

```
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_TTL=900s     # 15m
JWT_REFRESH_TTL=7d
APP_ORIGIN=https://frontend-url
```

### 🌐 Frontend (`.env.local`):

Bash

```
NEXT_PUBLIC_API_BASE_URL=https://backend-url
```

------

## 📂 9) Estructura sugerida

El proyecto sigue una arquitectura modular y escalable tanto en el servidor como en el cliente.

### 🏗️ Backend

Plaintext

```
src/
├── main.ts
├── app.module.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   ├── refresh.strategy.ts
│   └── roles.guard.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   └── users.service.ts
├── patients/
├── doctors/
├── prescriptions/
│   ├── prescriptions.module.ts
│   ├── prescriptions.controller.ts
│   ├── prescriptions.service.ts
│   └── dto/
├── common/
│   ├── guards/
│   ├── interceptors/
│   └── filters/
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts
```

### 🖼️ Frontend

Plaintext

```
src/
├── app/ (o pages/)
│   ├── login/
│   ├── doctor/prescriptions/
│   │   ├── page.tsx
│   │   ├── new/
│   │   └── [id]/
│   ├── patient/prescriptions/
│   │   ├── page.tsx
│   │   └── [id]/
│   └── admin/
├── components/
├── lib/ (fetcher, auth, guards)
└── store/ (Zustand/Redux)
```

------

## 📦 10) Entregables

Para asegurar una entrega completa y profesional, el proyecto incluye los siguientes componentes:

1. **Repositorio GitHub** (mono-repo o dos repos):
   - 💻 Código fuente, migraciones y **seed**.
   - 📖 **README** con:
     - Instrucciones de **setup local** (Docker opcional), variables de entorno y scripts.
     - Guía sobre cómo correr **migraciones y seed**.
     - Listado de **cuentas de prueba**.
2. **Despliegue funcionando**:
   - 🌐 URLs activas de **Frontend y API** debidamente documentadas en el README.
3. **Documentación**:
   - 🧠 Detalle de **decisiones técnicas** (estrategia de autenticación, RBAC, generación de PDF, paginación, etc.).
   - 🔌 Especificación de **Endpoints** (OpenAPI/Swagger preferiblemente).
4. **Testing**:
   - 🧪 Comandos para la ejecución de **tests** y, en caso de aplicar, reporte de **coverage**.

------

## ⚖️ 11) Criterios de evaluación

El proyecto ha sido desarrollado teniendo en cuenta los siguientes pilares de evaluación:

- **⚙️ Funcionalidad (35%):** Implementación de flujos completos por rol, generación de PDF, sistemas de filtros/paginación y panel de métricas.
- **💎 Calidad de código (25%):** Organización en módulos claros, uso de DTOs para validación, manejo robusto de errores y consistencia técnica en TypeScript.
- **🏗️ Arquitectura (20%):** Correcta separación de capas, implementación de guards/strategies y uso eficiente de Prisma (incluyendo índices).
- **🎨 UX/UI (15%):** Diseño responsive, gestión de estados (carga/error/vacío), notificaciones mediante toasts y una excelente experiencia de desarrollo (DX) en el frontend.
- **🧪 Testing (5%):** Pruebas unitarias o de integración mínimas que cubren las funcionalidades críticas del sistema.

------

## 🚀 12) Plus (opcionales, para destacar)

Para elevar la calidad del proyecto, se han considerado los siguientes puntos adicionales:

- **📑 Swagger** en `/docs` y colección de **Postman/Insomnia**.
- **📄 PDF** con **QR** y firma/cédula del médico (texto o imagen).
- **🔍 Auditoría**: tabla de **audit logs** para el seguimiento de cambios de estado.
- **📧 Notificaciones por email** automáticas al momento de crear una prescripción.
- **🔎 Búsqueda avanzada** mediante texto libre por nombre de ítem y notas.
- **🌓 Tema dark/light** con preferencia de usuario persistida.
- **⚡ SSE/WebSocket** para la visualización de métricas en vivo (implementación simple).

------

## ✅ 13) Aceptación (checklist del revisor)

Esta sección sirve como guía para validar que el proyecto cumple con los requisitos fundamentales establecidos:

- [ ] **Autenticación**: El Login funciona correctamente y devuelve el perfil/rol del usuario.
- [ ] **Seguridad**: Implementación efectiva de Guards/Decorators para proteger los roles operativos.
- [ ] **Flujo Médico**: El médico puede crear prescripciones con carga manual de ítems.
- [ ] **Flujo Paciente**: El paciente visualiza únicamente sus recetas y tiene habilitadas las opciones de **consumir** y **descargar PDF**.
- [ ] **Panel Admin**: El administrador tiene acceso a métricas con capacidad de filtrado por fecha.
- [ ] **UX de Listados**: Todas las tablas incluyen paginación, filtros y ordenamiento funcional.
- [ ] **Base de Datos**: Las migraciones y el script de **seed** se ejecutan sin errores.
- [ ] **Documentación**: El README contiene la información necesaria para levantar el proyecto en menos de 15 minutos.

------

## 🛠️ 14) Ejemplos de DTOs (guía)

Para asegurar la integridad de los datos en el backend, se utilizan **Data Transfer Objects (DTOs)** para validar las peticiones entrantes.

### 📝 Creación de Prescripción

Archivo: `create-prescription.dto.ts`

TypeScript

```
export class CreatePrescriptionDto {
  patientId: string;
  notes?: string;
  items: { 
    name: string; 
    dosage?: string; 
    quantity?: number;
    instructions?: string 
  }[];
}
```

### ✅ Actualización de Estado

Archivo: `update-status.dto.ts`

TypeScript

```
export class ConsumePrescriptionDto {
  consumed: boolean; // true
}
```

------

## 💡 15) Consideraciones

Para garantizar que el desarrollo se mantenga enfocado en los objetivos principales, se deben tener en cuenta las siguientes pautas:

- **Gestión de Productos**: No se exige un catálogo de productos predefinido; los ítems de la prescripción se escriben a mano directamente en el formulario.
- **Gestión de Usuarios**: Es posible registrar pacientes y médicos a través de **seed**. La implementación de un panel de administración para la creación manual de usuarios se considera una funcionalidad **Plus**.
- **Alcance del Proyecto**: Es fundamental mantener el alcance dentro de un **MVP** (Producto Mínimo Viable). Las funcionalidades "plus" son opcionales y sumarán puntos adicionales siempre que las funcionalidades core estén perfectamente ejecutadas.

------

**¡Demuestra tu capacidad técnica y de liderazgo creando una solución completa y profesional!**