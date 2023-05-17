const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random')
const math = require('canvas-sketch-util/math')
const colormap = require('colormap')

const data = new Date();
const segundos = data.getSeconds();

const settings = {
    dimensions: [1080, 1080],
    animate: true,
};

let audio;
let audioContext, audioData, sourceNode, analyserNode;
let manager;
let minDb, maxDb;

const sketch = ({ width, height }) => {
    const cols = 72;
    const rows = 8;
    const numCells = cols * rows;

    //grid
    const gw = width * 0.8
    const gh = height * 0.8
    //cell
    const cw = gw / cols;
    const ch = gh / rows;
    //margin
    const mx = (width - gw) * 0.5
    const my = (height - gh) * 0.5;

    const points = []

    let x, y, n, lineWidth, color;
    let frequency = 0.002;
    let amplitude = 90;

    const colors = colormap({
        colormap: 'magma',
        nshades: amplitude,
    })

    const bgColors = colormap({
        colormap: 'density',
        nshades: amplitude,
    })

    for (let i = 0; i < numCells; i++) {
        x = (i % cols) * cw;
        y = Math.floor(i / cols) * ch;

        n = random.noise2D(x, y, frequency, amplitude)
        // x += n
        // y += n

        lineWidth = math.mapRange(n, -amplitude, amplitude, 0, 5);

        color = colors[Math.floor(math.mapRange(n, -amplitude, amplitude, 0, amplitude))]

        points.push(new Point({ x, y, lineWidth, color }))
    }

    return ({ context, width, height, frame }) => {
        context.fillStyle = 'black'
        context.fillRect(0, 0, width, height);

        context.save()
        context.translate(mx, my)
        context.translate(cw * 0.5, ch * 0.5)
        context.strokeStyle = 'red'
        context.lineWidth = 4

        if (!audioContext) return
        analyserNode.getFloatFrequencyData(audioData)

        console.log(audioData)

        points.forEach(point => {
            n = random.noise2D(point.ix + frame * 10, point.iy, frequency, Math.abs(Math.floor(audioData[1])))
            point.x = point.ix + n;
            point.y = point.iy + n;
        })

        let lastx, lasty;

        //draw lines
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols - 1; c++) {
                const curr = points[r * cols + c + 0]
                const next = points[r * cols + c + 1]

                const mx = curr.x + (next.x - curr.x) * 0.5
                const my = curr.y + (next.y - curr.y) * 0.5

                if (!c) {
                    lastx = curr.x;
                    lasty = curr.y;
                }

                context.beginPath();
                context.lineWidth = curr.lineWidth
                context.strokeStyle = curr.color

                context.moveTo(lastx, lasty)
                context.quadraticCurveTo(curr.x, curr.y, mx + Math.abs(Math.floor(audioData[1])), my + Math.abs(Math.floor(audioData[1])))

                context.stroke();

                lastx = mx - c / cols * 250;
                lasty = my - r / rows * 250;
            }
        }

        //draw points
        points.forEach(point => {
            // point.draw(context)
        })

        context.restore()
    };
};

const addListeners = () => {
    window.addEventListener('mouseup', () => {
        if (!audioContext) createAudio()

        if (audio.paused) {
            audio.play();
            manager.play()
        }
        else {
            audio.pause();
            manager.pause()
        }
    })
}

const createAudio = () => {
    audio = document.createElement('audio')
    audio.src = 'music/PaisTropical.mp3'

    audioContext = new AudioContext()

    sourceNode = audioContext.createMediaElementSource(audio)
    sourceNode.connect(audioContext.destination)

    analyserNode = audioContext.createAnalyser()
    analyserNode.fftSize = 512
    analyserNode.smoothingTimeConstant = 0.9
    sourceNode.connect(analyserNode)

    minDb = analyserNode.minDecibels;
    maxDb = analyserNode.maxDecibels;

    audioData = new Float32Array(analyserNode.frequencyBinCount)

    // console.log(audioData)
}

const start = async () => {
    addListeners()
    manager = await canvasSketch(sketch, settings);
    manager.pause()
}

class Point {
    constructor({ x, y, lineWidth, color }) {
        this.x = x;
        this.y = y;
        this.lineWidth = lineWidth
        this.color = color

        this.ix = x;
        this.iy = y;
    }

    draw(context) {
        context.save();
        context.translate(this.x, this.y)
        context.fillStyle = 'red';

        context.beginPath()
        context.arc(0, 0, 10, 0, Math.PI * 2)
        context.fill()

        context.restore();
    }
}

start()
