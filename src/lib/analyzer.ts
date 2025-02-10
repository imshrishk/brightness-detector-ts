interface AnalysisResult {
    frame: ImageData;
    maxBrightness: number;
    radiusMean: number;
    brightestX: number;
    brightestY: number;
}

export async function analyzeBrightness(file: File): Promise<AnalysisResult> {
    const video = await createVideoElement(file);
    return await processVideoFrames(video);
}

async function processVideoFrames(video: HTMLVideoElement): Promise<AnalysisResult> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    let maxBrightness = -1;
    let brightestFrame: ImageData | null = null;
    let brightestX = 0, brightestY = 0;

    return new Promise((resolve, reject) => {
        video.addEventListener('play', function processFrame() {
            if (video.paused || video.ended) {
                if (!brightestFrame) return reject(new Error('No frames processed'));
                resolve({ frame: brightestFrame, maxBrightness, radiusMean: calculateRadiusMean(brightestFrame, brightestX, brightestY), brightestX, brightestY });
                return;
            }

            ctx.drawImage(video, 0, 0);
            const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const { brightness, x, y } = findBrightestPixel(frameData);

            if (brightness > maxBrightness) {
                maxBrightness = brightness;
                brightestFrame = frameData;
                brightestX = x;
                brightestY = y;
            }

            requestAnimationFrame(processFrame);
        });

        video.play();
    });
}

function findBrightestPixel(frame: ImageData): { brightness: number; x: number; y: number } {
    const data = frame.data;
    let maxBrightness = -1, maxIndex = -1;

    for (let i = 0; i < data.length; i += 4) {
        const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (brightness > maxBrightness) {
            maxBrightness = brightness;
            maxIndex = i / 4;
        }
    }

    const x = maxIndex % frame.width;
    const y = Math.floor(maxIndex / frame.width);
    return { brightness: maxBrightness, x, y };
}

function calculateRadiusMean(frame: ImageData, x: number, y: number): number {
    const data = frame.data;
    const radius = 10;
    let sum = 0, count = 0;

    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const px = x + dx;
            const py = y + dy;
            if (px >= 0 && px < frame.width && py >= 0 && py < frame.height) {
                const index = (py * frame.width + px) * 4;
                sum += 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
                count++;
            }
        }
    }

    return sum / count;
}

async function createVideoElement(file: File): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'auto';
        video.src = URL.createObjectURL(file);
        video.muted = true;

        video.addEventListener('loadedmetadata', () => resolve(video));
        video.addEventListener('error', (err) => reject(err));
    });
}
