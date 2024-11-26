const coeficientes = {
    plastico: 0.140,
    corcho: 0.407,
    paño: 0.206
};

let animationId = null;
let tiempoInicio = null;
let bloqueA = null;
let bloqueB = null;
let distanciaTotal = 0;
let tiempoTotal = 0;
let aceleracionActual = 0;

function validarNumero(valor, min = 0) {
    const numero = parseFloat(valor.replace(',', '.'));
    return !isNaN(numero) && numero >= min && isFinite(numero);
}

function mostrarError(id, mensaje) {
    const errorElement = document.getElementById(`${id}-error`);
    errorElement.textContent = mensaje;
    errorElement.style.display = mensaje ? 'block' : 'none';
    return !!mensaje;
}

function validarEntradas() {
    let hayError = false;

    const voltaje = document.getElementById('voltaje').value.replace(',', '.');
    const distancia = document.getElementById('distancia').value.replace(',', '.');
    const peso = document.getElementById('peso').value.replace(',', '.');

    hayError = mostrarError('voltaje', 
        !validarNumero(voltaje) ? 'Ingrese un voltaje válido mayor a 0' : '') || hayError;
    
    hayError = mostrarError('distancia',
        !validarNumero(distancia) ? 'Ingrese una distancia válida mayor a 0' : '') || hayError;
    
    hayError = mostrarError('peso',
        !validarNumero(peso) ? 'Ingrese un peso válido mayor a 0' : '') || hayError;

    return !hayError;
}

function calcular() {
    if (!validarEntradas()) {
        return;
    }

    const material = document.getElementById('material').value;
    const voltaje = parseFloat(document.getElementById('voltaje').value.replace(',', '.'));
    const distancia = parseFloat(document.getElementById('distancia').value.replace(',', '.'));
    const peso = parseFloat(document.getElementById('peso').value.replace(',', '.'));

    const gravedad = 9.8; // m/s²
    const masaEnGramos = peso;
    const masaEnKilogramos = masaEnGramos / 1000;
    const coeficienteFriccion = coeficientes[material];
    const fuerzaNormal = masaEnKilogramos * gravedad;
    const fuerzaFriccion = coeficienteFriccion * fuerzaNormal;
    const fuerzaAplicada = voltaje * 0.5; 
    const fuerzaNeta = fuerzaAplicada - fuerzaFriccion;
    const aceleracion = Math.max(0.01, fuerzaNeta / masaEnKilogramos);
    const distanciaMetros = distancia / 100; 
    const tiempo = Math.sqrt((2 * distanciaMetros) / aceleracion);
    const velocidadFinal = aceleracion * tiempo;

    
    if (aceleracion < 0.01) {
        alert("La fuerza aplicada es insuficiente para vencer la fricción.");
        return;
    }

    if (tiempo > 60) { // Límite de tiempo razonable
        alert("El tiempo de recorrido es demasiado largo. Revisa los parámetros.");
        return;
    }

    console.log("Tiempo:", tiempo, "segundos");
    console.log("Velocidad final:", velocidadFinal, "m/s");
    console.log("Aceleración:", aceleracion, "m/s²");

    distanciaTotal = distancia;
    tiempoTotal = tiempo;
    aceleracionActual = aceleracion;

    document.getElementById('resultado').innerHTML = `
        <p><strong>Coeficiente de fricción:</strong> ${coeficienteFriccion.toFixed(3)}</p>
        <p><strong>Fuerza Normal:</strong> ${fuerzaNormal.toFixed(2)} N</p>
        <p><strong>Fuerza de Fricción:</strong> ${fuerzaFriccion.toFixed(2)} N</p>
        <p><strong>Fuerza Aplicada:</strong> ${fuerzaAplicada.toFixed(2)} N</p>
        <p><strong>Aceleración:</strong> ${aceleracion.toFixed(2)} m/s²</p>
        <p><strong>Tiempo estimado:</strong> ${tiempo.toFixed(2)} segundos</p>
        <p><strong>Velocidad final:</strong> ${velocidadFinal.toFixed(2)} m/s</p>
    `;

    resetearAnimacion();
    document.getElementById('btnIniciar').disabled = false;
}

function inicializarBloques() {
    const canvas = document.getElementById('simulacion');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    bloqueA = {
        x: canvas.width * 0.3,
        y: canvas.height * 0.5,
        width: 60,
        height: 60,
        color: '#008f39'
    };

    bloqueB = {
        x: canvas.width * 0.6,
        y: canvas.height * 0.5,
        width: 60,
        height: 60,
        color: '#cc0605'
    };
}

function dibujarEscena() {
    const canvas = document.getElementById('simulacion');
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = bloqueA.color;
    ctx.fillRect(bloqueA.x, bloqueA.y, bloqueA.width, bloqueA.height);
    ctx.fillStyle = bloqueB.color;
    ctx.fillRect(bloqueB.x, bloqueB.y, bloqueB.width, bloqueB.height);
    ctx.beginPath();
    ctx.moveTo(bloqueA.x + bloqueA.width, bloqueA.y + bloqueA.height/2);
    ctx.lineTo(bloqueB.x, bloqueB.y + bloqueB.height/2);
    ctx.strokeStyle = '#2c3e50';
    ctx.stroke();
}

function actualizarPosiciones(progreso) {
    if (!bloqueA || !bloqueB) return;

    const canvas = document.getElementById('simulacion');
    const distanciaMaxima = (distanciaTotal / 100) * (canvas.width * 0.8);
    
    // Usando la ecuación de movimiento con aceleración constante
    // d = (1/2)at²
    const desplazamiento = (0.5 * aceleracionActual * Math.pow(progreso * tiempoTotal, 2));
    const proporcionDesplazamiento = desplazamiento / (distanciaTotal / 100);
    
    const nuevaPosicionA = canvas.width * 0.3 + (proporcionDesplazamiento * canvas.width * 0.4);
    bloqueA.x = Math.min(nuevaPosicionA, canvas.width - bloqueA.width - bloqueB.width - 40);
    bloqueB.x = bloqueA.x + bloqueA.width + 20;
}

function iniciarAnimacion() {
    if (animationId) return;
    if (!distanciaTotal || !tiempoTotal) {
        alert('Por favor, calcule los valores primero');
        return;
    }

    document.getElementById('btnIniciar').disabled = true;
    tiempoInicio = Date.now();
    animarMovimiento();
}

function animarMovimiento() {
    const tiempoTranscurrido = (Date.now() - tiempoInicio) / 1000;
    const progreso = tiempoTranscurrido / tiempoTotal;

    if (progreso >= 1) {
        cancelAnimationFrame(animationId);
        animationId = null;
        document.getElementById('btnIniciar').disabled = false;
        return;
    }

    actualizarPosiciones(progreso);
    dibujarEscena();
    animationId = requestAnimationFrame(animarMovimiento);
}

function resetearAnimacion() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    inicializarBloques();
    dibujarEscena();
    document.getElementById('btnIniciar').disabled = false;
}

window.onload = function() {
    inicializarBloques();
    dibujarEscena();
};

window.addEventListener('resize', function() {
    inicializarBloques();
    dibujarEscena();
});