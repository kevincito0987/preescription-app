# 🏗️ Arquitectura de Datos y Modelo Relacional

Este proyecto utiliza una base de datos relacional normalizada, diseñada para gestionar de manera eficiente y segura el flujo de prescripciones médicas entre doctores y pacientes.

## 🗄️ Diccionario de Datos

Basado en el diseño técnico del diagrama de entidad-relación (**ERDDiagram1.png**), las tablas se definen de la siguiente manera:

### 1. Tabla: `User`

Almacena la información de identidad y el rol de acceso para cada usuario del sistema.

| **Campo**     | **Tipo**     | **Restricciones** | **Descripción**                          |
| ------------- | ------------ | ----------------- | ---------------------------------------- |
| **id**        | VARCHAR(100) | PK                | Identificador único del usuario.         |
| **email**     | VARCHAR(300) | Unique            | Correo electrónico para autenticación.   |
| **password**  | VARCHAR(200) | -                 | Contraseña cifrada del usuario.          |
| **fullName**  | VARCHAR(200) | -                 | Nombre completo del usuario.             |
| **role**      | VARCHAR(100) | -                 | Rol asignado (ADMIN, DOCTOR, PATIENT).   |
| **createdAt** | TIMESTAMP    | -                 | Fecha y hora de registro.                |
| **updatedAt** | TIMESTAMP    | -                 | Fecha y hora de la última actualización. |
| **deletedAt** | TIMESTAMP    | -                 | Marca para borrado lógico (Soft Delete). |

### 2. Tabla: `Prescription`

Entidad principal que registra la creación de una receta médica y vincula a los actores involucrados.

| **Campo**       | **Tipo**     | **Restricciones** | **Descripción**                            |
| --------------- | ------------ | ----------------- | ------------------------------------------ |
| **id**          | VARCHAR(100) | PK                | Identificador único de la prescripción.    |
| **medicalCode** | VARCHAR(100) | -                 | Código de referencia para el paciente.     |
| **doctorId**    | VARCHAR(100) | FK                | Relación con el User que emite la receta.  |
| **patientId**   | VARCHAR(100) | FK                | Relación con el User que recibe la receta. |
| **notes**       | TEXT         | -                 | Observaciones o indicaciones generales.    |
| **status**      | VARCHAR(100) | -                 | Estado actual (PENDING, CONSUMED).         |
| **createdAt**   | TIMESTAMP    | -                 | Fecha de emisión de la receta.             |
| **updatedAt**   | TIMESTAMP    | -                 | Fecha de última modificación de estado.    |

### 3. Tabla: `PrescriptionItem`

Detalle atómico de los medicamentos o insumos vinculados a una prescripción específica.

| **Campo**          | **Tipo**     | **Restricciones** | **Descripción**                       |
| ------------------ | ------------ | ----------------- | ------------------------------------- |
| **id**             | VARCHAR(100) | PK                | Identificador único del ítem.         |
| **prescriptionId** | VARCHAR(100) | FK                | Vínculo con la prescripción cabecera. |
| **name**           | VARCHAR(300) | -                 | Nombre del medicamento.               |
| **dosage**         | VARCHAR(100) | -                 | Dosis recomendada (ej. 500mg).        |
| **quantity**       | INTEGER      | -                 | Cantidad de unidades prescritas.      |
| **instructions**   | TEXT         | -                 | Instrucciones detalladas de uso.      |

------

## 🔗 Relaciones y Lógica de Negocio

### 1. User ↔ Prescription (Segun su Rol Puede Hacer)

- **Relación:** Uno a Muchos (1:N).
- **Lógica:** Un usuario, dependiendo de su rol, puede estar vinculado a múltiples prescripciones. Un `DOCTOR` puede generar múltiples registros en la tabla `Prescription`, mientras que un `PATIENT` puede tener múltiples recetas asignadas a su historial.

### 2. Prescription ↔ PrescriptionItem (Puede Tener Vinculados)

- **Relación:** Uno a Muchos (1:N).
- **Lógica:** Una sola `Prescription` funciona como una cabecera que puede tener vinculados múltiples `PrescriptionItem`. Esta normalización permite que una orden médica contenga diversos medicamentos sin repetir información de los usuarios o estados generales.

------

## ⚡ Notas de Implementación

- **Tipado Estricto:** Se respetan las extensiones de caracteres definidas (ej. VARCHAR 300 para correos y nombres de medicamentos) para asegurar la integridad de los datos largos.
- **Trazabilidad:** El uso de `TIMESTAMP` en todas las tablas permite generar las métricas solicitadas para el rol de Administrador de manera precisa.

------

## ⚡ Optimización y Rendimiento

Para cumplir con los criterios de evaluación de arquitectura, se han implementado los siguientes **índices**:

| **Tabla**      | **Campo Indexado** | **Motivo**                                                   |
| -------------- | ------------------ | ------------------------------------------------------------ |
| `User`         | `email`            | Optimización del tiempo de respuesta en el Login.            |
| `Prescription` | `patientId`        | Filtrado instantáneo de recetas en el Dashboard del paciente. |
| `Prescription` | `createdAt`        | Rendimiento en la generación de métricas para el Administrador por rangos de fecha. |
| `Prescription` | `status`           | Agilidad en los listados de recetas pendientes vs. consumidas. |

------

### 🚀 Uso de Tipos en el Stack

Dado que el proyecto utiliza **TypeScript** en todo el stack, las interfaces de estas tablas se comparten entre el Backend (NestJS) y el Frontend (Next.js), garantizando que los datos consumidos por la API coincidan exactamente con la estructura definida en el esquema de Prisma.