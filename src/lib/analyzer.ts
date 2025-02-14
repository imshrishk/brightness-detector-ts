export async function analyzeBrightness(file: File): Promise<AnalysisResult> {
    const isImage = file.type.startsWith('image/');
    return isImage ? processImage(file) : processVideo(file);
}

async function processImage(file: File): Promise<AnalysisResult> {
    const img = await createImageElement(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { brightness, x, y } = findBrightestPixel(frameData);
    const radiusMean = calculateRadiusMean(frameData, x, y);
    
    return {
        frame: frameData,
        maxBrightness: brightness,
        radiusMean,
        brightestX: x,
        brightestY: y
    };
}

async function processVideo(file: File): Promise<AnalysisResult> {
    const video = await createVideoElement(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    let maxBrightness = -1;
    let brightestFrame: ImageData | null = null;
    let brightestX = 0;
    let brightestY = 0;

    const processFrame = () => {
        ctx.drawImage(video, 0, 0);
        const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { brightness, x, y } = findBrightestPixel(frameData);
        
        if (brightness > maxBrightness) {
            maxBrightness = brightness;
            brightestFrame = frameData;
            brightestX = x;
            brightestY = y;
        }
    };

    return new Promise((resolve, reject) => {
        video.addEventListener('loadedmetadata', async () => {
            try {
                const duration = video.duration;
                const interval = 0.1; // Check every 100ms
                
                for (let time = 0; time <= duration; time += interval) {
                    video.currentTime = time;
                    await new Promise(resolve => video.addEventListener('seeked', resolve, { once: true }));
                    processFrame();
                }

                if (!brightestFrame) {
                    throw new Error('No frames processed');
                }

                resolve({
                    frame: brightestFrame,
                    maxBrightness,
                    radiusMean: calculateRadiusMean(brightestFrame, brightestX, brightestY),
                    brightestX,
                    brightestY
                });
            } catch (error) {
                reject(error);
            }
        });

        video.addEventListener('error', reject);
    });
}

function findBrightestPixel(frame: ImageData): { brightness: number; x: number; y: number } {
    let maxBrightness = -1;
    let maxIndex = -1;

    for (let i = 0; i < frame.data.length; i += 4) {
        const brightness = 
            0.299 * frame.data[i] +
            0.587 * frame.data[i + 1] +
            0.114 * frame.data[i + 2];

        if (brightness > maxBrightness) {
            maxBrightness = brightness;
            maxIndex = i / 4;
        }
    }

    return {
        brightness: maxBrightness,
        x: maxIndex % frame.width,
        y: Math.floor(maxIndex / frame.width)
    };
}

function calculateRadiusMean(frame: ImageData, x: number, y: number): number {
    const radius = 10;
    let sum = 0;
    let count = 0;

    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const px = x + dx;
            const py = y + dy;

            if (px >= 0 && px < frame.width && py >= 0 && py < frame.height) {
                const index = (py * frame.width + px) * 4;
                sum +=
                    0.299 * frame.data[index] +
                    0.587 * frame.data[index + 1] +
                    0.114 * frame.data[index + 2];
                count++;
            }
        }
    }

    return sum / count;
}

async function createImageElement(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

async function createVideoElement(file: File): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'auto';
        video.playsInline = true;
        video.muted = true;
        video.src = URL.createObjectURL(file);
        video.addEventListener('loadedmetadata', () => resolve(video));
        video.addEventListener('error', reject);
    });
}
