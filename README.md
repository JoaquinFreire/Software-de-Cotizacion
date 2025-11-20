# 🏗️ Sistema de Cotización de Aberturas de Aluminio

> Proyecto desarrollado como parte de la carrera **Analista en Sistemas** en la **Universidad Nacional de Córdoba (UNC)**.  
> Implementa una **API REST** con **autenticación JWT**, **React en el frontend**, y una **arquitectura híbrida con DDD**.  

---

## 📖 Descripción

Este sistema permite a los usuarios realizar cotizaciones de aberturas de aluminio de manera eficiente y organizada.  
Se enfoca en la gestión de clientes, materiales y precios, asegurando **precisión en los cálculos** y **seguridad en los datos**.  

### 🎯 **Objetivos**
✅ Facilitar la creación y Gestión de cotizaciones.  
✅ Implementar un **login seguro** con **legajo y contraseña**.  
✅ Aplicar **principios de DDD (Domain-Driven Design)** en la arquitectura.  
✅ Integrar **MySQL** como base de datos principal y, en el futuro, **MongoDB** para formularios dinámicos.  

---

## 🚀 Tecnologías Utilizadas

### **🖥️ Backend**
- **C# con .NET**
- **Entity Framework** (MySQL)
- **Autenticación con JWT**
- **Arquitectura híbrida con DDD**
- **BCrypt** para hasheo de contraseñas

### **🌐 Frontend**
- **React**
- **Axios** para consumo de la API

### **🗄️ Base de Datos**
- **MySQL** (datos principales)
- **MongoDB** *(futuro uso para almacenamiento de formularios dinámicos)*  

---

## 📂 Estructura del Proyecto

![image](https://github.com/user-attachments/assets/2e951e7a-66df-4315-b6cb-bb8e4103de96)


## ⚙️ Instalación y Configuración

1️⃣ **Clonar el repositorio**
git clone https://github.com/tu-usuario/software-de-cotizacion.git
cd software-de-cotizacion

2️⃣ Configurar el Backend

    1 - Crear el archivo .env en Backend/ con:
        JWT_SECRET_KEY=
        JWT_ISSUER=
        JWT_AUDIENCE=
        DB_CONNECTION_STRING=

    2 - Instalar dependencias y ejecutar
        cd Backend
        dotnet restore
        dotnet run

3️⃣ Configurar el Frontend
    1 - Crear el archivo .env en Frontend/ con:
        REACT_APP_API_URL=http://
    2 - Instalar dependencias y ejecutar
        cd Frontend
        npm install
        npm start

🔥 Endpoints Principales
- 
![image](https://github.com/user-attachments/assets/d20ee9ca-0753-47f8-9531-99eab2cd47b6)



📌 Estado del Proyecto

🟢 En desarrollo: Actualmente trabajando en la funcionalidad de creación de cotizaciones y la interfaz de usuario.
🔜 Próximos pasos: Implementación de MongoDB para almacenamiento de formularios dinámicos.
🧑‍💻 Autores

👨‍💻 [Fontanari Bruno]
👨‍💻 [Freire Joaquín]
👨‍💻 [Morales Leonardo]

📍 Universidad Nacional de Córdoba - 2025


📜 Licencia

Este proyecto es de uso académico y no comercial.


🎯 Si te sirvió este proyecto, dale ⭐ en GitHub y contribuye con mejoras! 🚀
