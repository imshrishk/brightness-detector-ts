interface ProcessedFile {
    id: string;
    file: File;
    status: 'processing' | 'completed' | 'error';
    result?: AnalysisResult;
    error?: string;
}

class BrightnessAnalyzer {
    private processedFiles: ProcessedFile[] = [];
    private readonly CONCURRENCY_LIMIT = 4;

    constructor() {
        this.initialize();
    }

    private initialize() {
        setupDragAndDrop(
            document.getElementById('dropZone')!,
            document.getElementById('fileInput') as HTMLInputElement,
            (files: File[]) => this.handleFiles(files)
        );
    }

    private async handleFiles(files: File[]) {
        this.processedFiles = files.map(file => ({
            id: Math.random().toString(36).slice(2, 11),
            file,
            status: 'processing'
        }));
        this.renderResults();

        const batches = [];
        for (let i = 0; i < files.length; i += this.CONCURRENCY_LIMIT) {
            batches.push(files.slice(i, i + this.CONCURRENCY_LIMIT));
        }

        for (const batch of batches) {
            await Promise.all(batch.map(file => this.processFile(file)));
        }
    }

    private async processFile(file: File) {
        try {
            const result = await analyzeBrightness(file);
            this.updateFileStatus(file.name, 'completed', result);
        } catch (error) {
            this.updateFileStatus(
                file.name,
                'error',
                undefined,
                error instanceof Error ? error.message : 'Processing failed'
            );
        }
    }

    private updateFileStatus(
        fileName: string,
        status: 'completed' | 'error',
        result?: AnalysisResult,
        error?: string
    ) {
        this.processedFiles = this.processedFiles.map(pf =>
            pf.file.name === fileName ? {
                ...pf,
                status,
                result,
                error
            } : pf
        );
        this.renderResults();
    }

    private renderResults() {
        const container = document.getElementById('resultsContainer')!;
        container.innerHTML = this.processedFiles.map(file => `
            <div class="result-card">
                <div class="result-header">
                    <div class="result-title" title="${file.file.name}">${file.file.name}</div>
                    <div class="result-status status-${file.status}">
                        ${file.status.toUpperCase()}
                    </div>
                </div>
                ${file.status === 'completed' ? `
                    <canvas class="result-canvas" id="canvas-${file.id}"></canvas>
                    <div class="result-metrics">
                        <div class="metric-item">
                            <span class="metric-label">Max Brightness</span>
                            <span class="metric-value">${file.result!.maxBrightness.toFixed(1)}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Average (10px radius)</span>
                            <span class="metric-value">${file.result!.radiusMean.toFixed(1)}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Location (x, y)</span>
                            <span class="metric-value">${file.result!.brightestX}, ${file.result!.brightestY}</span>
                        </div>
                    </div>
                ` : ''}
                ${file.status === 'error' ? `
                    <div class="error-message">${file.error}</div>
                ` : ''}
            </div>
        `).join('');

        this.processedFiles
            .filter(file => file.status === 'completed')
            .forEach(file => this.renderCanvas(file));
    }

    private renderCanvas(file: ProcessedFile) {
        const canvas = document.getElementById(`canvas-${file.id}`) as HTMLCanvasElement;
        if (!canvas || !file.result) return;

        const ctx = canvas.getContext('2d')!;
        const { frame, brightestX, brightestY } = file.result;

        canvas.width = frame.width;
        canvas.height = frame.height;

        ctx.putImageData(frame, 0, 0);

        // Draw crosshair
        ctx.beginPath();
        ctx.arc(brightestX, brightestY, 10, 0, Math.PI * 2);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(brightestX - 15, brightestY);
        ctx.lineTo(brightestX + 15, brightestY);
        ctx.moveTo(brightestX, brightestY - 15);
        ctx.lineTo(brightestX, brightestY + 15);
        ctx.stroke();
    }
}
