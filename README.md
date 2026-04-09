# DFA Simulator for Beginners 🚀

¡Bienvenido al **Simulador Visual de Autómatas Finitos (DFA)**! Este proyecto es una aplicación web local que te permite diseñar, dibujar y poner a prueba grafos de máquinas de estado con el ratón o mediante texto.

No necesitas saber programar en absoluto para usarlo. Solo sigue estos pasos súper rápidos:

---

## 🛠️ Requisitos Previos

Solo necesitas tener instalado un programa base en tu computadora llamado **Node.js** (es el motor que enciende la página web).
1. Entra a [https://nodejs.org/es](https://nodejs.org/es)
2. Descarga e instala en tu computadora la versión recomendada (LTS). Es una instalación normal de darle a "Siguiente, Siguiente, Siguiente".

---

## 🚀 Cómo iniciar el sistema por primera vez

Abre tu **Terminal** (o Línea de Comandos/Símbolo del Sistema) y sigue estos dos sencillos pasos:

### 1. Clonar el repositorio y entrar a la carpeta
Primero tienes que descargar el código del proyecto a tu computadora.
```bash
git clone https://github.com/gSoto23/fsm-nao.git
cd fsm-nao
```

### 2. Instalar dependencias
Primero necesitas decirle a la terminal que descargue los legos y piezas que usa nuestra app dibujante de autómatas.
```bash
# Escribe o pega esto en tu terminal dentro de la carpeta FSM:
npm install
```
*(Espera un minuto o menos a que termine de descargar las cosas de internet).*

### 3. Encender el servidor
Para echar a andar la aplicación, solo tienes que escribir:
```bash
npm run dev
```

Te aparecerá algo como esto:
> `➜  Local:   http://localhost:5173/`

¡Da clic en esa liga azul, o escríbela en tu navegador (Google Chrome, Safari, Firefox)!
¡Listo! Ya estarás en la pantalla del simulador.

---

## 🎮 Cómo usar el programa (Tus herramientas)

La máquina está pensada para ser tu lienzo mental.

*   **Añadir Estados (+ Add State)**: Crea un círculo o nodo nuevo (q0, q1, etc.).
*   **Dibujar Líneas**: Da clic sostenido en cualquier punto del lienzo o arrastrando un nuevo estado y conéctalo a otro estado para unirlos lógicamente. (Si deseas que el lazo regrese a si mismo en autoo-bucle ¡solo suéltalo donde lo tomaste!).
*   **Panel de Propiedades**: Haz clic en cualquier elemento (circulo o flecha). Del lado derecho o inferior verás un panel para editar su función real:
    *   *Si elegiste un Círculo:* Te dirá si quieres que sea Inicial (Inicia ahí el rastreo) o de Aceptación (Doble raya de finalización exitosa).
    *   *Si elegiste una Flecha:* Puedes escribir las letras, números o símbolos que detonan esa línea separados por comas (ejemplo: `a,b,c` o `0,1`).
*   **As Text**: ¡Exporta todo el diagrama gráfico que acabas de pintar con tus manos! Con un solo clic se generará todo un esquema matemático en texto puro `#states ... #transitions` para tu comodidad.
*   **Import**: Trabaja a la inversa al botón anterior. Pega texto matemático estricto, y el simulador convertirá tus palabras en círculos saltando en un canvas interactivo de manera automática.
*   **Export PDF**: ¡Toma una instantánea fotográfica PDF en alta resolución! Perfecta para insertar en tus apuntes o reportes y sin que te roben resolución, libre de botones (sólo tus estados).

**¿Todo Listo?**
Da clic al botón verde de "Run Simulator", introduce tu palabra de prueba, ¡y disfruta el show visual de validación de lenguaje!
