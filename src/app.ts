import { AnalysisResult } from './types';
import { analyzeBrightness } from './lib/analyzer';
import { setupDragAndDrop } from './lib/utils';

export function initializeApp() {
    setupDragAndDrop(
        document.getElementById('dropZone')!,
        document.getElementById('fileInput') as HTMLInputElement,
        async (file: File) => {
            try {
                showLoading();
                const result = await analyzeBrightness(file);
                displayResults(result);
            } catch (error) {
                showError(error instanceof Error ? error.message : 'Processing failed');
            }
        }
    );
}

function showLoading() {
    const resultDiv = document.getElementById('result')!;
    resultDiv.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Analyzing video...
        </div>
    `;
}

function displayResults(result: AnalysisResult) {
    const resultDiv = document.getElementById('result')!;
    resultDiv.innerHTML = `
        <div class="result-card">
            <h3>Analysis Results</h3>
            <canvas id="resultCanvas"></canvas>
            <div class="metrics">
                <div class="metric">
                    <span class="label">Maximum Brightness</span>
                    <span class="value">${result.maxBrightness.toFixed(1)}</span>
                </div>
                <div class="metric">
                    <span class="label">Average Brightness (10px Radius)</span>
                    <span class="value">${result.radiusMean.toFixed(1)}</span>
                </div>
                <div class="metric">
                    <span class="label">Location (X, Y)</span>
                    <span class="value">${result.brightestX}, ${result.brightestY}</span>
                </div>
            </div>
        </div>
    `;

    const canvas = document.getElementById('resultCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    
    //Set canvas size while maintaining aspect ratio
    const maxWidth = resultDiv.clientWidth - 64;
    const scale = maxWidth / result.frame.width;
    canvas.width = result.frame.width;
    canvas.height = result.frame.height;
    
    //Draw the frame
    ctx.putImageData(result.frame, 0, 0);
    
    //Draw target indicator
    ctx.beginPath();
    ctx.arc(result.brightestX, result.brightestY, 10, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    //Draw crosshair
    ctx.beginPath();
    ctx.moveTo(result.brightestX - 15, result.brightestY);
    ctx.lineTo(result.brightestX + 15, result.brightestY);
    ctx.moveTo(result.brightestX, result.brightestY - 15);
    ctx.lineTo(result.brightestX, result.brightestY + 15);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function showError(message: string) {
    const resultDiv = document.getElementById('result')!;
    resultDiv.innerHTML = `
        <div class="error">
            <i class="fas fa-exclamation-circle"></i>
            ${message}
        </div>
    `;
}
