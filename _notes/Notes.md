# 🦅 Clean Architecture: Guía Maestra de Aprendizaje

Este documento es tu brújula para navegar por el código de este proyecto. Aquí desglosamos la teoría detrás de la práctica, diseñado para que entiendas **por qué** las cosas están donde están.

---

## 🧠 Parte 1: El 80/20 (Los Pilares Fundamentales)

Si solo recuerdas 3 cosas, que sean estas. Son el **20% del conocimiento que te da el 80% del resultado**.

### 1. La Regla de Dependencia (La Ley de Oro)
> **"El código interno (Dominio) NO debe conocer al código externo (Infraestructura/Presentación)."**

Las flechas de dependencia **siempre apuntan hacia adentro**.
- ✅ `Controller` (Presentación) importa `Service` (Dominio).
- ✅ `RepositoryImpl` (Infraestructura) importa `Entity` (Dominio).
- ❌ `Entity` (Dominio) importa `Controller` (!ERROR GRAVE!).

```mermaid
graph BT
    subgraph "Capa Externa (Volátil)"
        P[Presentación (UI/API)]
        I[Infraestructura (BD/External APIs)]
    end
    subgraph "Capa Interna (Estable)"
        D[DOMINIO (Entidades/Reglas)]
    end

    P -->|Conoce a| D
    I -->|Implementa a| D
    
    style D fill:#f9f,stroke:#333,stroke-width:2px,color:black
    style P fill:#bbf,stroke:#333,color:black
    style I fill:#bfb,stroke:#333,color:black
```

### 2. Programar contra Interfaces (Abstracción)
Nunca dependas de la clase concreta (`SmtpEmailClient`), depende del contrato (`IEmailService`).
- **¿Por qué?** Esto permite cambiar de proveedor de email, de base de datos o de pasarela de pagos **sin tocar una sola línea de tu lógica de negocio**.

### 3. Separación de Modelos de Datos
Vas a ver 3 clases para el mismo concepto "Usuario". **Esto es intencional y necesario**.
1.  **`User` (Dominio):** Puro. Tiene lógica de negocio.
2.  **`UserDocument` (Infra - Mongo):** Tiene `_id`, decoradores, estructura de la BD.
3.  **`RegisterUserDto` (Presentación):** Tiene lo que el frontend manda (validaciones de string, password confirm, etc).

> **Insight:** Aceptamos la duplicación de código para ganar **DESACOPLAMIENTO**. Si cambias la BD, no quieres que se rompa el API del frontend.

---

## 🚫 Parte 2: Los 5 Errores de Principiante

Evita caer en estas trampas comunes al implementar Clean Architecture.

### 1. Modelo de Dominio Anémico 🩸
*   **El Error:** Crear Entidades (`User`) que son solo "bolsas de datos" (getters/setters) y poner toda la lógica en los Servicios.
*   **La Solución:** ¡Dale vida a tus objetos!
    *   *Mal:* `service.verificarSiUsuarioEsActivo(user)`
    *   *Bien:* `user.isActive()` (Lógica dentro de la entidad `User`).

### 2. Saltarse Capas (Atajos Mortales) 🚧
*   **El Error:** El `Controlador` llama directo al `Repositorio` para "ahorrar tiempo".
*   **Consecuencia:** Acoplas tu API a tu base de datos. Si mañana la lógica cambia, tendrás que buscar en todos los controladores.

### 3. Filtración de Infraestructura (Leaking) 🚰
*   **El Error:** Usar tipos de la DB en el Dominio. Ejemplo: Importar `ObjectId` de MongoDB dentro de `User.ts`.
*   **Consecuencia:** Tu dominio ahora es esclavo de Mongo. No podrás cambiar a SQL o probarlo en memoria fácilmente.

### 4. Over-Engineering (Matar moscas a cañonazos) 💥
*   **El Error:** Crear 10 archivos para un "Hola Mundo".
*   **Consejo:** Úsalo en proyectos que van a crecer o son complejos. Para scripts simples, esto es excesivo.

### 5. Confusión de DTOs 😵‍💫
*   **El Error:** "Reusar" el mismo objeto para DB, API y Dominio para "escribir menos".
*   **Consecuencia:** Un cambio en la tabla de la base de datos rompe accidentalmente la app móvil de los usuarios.

---

## 🏛️ Parte 3: El Contexto (Big Tech y Otras Arquitecturas)

Clean Architecture es excelente, pero ¿qué más existe?

### Alternativas Clásicas
*   **MVC (Modelo-Vista-Controlador):** Bueno para prototipos rápidos. Tiende a crear "Controladores Obesos".
*   **Hexagonal (Ports & Adapters):** La "madre" de Clean Architecture. Conceptualmente idéntica: Dominio al centro, puertos en el borde.

### ¿Qué usa Silicon Valley? (Escala Masiva)
En empresas como Google/Uber, el reto es la escala.

1.  **Microservicios:** Dividen el sistema en cientos de "Clean Architectures" pequeñitas interconectadas.
2.  **Event-Driven (Asincronía):** En lugar de llamar funciones, lanzan **Eventos** (`OrderPaid`). Tu `OrderService` hace esto enviando mensajes a la cola.

---

## 📚 Parte 4: Glosario de Componentes (Referencia Rápida)

Imprime esto o tenlo a mano mientras programas.

### 🧠 CAPA DE DOMINIO (El Corazón / El Jefe)

