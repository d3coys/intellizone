// Define the Matrix4 class for handling 4x4 matrices
class Matrix4 {
    constructor() {
        // Initialize matrix elements to a 16-element Float32Array
        this.elements = new Float32Array(16);
        this.setIdentity();
    }

    // Set the matrix to the identity matrix
    setIdentity() {
        const e = this.elements;
        e[0] = 1; e[4] = 0; e[8] = 0; e[12] = 0;
        e[1] = 0; e[5] = 1; e[9] = 0; e[13] = 0;
        e[2] = 0; e[6] = 0; e[10] = 1; e[14] = 0;
        e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
        return this;
    }

    // Set the matrix to a rotation matrix
    setRotate(angle, x, y, z) {
        const e = this.elements;
        angle = Math.PI * angle / 180;
        const s = Math.sin(angle);
        const c = Math.cos(angle);

        if (x !== 0 && y === 0 && z === 0) {  // Rotation around X-axis
            if (x < 0) s = -s;
            e[0] = 1; e[4] = 0; e[8] = 0; e[12] = 0;
            e[1] = 0; e[5] = c; e[9] = -s; e[13] = 0;
            e[2] = 0; e[6] = s; e[10] = c; e[14] = 0;
            e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
        } else if (x === 0 && y !== 0 && z === 0) {  // Rotation around Y-axis
            if (y < 0) s = -s;
            e[0] = c; e[4] = 0; e[8] = s; e[12] = 0;
            e[1] = 0; e[5] = 1; e[9] = 0; e[13] = 0;
            e[2] = -s; e[6] = 0; e[10] = c; e[14] = 0;
            e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
        } else if (x === 0 && y === 0 && z !== 0) {  // Rotation around Z-axis
            if (z < 0) s = -s;
            e[0] = c; e[4] = -s; e[8] = 0; e[12] = 0;
            e[1] = s; e[5] = c; e[9] = 0; e[13] = 0;
            e[2] = 0; e[6] = 0; e[10] = 1; e[14] = 0;
            e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
        } else {  // General rotation
            const len = Math.sqrt(x * x + y * y + z * z);
            if (len !== 1) {
                const rlen = 1 / len;
                x *= rlen;
                y *= rlen;
                z *= rlen;
            }
            const nc = 1 - c;
            const xy = x * y;
            const yz = y * z;
            const zx = z * x;
            const xs = x * s;
            const ys = y * s;
            const zs = z * s;
            e[0] = x * x * nc + c;
            e[1] = xy * nc + zs;
            e[2] = zx * nc - ys;
            e[3] = 0;
            e[4] = xy * nc - zs;
            e[5] = y * y * nc + c;
            e[6] = yz * nc + xs;
            e[7] = 0;
            e[8] = zx * nc + ys;
            e[9] = yz * nc - xs;
            e[10] = z * z * nc + c;
            e[11] = 0;
            e[12] = 0;
            e[13] = 0;
            e[14] = 0;
            e[15] = 1;
        }
        return this;
    }
}

// Vertex shader program
const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  void main() {
    gl_Position = u_ModelMatrix * a_Position;
  }
`;

// Fragment shader program
const FSHADER_SOURCE = `
  void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red color
  }
`;

function main() {
    // Retrieve the <canvas> element
    const canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.error('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.error('Failed to initialize shaders.');
        return;
    }

    // Set the vertex coordinates
    const n = initVertexBuffers(gl);
    if (n < 0) {
        console.error('Failed to set the positions of the vertices.');
        return;
    }

    // Get the storage location of u_ModelMatrix
    const u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.error('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    // Create a model matrix
    const modelMatrix = new Matrix4();

    // Current rotation angle
    let currentAngle = 0.0;
    const ANGLE_STEP = 30.0; // Rotation angle per second

    // Animation function
    function tick() {
        currentAngle = animate(currentAngle, ANGLE_STEP);
        draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix);
        requestAnimationFrame(tick);
    }
    tick();
}

function initShaders(gl, vshaderSource, fshaderSource) {
    // Create shader program
    const program = createProgram(gl, vshaderSource, fshaderSource);
    if (!program) {
        console.log('Failed to create program');
        return false;
    }

    // Use the program object
    gl.useProgram(program);
    gl.program = program;

    return true;
}

function createProgram(gl, vshader, fshader) {
    // Create shader objects
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
    if (!vertexShader || !fragmentShader) {
        return null;
    }

    // Create a program object
    const program = gl.createProgram();
    if (!program) {
        return null;
    }

    // Attach the shader objects
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    // Link the program object
    gl.linkProgram(program);

    // Check the result of linking
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
        const error = gl.getProgramInfoLog(program);
        console.log('Failed to link program: ' + error);
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return null;
    }
    return program;
}

function loadShader(gl, type, source) {
    // Create a shader object
    const shader = gl.createShader(type);
    if (shader == null) {
        console.log('unable to create shader');
        return null;
    }

    // Set the shader source code
    gl.shaderSource(shader, source);

    // Compile the shader
    gl.compileShader(shader);

    // Check the result of compilation
    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
        const error = gl.getShaderInfoLog(shader);
        console.log('Failed to compile shader: ' + error);
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function initVertexBuffers(gl) {
    // Create a Float32Array containing the vertices of the polygon
    const vertices = new Float32Array([
        0.0,  0.5,  -0.5, 0.2,  -0.3, -0.5,  0.3, -0.5,  0.5, 0.2
    ]);
    const n = 5;  // Number of vertices

    // Create a buffer object
    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.error('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to the ARRAY_BUFFER target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write the vertex data to the buffer
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Get the storage location of a_Position
    const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.error('Failed to get the storage location of a_Position');
        return -1;
    }

    // Assign the buffer object to the a_Position variable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    return n;
}

function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
    // Set the rotation matrix
    modelMatrix.setRotate(currentAngle, 0, 0, 1);

    // Pass the rotation matrix to the vertex shader
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Draw the polygon
    gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
}

function animate(angle, step) {
    const now = Date.now();
    const elapsed = now - g_last;
    g_last = now;
    const newAngle = angle + (step * elapsed) / 1000.0;
    return newAngle % 360;
}

let g_last = Date.now();

main();