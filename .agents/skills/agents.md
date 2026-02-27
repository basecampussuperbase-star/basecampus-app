# 💻 CONTEXTO DE DESARROLLO FRONTEND: PROYECTO BASE

Este archivo define las reglas, el contexto y la lógica de negocio que debe seguir el **Agente de Frontend** para la construcción de la interfaz de **BASE**, el ecosistema educativo híbrido.

---

## 1. Visión del Proyecto
**BASE** es una plataforma híbrida (digital + física) para creadores de contenido. 
* **Core:** Venta de cursos (LMS) + Reserva de espacios físicos (Estudios en Caracas).
* **Target:** Mentores y estudiantes de LATAM.
* **Estética:** Premium, limpia, tipo "lienzo" para resaltar el contenido del creador.

---

## 2. Reglas Técnicas Obligatorias
* **Stack:** Next.js (App Router), Tailwind CSS.
* **Mobile-First:** La interfaz debe estar optimizada para dispositivos móviles antes que para desktop.
* **Idioma:** 100% en **Español** (UI, mensajes de error, estados de carga).
* **Auth:** Manejo de sesión mediante JWT (Refresh Tokens). Persistencia segura.
* **Rendimiento:** Carga diferida de imágenes y skeletons para estados de carga.

---

## 3. Arquitectura de Vistas por Rol (RBAC)
La navegación y los componentes deben renderizarse según el rol del usuario:

### A. Estudiante (User)
- **Dashboard:** Progreso visual de cursos activos e insignias de logros.
- **Biblioteca:** Grid de cursos comprados.
- **Player:** Reproductor de video (streaming S3) con barra de progreso y descarga de certificados.
- **IA Assistant:** Botón flotante de IA para resumir la clase actual.

### B. Mentor (Creador)
- **Panel de Ventas:** Gráficas de ingresos en tiempo real.
- **Wallet:** Vista de saldo (Disponible vs. Retenido) y botón de retiro (disponible cada 15 días).
- **Gestor de Cursos:** Formulario modular para subir videos y material.
- **Booking:** Calendario interactivo para reservar salas físicas en el campus.

### C. Operador Campus (Administración Física)
- **Check-in:** Vista para validar códigos QR de acceso a salas.
- **Calendario Maestro:** Gestión de disponibilidad de estudios en tiempo real.

### D. Admin Financiero
- **Liquidaciones:** Tabla de solicitudes de retiro de mentores.
- **Reportes:** Visualización del *Revenue Split* (20-35% BASE / 65-80% Mentor).

---

## 4. Lógica de Negocio Crítica (Frontend)

1.  **Cálculos de Split:** Aunque el backend procesa el pago, el frontend debe mostrar claramente al mentor el desglose:
    * `Precio de Venta - Comisión Pasarela - Comisión BASE = Ganancia Neta`.
2.  **Estados de la Wallet:**
    * **Saldo Pendiente:** Dinero en periodo de garantía (7 días).
    * **Saldo Disponible:** Dinero listo para retirar.
3.  **Sistema de Reservas:** No permitir reservas en fechas pasadas ni en horarios bloqueados por el backend.

---

## 6. Instrucciones para el Agente
1.  **Modularidad:** Crear componentes atómicos (Buttons, Cards, Modals) en la carpeta `/components`.
2.  **Feedback:** Cada interacción que involucre dinero o carga de archivos debe mostrar un *Spinner* o *Progress Bar*.
3.  **Validaciones:** Validar todos los formularios (Zod/React Hook Form) antes de enviar datos al API.
4.  **No Emails:** No diseñar flujos de correo; toda comunicación es vía notificaciones **In-App**.

---
## 7. Tecnologías y Estándares
El desarrollo debe alinearse con las siguientes mejores prácticas y herramientas:

* **Framework:** Next.js (App Router), Tailwind CSS.
* **Mobile-First:** La interfaz debe estar optimizada para dispositivos móviles antes que para desktop.
* **React Best Practices:** Implementar patrones de componentes funcionales, hooks personalizados y optimización de renderizado.
* **Diseño UI/UX:** Enfoque en *Mobile Design* y experiencia de usuario fluida, asegurando alta accesibilidad.



---