| Componente | Rol / Misión | Ejemplo en Código |
| :--- | :--- | :--- |
| **Entidad** | **Reglas y Estado.** El objeto de negocio con ID único. | `User.ts`, `Order.ts` |
| **Value Object** | **Inmutabilidad.** Objeto definido por su valor, autovalidable. | `Email.ts`, `Money.ts` |
| **Interfaz (Puerto)** | **Contrato.** Define "QUÉ" necesitamos, no "CÓMO". | `IUserRepository.ts` |
| **Servicio de Dominio** | **Orquestador.** Lógica que implica múltiples entidades. | `UserService.ts` |

### 🛠️ CAPA DE INFRAESTRUCTURA (Los Obreros / Herramientas)

| Componente | Rol / Misión | Ejemplo en Código |
| :--- | :--- | :--- |
| **Repositorio** | **Persistencia.** Implementa la interfaz. Habla SQL/Mongo. | `SqlUserRepository.ts` |
| **Mapper** | **Traductor.** Convierte entre Formato DB <-> Entidad Pura. | `UserMapper.ts` |
| **Infra DTO** | **Estructura DB.** Refleja la tabla o documento real. | `UserDocument.ts` |
| **Adaptador** | **Plugin.** Implementación real de un servicio externo. | `SmtpEmailClient.ts` |

### 🗣️ CAPA DE PRESENTACIÓN (La Cara al Público)

| Componente | Rol / Misión | Ejemplo en Código |
| :--- | :--- | :--- |
| **Controlador** | **Coordinador.** Recibe HTTP, valida entrada, llama dominio. | `UserController.ts` |
| **Presentation DTO** | **Contrato API.** Define qué JSON envía el usuario. | `RegisterUserDto.ts` |
| **Serializer** | **Formato Salida.** Prepara el JSON de respuesta (limpia secretos). | `UserSerializer.ts` |
| **Vista** | **Delivery.** Entrega el resultado final (HTML/JSON/Consola). | `ConsoleView.ts` |

### 🏗️ RAÍZ DE COMPOSICIÓN (El Ensamblador)

| Componente | Rol / Misión | Ejemplo en Código |
| :--- | :--- | :--- |
| **Main** | **Inyección de Dependencias.** Crea y conecta todas las piezas. | `main.ts` |

---
> **Nota final:** No te obsesiones con la perfección. La mejor arquitectura es la que permite que el software siga siendo "suave" (fácil de cambiar) a lo largo del tiempo.

-----------------

Esta técnica se llama formalmente **Optimistic Locking** (en español: **Bloqueo Optimista**) o también **Control de Concurrencia Optimista (OCC)**.

Es un patrón fundamental en el diseño de sistemas distribuidos y bases de datos. Aquí te explico por qué tiene ese nombre y cómo se compara con su rival.

### 1. ¿Por qué "Optimista"? 🙂

Se llama así porque el sistema tiene una actitud **positiva**.

* **La apuesta:** Asume que **rara vez** habrá conflictos.
* **La filosofía:** "Voy a dejar que leas el dato sin ponerle candado. Confío en que nadie más lo va a tocar mientras tú trabajas. Solo verificaré si hubo problemas al final, justo cuando intentes guardar".

Es ideal para la web (REST APIs) porque no bloquea la base de datos mientras el usuario piensa o llena un formulario en su navegador.

### 2. El Rival: Pessimistic Locking (Bloqueo Pesimista) 🔒

Para entenderlo mejor, compáralo con la alternativa vieja escuela:

* **Pessimistic Locking:** "No confío en nadie".
    * Cuando lees el dato (`SELECT ... FOR UPDATE`), le pones un candado a la fila en la base de datos.
    * Nadie más puede leer ni escribir en esa fila hasta que tú termines.
    * **Problema:** Si tu usuario se va a tomar un café con el formulario abierto, bloquea el registro para todos los demás. Mata el rendimiento.

---

### 3. El Flujo de la "Versión" (CAS - Compare And Swap)

La técnica que viste en el código implementa una operación lógica conocida como **Compare-And-Swap (CAS)**.

1.  **Lectura:** Obtienes `User { id: 1, saldo: 100, version: 1 }`.
2.  **Modificación:** En memoria cambias a `saldo: 50`.
3.  **Intento de Escritura:** Le dices a la base de datos:
    > *"Actualiza el saldo a 50 E INCREMENTA la versión a 2, **PERO SOLO SI** la versión actual sigue siendo 1".*



### 4. ¿Qué haces cuando falla? (El "Retry") 🔄

Si el `result.modifiedCount === 0`, significa que alguien te ganó de mano (la versión en BD ya era 2).

En ese punto, tu aplicación debe capturar el error y tomar una decisión. Lo más común es una estrategia de **Reintento Automático**:

1.  **Atrapas el error** de concurrencia.
2.  **Vuelves a leer** el usuario de la BD (ahora vendrá con `saldo: 80` y `version: 2` de la Request B).
3.  **Re-aplicas tu lógica** (Resta 50 ➡️ Saldo 30).
4.  **Vuelves a intentar guardar** (esperando que la versión siga siendo 2).

### Resumen para tu Glosario

| Concepto | Definición |
| :--- | :--- |
| **Nombre** | **Optimistic Locking** (Bloqueo Optimista) |
| **Herramienta** | Campo `version` (número) o `updated_at` (timestamp preciso). |
| **Escenario Ideal** | APIs Web, Apps móviles, sistemas con muchas lecturas y pocas escrituras simultáneas en el mismo dato. |
| **Ventaja** | Alto rendimiento, no bloquea la base de datos. |
| **Desventaja** | Tienes que programar la lógica de "qué hacer si falla" (reintentar o avisar al usuario). |